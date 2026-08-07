import { requireAdmin } from "../../lib/admin-guard";
import {
  getEditableCarte,
  getParcoursCocktails,
  listVersions,
} from "../../lib/carte-repo";
import CarteEditor from "./CarteEditor";

/**
 * Éditeur de carte — Server Component protégé.
 *
 *  • `requireAdmin()` en tête : session absente/invalide → redirection vers
 *    l'écran de connexion (la garde lève, le rendu ne se poursuit pas).
 *  • `getEditableCarte()` fait ENTRER en mode édition : il crée le brouillon en
 *    copiant la version publiée au 1er appel, puis renvoie toujours ce même
 *    brouillon tant qu'il n'est pas publié. Toute mutation ultérieure opère
 *    dessus.
 *  • `getParcoursCocktails()` (version publiée) sert de préremplissage
 *    best-effort au panneau Parcours de l'éditeur.
 *  • Objets 100% sérialisables → passés tels quels au Client Component.
 *
 * Lecture dynamique (cookie + SQLite) : pas de rendu statique forcé.
 */
export default async function CartePage() {
  await requireAdmin();

  const menu = getEditableCarte();
  const versions = listVersions();
  const parcours = getParcoursCocktails();

  return <CarteEditor menu={menu} versions={versions} parcours={parcours} />;
}
