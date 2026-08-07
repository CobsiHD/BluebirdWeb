"use client";

import { useState } from "react";
import type { Menu, MenuCategory, MenuGroup, MenuItem } from "../../lib/carte-types";
import { addGroup } from "../carte/actions";
import type { Selection } from "./selection";
import { Button, ErrorNote, useAction } from "./ui";

/**
 * ─────────────────────────────────────────────────────────────
 *  La carte, en accordéon. Deux rendus selon le mode :
 *
 *   • LECTURE — aperçu fidèle de ce que voit le client (CDC US-040).
 *   • MODIFICATION — chaque catégorie et chaque produit devient SÉLECTIONNABLE
 *     (US-004 / US-013). La sélection ne modifie rien par elle-même : elle
 *     désigne la cible du menu d'actions flottant. Les éléments retirés de la
 *     carte publique portent un badge « Masqué » / « Épuisé » (US-022).
 *
 *  Le cercle à gauche sélectionne, le reste de la ligne plie ou déplie —
 *  deux gestes distincts, comme dans la référence.
 * ─────────────────────────────────────────────────────────────
 */

function priceLabel(item: {
  price?: string;
  vol?: string;
  prices?: { label: string; price: string }[];
}) {
  if (item.prices?.length) {
    return item.prices.map((p) => `${p.label} ${p.price} €`).join("  ·  ");
  }
  if (!item.price) return "—";
  return item.vol ? `${item.vol} · ${item.price} €` : `${item.price} €`;
}

// ── Rendu LECTURE d'une catégorie (aperçu « comme sur la carte ») ─────────

function ReadCategory({ category }: { category: MenuCategory }) {
  return (
    <div className="pb-6">
      {category.note && (
        <p className="font-body mb-4 max-w-md text-xs italic leading-relaxed text-bb-gray-500">
          {category.note}
        </p>
      )}
      {category.groups.map((g, gi) => (
        <div key={g.id} className={gi > 0 ? "mt-6" : ""}>
          {g.title && (
            <h4 className="font-body mb-1 text-[0.62rem] uppercase tracking-[0.35em] text-bb-red">
              {g.title}
            </h4>
          )}
          <ul>
            {g.items.map((it) => (
              <li
                key={it.id}
                className="border-b border-bb-gray-900/40 py-3 last:border-0"
              >
                <div className="flex items-baseline justify-between gap-4">
                  <span
                    className={`font-display text-base leading-tight sm:text-lg ${
                      it.available
                        ? "text-bb-white"
                        : "text-bb-gray-500 line-through"
                    }`}
                  >
                    {it.name}
                  </span>
                  <span className="font-body shrink-0 whitespace-nowrap text-xs tracking-wide text-bb-red sm:text-sm">
                    {priceLabel(it)}
                  </span>
                </div>
                {it.desc && (
                  <p className="font-body mt-1 max-w-md text-xs leading-relaxed text-bb-gray-500">
                    {it.desc}
                  </p>
                )}
                {!it.available && (
                  <span className="font-body text-[0.55rem] uppercase tracking-[0.25em] text-bb-gray-500">
                    Indisponible
                  </span>
                )}
              </li>
            ))}
            {g.items.length === 0 && (
              <li className="font-body py-2 text-xs text-bb-gray-500">
                Aucun produit.
              </li>
            )}
          </ul>
        </div>
      ))}
      {category.groups.length === 0 && (
        <p className="font-body text-xs text-bb-gray-500">Catégorie vide.</p>
      )}
    </div>
  );
}

// ── Éléments de sélection ────────────────────────────────────────────────

/** Cercle de sélection : vide, ou plein quand l'élément est la cible active. */
function SelectRing({ on }: { on: boolean }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden className="h-5 w-5 shrink-0">
      <circle
        cx="10"
        cy="10"
        r="8.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
      />
      {on && <circle cx="10" cy="10" r="5" fill="currentColor" />}
    </svg>
  );
}

/** Badge d'un élément retiré de la carte publique (CDC US-022). */
function HiddenBadge({ children }: { children: string }) {
  return (
    <span className="font-body shrink-0 rounded-full border-2 border-bb-white/50 px-2.5 py-0.5 text-[0.55rem] uppercase tracking-[0.2em] text-bb-white">
      {children}
    </span>
  );
}

/** Une ligne produit sélectionnable. */
function ProductRow({
  item,
  selected,
  onSelect,
}: {
  item: MenuItem;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        className={`flex w-full items-center gap-3 rounded-xl border-2 px-3.5 py-2.5 text-left transition-colors duration-200 ${
          selected
            ? "border-bb-red bg-bb-red/25 text-bb-white"
            : "border-bb-white/25 text-bb-white/70 hover:border-bb-white/60"
        }`}
      >
        <SelectRing on={selected} />
        <span className="min-w-0 flex-1">
          <span
            className={`font-display block truncate text-base leading-tight ${
              item.available ? "text-bb-white" : "text-bb-white/50 line-through"
            }`}
          >
            {item.name}
          </span>
          <span className="font-body block truncate text-xs text-bb-white/70">
            {priceLabel(item)}
          </span>
        </span>
        {!item.available && <HiddenBadge>Épuisé</HiddenBadge>}
      </button>
    </li>
  );
}

