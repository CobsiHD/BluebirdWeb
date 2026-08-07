import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";

/**
 * ─────────────────────────────────────────────────────────────
 *  Session admin — jeton signé, sans état côté serveur.
 *
 *  Un seul mot de passe (ADMIN_PASSWORD) protège l'espace. Une fois
 *  vérifié, on dépose un cookie httpOnly contenant un jeton signé
 *  HMAC-SHA256 avec ADMIN_SESSION_SECRET. Le serveur ne stocke rien :
 *  il lui suffit de revérifier la signature et la date d'expiration.
 *
 *  Réservé au serveur (`server-only`) : le secret ne doit jamais
 *  partir dans un bundle client.
 * ─────────────────────────────────────────────────────────────
 */

/** Nom du cookie de session. */
export const SESSION_COOKIE = "bb_admin";

/** Durée de vie d'une session, en secondes (7 jours). */
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

/** Version du format de jeton — permet une invalidation propre plus tard. */
const TOKEN_VERSION = 1;

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
 * Vérifie le mot de passe fourni contre ADMIN_PASSWORD, en temps constant.
 */
export function verifyPassword(candidate: string): boolean {
  const expected = requiredEnv("ADMIN_PASSWORD");
  return safeEqual(candidate, expected);
}

/**
 * Fabrique un jeton de session signé, valable SESSION_MAX_AGE secondes.
 */
export function createSessionToken(): string {
  const secret = requiredEnv("ADMIN_SESSION_SECRET");
  const exp = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE;
  const payloadB64 = b64url(JSON.stringify({ v: TOKEN_VERSION, exp }));
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
    ) as { v?: number; exp?: number };

    if (payload.v !== TOKEN_VERSION) return false;
    if (typeof payload.exp !== "number") return false;
    if (payload.exp < Math.floor(Date.now() / 1000)) return false;

    return true;
  } catch {
    return false;
  }
}
