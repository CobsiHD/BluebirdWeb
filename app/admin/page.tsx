import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken } from "../lib/admin-session";
import LoginScreen from "./LoginScreen";
import AdminDashboard from "./AdminDashboard";

/**
 * Porte d'entrée de l'espace admin. Lit le cookie de session (ce qui rend la
 * route dynamique, rendue à chaque requête) et vérifie sa signature : session
 * valide → tableau de bord, sinon → écran de connexion.
 *
 * Cette vérification au rendu double celle du `proxy` (garde optimiste) et des
 * Server Actions (qui authentifient chacune leur traitement).
 */
export default async function AdminPage() {
  const cookieStore = await cookies();
  const authenticated = verifySessionToken(
    cookieStore.get(SESSION_COOKIE)?.value,
  );

  return authenticated ? <AdminDashboard /> : <LoginScreen />;
}
