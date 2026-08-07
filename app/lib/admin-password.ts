import "server-only";
import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { getDb } from "./db";

/**
 * ─────────────────────────────────────────────────────────────
 *  Mot de passe de l'espace admin — stocké HACHÉ, jamais en clair.
 *
 *  L'empreinte vit dans la table `settings` (clé `admin_password_hash`), donc
 *  dans la base — hors du dépôt, hors des variables d'environnement, hors de
 *  toute sauvegarde de configuration. Personne ne peut relire le mot de passe :
 *  le serveur sait seulement vérifier qu'une saisie lui correspond.
 *
 *  Algorithme : scrypt (dérivation lente, résistante au matériel dédié), sel
 *  aléatoire par mot de passe, paramètres inscrits dans l'empreinte pour
 *  pouvoir les durcir plus tard sans invalider l'existant.
 *
 *      scrypt$<N>$<r>$<p>$<sel hex>$<clé hex>
 *
 *  Premier mot de passe : `npm run admin:motdepasse` (saisie masquée).
 *  Changements ultérieurs : écran dédié dans /admin.
 * ─────────────────────────────────────────────────────────────
 */

/** Clé de rangement dans `settings`. */
const SETTING_KEY = "admin_password_hash";

/** Paramètres scrypt courants (~100 ms sur le VPS). */
const N = 16_384;
const R = 8;
const P = 1;
const KEYLEN = 64;
const SALT_BYTES = 16;

/** Longueur minimale exigée à la définition d'un mot de passe. */
export const PASSWORD_MIN = 10;

/** Dérive une empreinte complète (paramètres + sel + clé) depuis un mot de passe. */
export function hashPassword(plain: string): string {
  const salt = randomBytes(SALT_BYTES);
  const key = scryptSync(plain.normalize("NFKC"), salt, KEYLEN, { N, r: R, p: P });
  return `scrypt$${N}$${R}$${P}$${salt.toString("hex")}$${key.toString("hex")}`;
}

/**
 * Vérifie une saisie contre une empreinte stockée, en temps constant. Renvoie
 * `false` sur toute empreinte illisible plutôt que de lever : un enregistrement
 * corrompu doit refuser l'accès, pas ouvrir une porte.
 */
export function matchesHash(plain: string, stored: string): boolean {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;

  const [, n, r, p, saltHex, keyHex] = parts;
  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(keyHex, "hex");
  if (salt.length === 0 || expected.length === 0) return false;

  try {
    const candidate = scryptSync(plain.normalize("NFKC"), salt, expected.length, {
      N: Number(n),
      r: Number(r),
      p: Number(p),
    });
    return timingSafeEqual(candidate, expected);
  } catch {
    return false;
  }
}

// ── Rangement en base ────────────────────────────────────────────────────

/** Empreinte enregistrée, ou `null` si aucun mot de passe n'a encore été défini. */
export function getPasswordHash(): string | null {
  const row = getDb()
    .prepare("SELECT value FROM settings WHERE key = ?")
    .get(SETTING_KEY) as { value: string } | undefined;
  return row?.value ?? null;
}

/** Vrai si l'espace admin a un mot de passe (sinon la connexion est impossible). */
export function hasPassword(): boolean {
  return getPasswordHash() !== null;
}

/** Enregistre (ou remplace) le mot de passe sous forme d'empreinte. */
export function setPassword(plain: string): void {
  getDb()
    .prepare(
      `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now'))
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    )
    .run(SETTING_KEY, hashPassword(plain));
}

/**
 * Vérifie le mot de passe d'accès. Aucune repli sur une variable
 * d'environnement : la base est l'unique source de vérité.
 */
export function verifyAdminPassword(candidate: string): boolean {
  const stored = getPasswordHash();
  if (!stored) return false;
  return matchesHash(candidate, stored);
}

/**
 * Empreinte courte du mot de passe courant, embarquée dans le jeton de session.
 * Changer le mot de passe change cette valeur, ce qui invalide d'un coup TOUTES
 * les sessions ouvertes (CDC US-020) sans avoir à tenir une liste de sessions.
 */
export function passwordFingerprint(): string {
  const stored = getPasswordHash();
  if (!stored) return "none";
  return createHash("sha256").update(stored).digest("hex").slice(0, 16);
}
