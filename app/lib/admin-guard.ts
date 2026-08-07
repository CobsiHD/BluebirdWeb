import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, verifySessionToken } from "./admin-session";

/**
 * ─────────────────────────────────────────────────────────────
 *  Garde admin — à appeler EN TÊTE de chaque page et de chaque Server Action
 *  de l'espace de gestion.
 *
 *  Next 16 : `cookies()` est ASYNC. Une Server Action est un point d'entrée
 *  POST public : le proxy (garde optimiste) ne suffit pas, il FAUT revérifier
 *  la signature du jeton ici, côté serveur.
 *
 *  Session absente ou invalide → `redirect('/admin')` (l'écran de connexion).
 *  `redirect` lève une exception : le code appelant ne poursuit jamais si
 *  l'accès est refusé, `requireAdmin()` sert donc de barrière franche.
 * ─────────────────────────────────────────────────────────────
 */
export async function requireAdmin(): Promise<void> {
  const cookieStore = await cookies();
  const authenticated = verifySessionToken(
    cookieStore.get(SESSION_COOKIE)?.value,
  );
  if (!authenticated) {
    redirect("/admin");
  }
}
