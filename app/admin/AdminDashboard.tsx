import Image from "next/image";
import Link from "next/link";
import { logout } from "./actions";
import { getActiveMenu, getEditableCarte } from "../lib/carte-repo";
import { getArdoise } from "../lib/ardoise-repo";
import type { Menu } from "../lib/carte-types";
import DashboardClient from "./dashboard/DashboardClient";

/**
 * Tableau de bord admin — « Votre assistant de carte » (UX façon Eazee Link).
 *
 * Server Component : lit directement la donnée (carte en ligne, brouillon
 * éditable, ardoise) et la passe au composant client d'orchestration. La
 * déconnexion passe par la Server Action `logout`.
 *
 * `getEditableCarte()` crée le brouillon (copie de l'active) au 1er appel : on
 * dispose donc toujours d'ids éditables pour le mode ÉDITION. On compare ensuite
 * ce brouillon à la carte en ligne pour n'afficher « Publier » qu'en cas de
 * vraie différence.
 */

/** Forme comparable d'une carte, sans ids ni positions (contenu + ordre). */
function normalize(menu: Menu) {
  return menu.categories.map((c) => ({
    label: c.label,
    note: c.note ?? null,
    active: c.active,
    groups: c.groups.map((g) => ({
      title: g.title ?? null,
      note: g.note ?? null,
      items: g.items.map((it) => ({
        name: it.name,
        desc: it.desc ?? null,
        available: it.available,
        price: it.price ?? null,
        vol: it.vol ?? null,
        prices: it.prices ?? null,
      })),
    })),
  }));
}

/** Nom du bar affiché dans l'en-tête. */
const BAR_NAME = "Bluebird";

/** Logiciel de caisse, hébergé sur un sous-domaine : ouvert dans un onglet. */
const CAISSE_URL = "https://caisse.bluebird-bar.fr";

export default function AdminDashboard() {
  const active = getActiveMenu();
  const editable = getEditableCarte();
  const ardoise = getArdoise();
  const hasChanges =
    JSON.stringify(normalize(active)) !== JSON.stringify(normalize(editable));

  return (
    <main className="mx-auto min-h-dvh max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <header className="flex flex-wrap items-center justify-between gap-6 border-b border-bb-gray-900/60 pb-8">
        <div className="flex items-center gap-4">
          <Image
            src="/brand/logos/bluebird-cocktailbar-white.png"
            alt="Bluebird — Cocktail Bar"
            width={810}
            height={251}
            className="h-auto w-32 opacity-90"
          />
          <span className="font-body text-[0.6rem] uppercase tracking-[0.4em] text-bb-red">
            Espace admin
          </span>
        </div>

        <div className="flex items-center gap-5">
          <a
            href={CAISSE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-body rounded-full border border-bb-red/60 px-5 py-2.5 text-[0.6rem] uppercase tracking-[0.3em] text-bb-red transition-colors hover:border-bb-red hover:bg-bb-red hover:text-bb-white"
          >
            Caisse ↗
          </a>
          <Link
            href="/"
            className="font-body text-[0.6rem] uppercase tracking-[0.3em] text-bb-white/60 transition-colors hover:text-bb-red"
          >
            Voir le site ↗
          </Link>
          <form action={logout}>
            <button
              type="submit"
              className="font-body rounded-full border border-bb-white/15 px-5 py-2.5 text-[0.6rem] uppercase tracking-[0.3em] text-bb-white/70 transition-colors hover:border-bb-red hover:text-bb-white"
            >
              Déconnexion
            </button>
          </form>
        </div>
      </header>

      <DashboardClient
        active={active}
        editable={editable}
        hasChanges={hasChanges}
        ardoise={ardoise}
        barName={BAR_NAME}
      />
    </main>
  );
}
