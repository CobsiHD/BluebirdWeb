"use client";

import { useEffect, useRef, useState } from "react";
import type { ActionKind, Selected } from "./selection";
import { isVisible, selectedLabel } from "./selection";
import { useToast } from "./ui";

/**
 * ─────────────────────────────────────────────────────────────
 *  Menu d'actions contextuelles flottant (CDC §2.5 · US-024).
 *
 *  Bouton rond en bas à droite : fermé il affiche « + », ouvert il pivote et
 *  déploie les cinq commandes vers le haut, chacune avec son libellé. Pensé
 *  pour le pouce, au téléphone, derrière le bar.
 *
 *  Il n'agit QUE sur l'élément sélectionné : sans sélection, un appui explique
 *  quoi faire plutôt que de présenter des commandes inertes.
 *
 *  Fermeture : choix d'une action, clic à l'extérieur, touche Échap, ou
 *  changement de sélection (§8).
 * ─────────────────────────────────────────────────────────────
 */

type Item = { kind: ActionKind; label: string; tone?: "danger" };

export default function ActionMenu({
  selected,
  onAction,
}: {
  selected: Selected | null;
  onAction: (kind: ActionKind) => void;
}) {
  const toast = useToast();
  const rootRef = useRef<HTMLDivElement>(null);

  // Le menu est ouvert POUR une sélection donnée : changer de sélection le
  // referme sans effet ni rendu en cascade — il porte toujours sur l'élément
  // que l'utilisateur a sous les yeux.
  const selectionId = selected
    ? `${selected.kind}-${selected.kind === "category" ? selected.category.id : selected.product.id}`
    : null;
  const [openFor, setOpenFor] = useState<string | null>(null);
  const open = openFor !== null && openFor === selectionId;
  const setOpen = (next: boolean) => setOpenFor(next ? selectionId : null);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenFor(null);
    }
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpenFor(null);
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  const visible = selected ? isVisible(selected) : true;
  const items: Item[] = [
    { kind: "modifier", label: "Modifier" },
    { kind: "visibilite", label: visible ? "Désactiver" : "Activer" },
    { kind: "deplacer", label: "Déplacer" },
    { kind: "dupliquer", label: "Dupliquer" },
    { kind: "supprimer", label: "Supprimer", tone: "danger" },
  ];

  function toggle() {
    if (!selected) {
      toast("Sélectionnez d'abord une catégorie ou un produit.", "error");
      return;
    }
    setOpen(!open);
  }

  return (
    <div
      ref={rootRef}
      className="pointer-events-none fixed bottom-5 right-4 z-50 flex flex-col items-end gap-2.5"
    >
      {open && selected && (
        <div
          className="pointer-events-auto flex flex-col items-end gap-2"
          role="menu"
          aria-label={`Actions sur ${selectedLabel(selected)}`}
        >
          {items.map((item) => (
            <button
              key={item.kind}
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onAction(item.kind);
              }}
              className={`font-body flex min-h-11 items-center gap-3 rounded-full border-2 px-5 py-2.5 text-[0.66rem] uppercase tracking-[0.2em] shadow-lg transition-colors duration-200 ${
                item.tone === "danger"
                  ? "border-bb-red bg-bb-red/25 text-bb-white hover:bg-bb-red"
                  : "border-bb-white/50 bg-bb-black text-bb-white hover:border-bb-red hover:bg-bb-red/25"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={
          selected
            ? `Actions sur ${selectedLabel(selected)}`
            : "Actions — sélectionnez d'abord un élément"
        }
        className={`pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full border-2 text-2xl leading-none shadow-xl transition-all duration-200 ${
          selected
            ? "border-bb-red bg-bb-red text-bb-white"
            : "border-bb-white/40 bg-bb-gray-900 text-bb-white/70"
        } ${open ? "rotate-45" : ""}`}
      >
        <span aria-hidden>+</span>
      </button>
    </div>
  );
}
