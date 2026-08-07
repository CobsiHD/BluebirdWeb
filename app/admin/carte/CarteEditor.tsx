"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type {
  Menu,
  MenuVersionInfo,
  ParcoursCocktail,
} from "../../lib/carte-types";
import { addCategory, reorderCategoriesAction } from "./actions";
import { Button, ErrorNote, TextField, useAction } from "./editor-ui";
import CategoryCard from "./CategoryCard";
import VersionsPanel from "./VersionsPanel";

function moved<T extends { id: number }>(list: T[], from: number, dir: number): number[] {
  const to = from + dir;
  const ids = list.map((x) => x.id);
  if (to < 0 || to >= ids.length) return ids;
  [ids[from], ids[to]] = [ids[to], ids[from]];
  return ids;
}

/**
 * Orchestrateur de l'éditeur de carte (Client Component). Les données viennent
 * en props du Server Component : après chaque mutation, la revalidation côté
 * serveur rafraîchit ces props toutes seules — le composant lit donc toujours
 * la source de vérité, sans miroir d'état local de l'arbre.
 */
export default function CarteEditor({
  menu,
  versions,
  parcours,
}: {
  menu: Menu;
  versions: MenuVersionInfo[];
  parcours: ParcoursCocktail[];
}) {
  const cats = useAction();
  const [newCat, setNewCat] = useState("");

  // Préremplissage best-effort du parcours, indexé par nom de produit.
  const parcoursByName = useMemo(() => {
    const map = new Map<string, ParcoursCocktail>();
    for (const c of parcours) map.set(c.name, c);
    return map;
  }, [parcours]);

  function add() {
    if (!newCat.trim()) return;
    cats.run(() => addCategory({ label: newCat.trim() }), () => setNewCat(""));
  }

  function moveCategory(index: number, dir: number) {
    cats.run(() => reorderCategoriesAction(moved(menu.categories, index, dir)));
  }

  return (
    <main className="mx-auto min-h-dvh max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
      <header className="flex flex-wrap items-center justify-between gap-5 border-b border-bb-gray-900/60 pb-6">
        <div>
          <span className="font-body text-[0.6rem] uppercase tracking-[0.4em] text-bb-red">
            Espace admin · brouillon
          </span>
          <h1 className="font-display mt-2 text-3xl uppercase leading-none tracking-wide text-bb-white sm:text-4xl">
            Modifier la carte
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/admin"
            className="font-body text-[0.6rem] uppercase tracking-[0.3em] text-bb-white/60 transition-colors hover:text-bb-red"
          >
            ← Tableau de bord
          </Link>
          <Link
            href="/"
            className="font-body text-[0.6rem] uppercase tracking-[0.3em] text-bb-white/60 transition-colors hover:text-bb-red"
          >
            Voir le site ↗
          </Link>
        </div>
      </header>

      <p className="font-body mt-5 max-w-2xl text-sm leading-relaxed text-bb-white/70">
        Éditez librement : tout est enregistré dans un brouillon. Rien
        n&apos;est visible sur le site tant que vous n&apos;avez pas
        <strong className="text-bb-white"> publié</strong> (panneau Versions, en
        bas de page). L&apos;ordre se règle avec les flèches ▲▼.
      </p>

      <section className="mt-8 space-y-5">
        {menu.categories.map((c, i) => (
          <CategoryCard
            key={c.id}
            category={c}
            parcoursByName={parcoursByName}
            canUp={i > 0}
            canDown={i < menu.categories.length - 1}
            onMoveUp={() => moveCategory(i, -1)}
            onMoveDown={() => moveCategory(i, +1)}
            reordering={cats.pending}
          />
        ))}
        {menu.categories.length === 0 && (
          <p className="font-body text-sm text-bb-gray-500">
            Aucune catégorie pour l&apos;instant.
          </p>
        )}
      </section>

      <div className="mt-6 flex items-end gap-2 rounded-2xl border border-dashed border-bb-gray-900/60 px-4 py-5 sm:px-6">
        <div className="flex-1">
          <TextField
            label="Nouvelle catégorie"
            value={newCat}
            onChange={setNewCat}
            placeholder="ex. Bluebird's Hour"
          />
        </div>
        <Button variant="primary" onClick={add} disabled={cats.pending || !newCat.trim()}>
          + Créer
        </Button>
      </div>
      <ErrorNote>{cats.error}</ErrorNote>

      <VersionsPanel versions={versions} />
    </main>
  );
}
