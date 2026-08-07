import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { passwordFingerprint } from "./admin-password";

/**
 * ─────────────────────────────────────────────────────────────
 *  Session admin — jeton signé, sans état côté serveur.
 *
 *  Un seul mot de passe protège l'espace ; il vit HACHÉ en base (voir
 *  `admin-password.ts`). Une fois vérifié, on dépose un cookie httpOnly
 *  contenant un jeton signé HMAC-SHA256 avec ADMIN_SESSION_SECRET. Le serveur
 *  ne tient aucune liste de sessions : il lui suffit de revérifier la
 *  signature, la date d'expiration, et l'empreinte du mot de passe.
 *
 *  Cette empreinte (`k`) est la clef de l'invalidation : changer le mot de
 *  passe la fait changer, et tous les jetons émis avant deviennent caducs
 *  d'un coup (CDC US-020) — y compris sur les autres appareils.
 *
 *  Réservé au serveur (`server-only`) : le secret ne doit jamais
 *  partir dans un bundle client.
 * ─────────────────────────────────────────────────────────────
 */

/** Nom du cookie de session. */
export const SESSION_COOKIE = "bb_admin";

/** Durée de vie d'une session, en secondes (7 jours). */
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

/**
 * Version du format de jeton. Passée à 2 avec l'arrivée de l'empreinte `k` :
 * les jetons de l'ancien format sont refusés (reconnexion demandée).
 */
const TOKEN_VERSION = 2;

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Variable d'environnement manquante : ${name}. ` +
        "Renseignez-la dans .env.local (voir .env.example).",
    );
  }
  return value;
}

function sign(payloadB64: string, secret: string): string {
  return createHmac("sha256", secret).update(payloadB64).digest("base64url");
}

/** Compare deux chaînes en temps constant (résiste au timing attack). */
function safeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

/**
 * Fabrique un jeton de session signé, valable SESSION_MAX_AGE secondes. Il
 * embarque l'empreinte du mot de passe en vigueur au moment de l'émission.
 */
export function createSessionToken(): string {
  const secret = requiredEnv("ADMIN_SESSION_SECRET");
  const exp = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE;
  const payloadB64 = b64url(
    JSON.stringify({ v: TOKEN_VERSION, exp, k: passwordFingerprint() }),
  );
  const signature = sign(payloadB64, secret);
  return `${payloadB64}.${signature}`;
}

/**
 * Valide un jeton : signature intègre, version connue, non expiré.
 * Renvoie `true` si la session est valide.
 */
export function verifySessionToken(token: string | undefined | null): boolean {
  if (!token) return false;

  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) return false;

  const dot = token.indexOf(".");
  if (dot < 0) return false;

  const payloadB64 = token.slice(0, dot);
  const signature = token.slice(dot + 1);

  // Signature : recalcul puis comparaison en temps constant.
  if (!safeEqual(signature, sign(payloadB64, secret))) return false;

  try {
    const payload = JSON.parse(
      Buffer.from(payloadB64, "base64url").toString("utf8"),
    ) as { v?: number; exp?: number; k?: string };

    if (payload.v !== TOKEN_VERSION) return false;
    if (typeof payload.exp !== "number") return false;
    if (payload.exp < Math.floor(Date.now() / 1000)) return false;

    // Le mot de passe a-t-il changé depuis l'émission du jeton ? Si oui, la
    // session tombe — c'est ce qui déconnecte les autres appareils (US-020).
    // `passwordFingerprint()` vaut « none » sans mot de passe défini : aucun
    // jeton ne peut alors être valide.
    const current = passwordFingerprint();
    if (current === "none") return false;
    if (typeof payload.k !== "string" || !safeEqual(payload.k, current)) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}