/** Bouton d'amorçage d'une catégorie encore dépourvue de groupe. */
function AddFirstGroup({ categoryId }: { categoryId: number }) {
  const { pending, error, run } = useAction();
  return (
    <div className="mt-3">
      <Button
        variant="ghost"
        disabled={pending}
        onClick={() => run(() => addGroup(categoryId, {}))}
      >
        + Commencer la liste des produits
      </Button>
      <ErrorNote>{error}</ErrorNote>
    </div>
  );
}

/** Contenu déplié d'une catégorie en mode Modification. */
function EditCategoryBody({
  category,
  selection,
  onSelect,
  onCreateProduct,
}: {
  category: MenuCategory;
  selection: Selection | null;
  onSelect: (s: Selection) => void;
  onCreateProduct: (group: MenuGroup, category: MenuCategory) => void;
}) {
  return (
    <div className="pb-6">
      {category.note && (
        <p className="font-body mb-3 max-w-md text-xs italic leading-relaxed text-bb-white/70">
          {category.note}
        </p>
      )}

      {category.groups.map((g, gi) => (
        <div key={g.id} className={gi > 0 ? "mt-5" : ""}>
          {g.title && (
            <h4 className="font-body mb-2 text-[0.62rem] uppercase tracking-[0.3em] text-bb-red">
              {g.title}
            </h4>
          )}
          <ul className="flex flex-col gap-2">
            {g.items.map((it) => (
              <ProductRow
                key={it.id}
                item={it}
                selected={selection?.kind === "product" && selection.id === it.id}
                onSelect={() => onSelect({ kind: "product", id: it.id })}
              />
            ))}
            {g.items.length === 0 && (
              <li className="font-body py-1 text-xs text-bb-white/70">
                Aucun produit dans cette liste.
              </li>
            )}
          </ul>
          <div className="mt-3">
            <Button variant="ghost" onClick={() => onCreateProduct(g, category)}>
              + Créer un produit
            </Button>
          </div>
        </div>
      ))}

      {category.groups.length === 0 && <AddFirstGroup categoryId={category.id} />}
    </div>
  );
}

// ── Accordéon ─────────────────────────────────────────────────────────────

export default function MenuAccordion({
  menu,
  editMode,
  selection,
  onSelect,
  onCreateCategory,
  onCreateProduct,
}: {
  menu: Menu;
  editMode: boolean;
  selection: Selection | null;
  onSelect: (s: Selection | null) => void;
  onCreateCategory: () => void;
  onCreateProduct: (group: MenuGroup, category: MenuCategory) => void;
}) {
  const categories = menu.categories;
  const [open, setOpen] = useState<number | null>(categories[0]?.id ?? null);

  if (categories.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-bb-white/30 px-5 py-8 text-center">
        <p className="font-body text-sm text-bb-white/80">
          Aucune catégorie pour l&apos;instant.
        </p>
        {editMode && (
          <div className="mt-4 flex justify-center">
            <Button variant="primary" onClick={onCreateCategory}>
              + Créer une catégorie
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      {editMode && (
        <div className="mb-3 flex justify-end">
          <Button variant="primary" onClick={onCreateCategory}>
            + Créer une catégorie
          </Button>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {categories.map((c) => {
          const isOpen = open === c.id;
          const isSelected =
            selection?.kind === "category" && selection.id === c.id;

          return (
            <div
              key={c.id}
              className={`overflow-hidden rounded-2xl border-2 transition-colors duration-200 ${
                isSelected
                  ? "border-bb-red bg-bb-red/15"
                  : editMode
                    ? "border-bb-white/25"
                    : "border-bb-gray-900/60"
              }`}
            >
              <div className="flex items-stretch">
                {editMode && (
                  <button
                    type="button"
                    onClick={() =>
                      onSelect(isSelected ? null : { kind: "category", id: c.id })
                    }
                    aria-pressed={isSelected}
                    aria-label={`Sélectionner la catégorie ${c.label}`}
                    className={`flex shrink-0 items-center pl-4 pr-1.5 transition-colors duration-200 ${
                      isSelected
                        ? "text-bb-red"
                        : "text-bb-white/70 hover:text-bb-white"
                    }`}
                  >
                    <SelectRing on={isSelected} />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : c.id)}
                  aria-expanded={isOpen}
                  className={`flex min-w-0 flex-1 items-center gap-3 px-4 text-left ${
                    editMode ? "py-3.5" : "py-4"
                  }`}
                >
                  <span
                    className={`font-display min-w-0 flex-1 truncate uppercase tracking-wide text-bb-white ${
                      editMode ? "text-lg" : "text-lg"
                    }`}
                  >
                    {c.label}
                  </span>
                  {!c.active && <HiddenBadge>Masqué</HiddenBadge>}
                  <span
                    aria-hidden
                    className={`shrink-0 text-lg transition-transform duration-200 ${
                      editMode ? "text-bb-white/80" : "text-bb-gray-500"
                    } ${isOpen ? "rotate-180" : ""}`}
                  >
                    ▾
                  </span>
                </button>
              </div>

              {isOpen && (
                <div className="px-4">
                  {editMode ? (
                    <EditCategoryBody
                      category={c}
                      selection={selection}
                      onSelect={onSelect}
                      onCreateProduct={onCreateProduct}
                    />
                  ) : (
                    <ReadCategory category={c} />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
