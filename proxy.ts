import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Proxy (ex-« middleware », renommé dans Next 16).
 *
 * Garde OPTIMISTE des sous-routes de l'espace admin : si le cookie de session
 * est absent, on renvoie vers l'écran de connexion sans même exécuter la page.
 * La vérification RÉELLE de la signature reste en aval — dans la page admin
 * (Server Component) et dans chaque Server Action —, seul endroit sûr pour
 * autoriser une action.
 *
 * Le matcher ne cible que `/admin/<quelque-chose>` : la base `/admin` porte le
 * login/tableau de bord et doit rester joignable même déconnecté.
 */
const SESSION_COOKIE = "bb_admin";

export function proxy(request: NextRequest) {
  const hasSession = request.cookies.has(SESSION_COOKIE);
  if (!hasSession) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: "/admin/:path+",
};
