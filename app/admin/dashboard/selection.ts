import type { Menu, MenuCategory, MenuGroup, MenuItem } from "../../lib/carte-types";

/**
 * ─────────────────────────────────────────────────────────────
 *  Modèle de SÉLECTION du mode Modification (CDC §3, US-004 / US-013).
 *
 *  Un seul élément est sélectionné à la fois — une catégorie OU un produit —
 *  et le menu d'actions flottant n'agit que sur lui. On ne conserve dans l'état
 *  React que la paire (nature, id) : le reste est re-résolu à chaque rendu
 *  depuis la carte venue du serveur, pour ne jamais travailler sur une copie
 *  périmée après une mutation.
 * ─────────────────────────────────────────────────────────────
 */

export type Selection =
  | { kind: "category"; id: number }
  | { kind: "product"; id: number };

/** Les cinq commandes du menu d'actions contextuelles (CDC §2.5). */
export type ActionKind =
  | "modifier"
  | "visibilite"
  | "deplacer"
  | "dupliquer"
  | "supprimer";

/** Sélection résolue : l'élément et son contexte dans la carte. */
export type Selected =
  | { kind: "category"; category: MenuCategory }
  | {
      kind: "product";
      product: MenuItem;
      group: MenuGroup;
      category: MenuCategory;
    };

/**
 * Retrouve l'élément sélectionné dans la carte courante. Renvoie `null` si
 * l'élément a disparu entre-temps (suppression, publication) : l'appelant
 * retombe alors proprement sur « aucune sélection ».
 */
export function resolveSelection(
  menu: Menu,
  selection: Selection | null,
): Selected | null {
  if (!selection) return null;

  if (selection.kind === "category") {
    const category = menu.categories.find((c) => c.id === selection.id);
    return category ? { kind: "category", category } : null;
  }

  for (const category of menu.categories) {
    for (const group of category.groups) {
      const product = group.items.find((p) => p.id === selection.id);
      if (product) return { kind: "product", product, group, category };
    }
  }
  return null;
}

/** Libellé de l'élément sélectionné, pour les titres de modales et les toasts. */
export function selectedLabel(selected: Selected): string {
  return selected.kind === "category"
    ? selected.category.label
    : selected.product.name;
}

/** Nombre de produits d'une catégorie (message de confirmation de suppression). */
export function countProducts(category: MenuCategory): number {
  return category.groups.reduce((n, g) => n + g.items.length, 0);
}

/** Vrai si l'élément est visible du public (catégorie active / produit dispo). */
export function isVisible(selected: Selected): boolean {
  return selected.kind === "category"
    ? selected.category.active
    : selected.product.available;
}
