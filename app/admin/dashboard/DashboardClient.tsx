"use client";

import { useState } from "react";
import type { Menu, MenuCategory, MenuGroup } from "../../lib/carte-types";
import type { Ardoise } from "../../lib/ardoise-repo";
import { editCategory, toggleAvailability } from "../carte/actions";
import ActionMenu from "./ActionMenu";
import ActionTiles from "./ActionTiles";
import ArdoiseEditor from "./ArdoiseEditor";
import { CategoryFormModal, ProductFormModal } from "./FormDialogs";
import MenuAccordion from "./MenuAccordion";
import PublishBar from "./PublishBar";
import {
  DeleteModal,
  DuplicateModal,
  HideCategoryModal,
  MoveModal,
} from "./StructureDialogs";
import type { ActionKind, Selection } from "./selection";
import { resolveSelection } from "./selection";
import { ToastProvider, useAction, useToast } from "./ui";

/**
 * ─────────────────────────────────────────────────────────────
 *  Orchestrateur client du tableau de bord « Votre assistant de carte ».
 *
 *  Il tient trois choses, et rien d'autre :
 *    1. le MODE            — lecture (carte en ligne) ou modification (brouillon) ;
 *    2. la SÉLECTION       — l'unique élément visé par le menu d'actions ;
 *    3. la MODALE ouverte  — conséquence d'une action ou d'un bouton « Créer ».
 *
 *  Toutes les données viennent en props du Server Component parent : après une
 *  mutation, la revalidation + `router.refresh` rafraîchissent ces props, qui
 *  restent la seule source de vérité. La sélection n'est qu'une paire
 *  (nature, id) re-résolue à chaque rendu — jamais une copie de l'élément.
 * ─────────────────────────────────────────────────────────────
 */

type Dialog =
  | { kind: "creer-categorie" }
  | { kind: "creer-produit"; group: MenuGroup; category: MenuCategory }
  | { kind: ActionKind };

function DashboardBody({
  active,
  editable,
  hasChanges,
  ardoise,
  barName,
}: {
  active: Menu;
  editable: Menu;
  hasChanges: boolean;
  ardoise: Ardoise;
  barName: string;
}) {
  const [editMode, setEditMode] = useState(false);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const { run } = useAction();
  const toast = useToast();

  const menu = editMode ? editable : active;
  const selected = editMode ? resolveSelection(editable, selection) : null;

  function toggleEdit(on: boolean) {
    setEditMode(on);
    setSelection(null);
    setDialog(null);
  }

  /**
   * Une commande du menu flottant. « Désactiver / Activer » agit directement
   * quand rien n'est irréversible ; masquer une catégorie passe par une
   * confirmation (US-007). Les autres ouvrent leur modale.
   */
  function onAction(kind: ActionKind) {
    if (!selected) return;

    if (kind === "visibilite") {
      if (selected.kind === "product") {
        const next = !selected.product.available;
        run(() => toggleAvailability(selected.product.id, next), () =>
          toast(next ? "Produit remis en vente." : "Produit marqué épuisé."),
        );
        return;
      }
      if (selected.category.active) {
        setDialog({ kind: "visibilite" });
        return;
      }
      run(() => editCategory(selected.category.id, { active: true }), () =>
        toast("Catégorie réaffichée."),
      );
      return;
    }

    setDialog({ kind });
  }

  return (
    <div className="mt-8">
      <h1 className="font-display text-2xl uppercase leading-none tracking-wide text-bb-white sm:text-3xl">
        Votre assistant de carte
      </h1>

      <div className="mt-5 rounded-2xl border-2 border-bb-white/20 px-5 py-5 text-center">
        <span className="font-body text-[0.58rem] uppercase tracking-[0.35em] text-bb-white/70">
          Carte actuellement en ligne
        </span>
        <p className="font-display mt-2 text-3xl uppercase leading-none tracking-wide text-bb-white sm:text-4xl">
          {barName}
        </p>
      </div>

      <ActionTiles editMode={editMode} onToggleEdit={toggleEdit} />

      {editMode && <PublishBar hasChanges={hasChanges} />}

      <section className="mt-7">
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <h2 className="font-display text-xl uppercase tracking-wide text-bb-white">
            {editMode ? "Édition du menu" : "Aperçu de la carte"}
          </h2>
          <span
            className={`font-body rounded-full px-2.5 py-0.5 text-[0.56rem] uppercase tracking-[0.2em] ${
              editMode
                ? "border-2 border-bb-red text-bb-white"
                : "text-bb-white/70"
            }`}
          >
            {editMode ? "Brouillon" : "En ligne"}
          </span>
        </div>

        {editMode && (
          <p className="font-body mb-3 text-xs leading-relaxed text-bb-white/75">
            Sélectionnez une catégorie ou un produit, puis ouvrez le bouton
            d&apos;actions en bas à droite.
          </p>
        )}

        <MenuAccordion
          menu={menu}
          editMode={editMode}
          selection={selection}
          onSelect={setSelection}
          onCreateCategory={() => setDialog({ kind: "creer-categorie" })}
          onCreateProduct={(group, category) =>
            setDialog({ kind: "creer-produit", group, category })
          }
        />
      </section>

      <ArdoiseEditor ardoise={ardoise} />

      {editMode && <ActionMenu selected={selected} onAction={onAction} />}

      {/* ── Modales ─────────────────────────────────────────────────────── */}

      {dialog?.kind === "creer-categorie" && (
        <CategoryFormModal onClose={() => setDialog(null)} />
      )}

      {dialog?.kind === "creer-produit" && (
        <ProductFormModal
          groupId={dialog.group.id}
          categoryLabel={dialog.category.label}
          onClose={() => setDialog(null)}
        />
      )}

      {dialog?.kind === "modifier" &&
        selected &&
        (selected.kind === "category" ? (
          <CategoryFormModal
            category={selected.category}
            onClose={() => setDialog(null)}
          />
        ) : (
          <ProductFormModal
            product={selected.product}
            groupId={selected.group.id}
            categoryLabel={selected.category.label}
            onClose={() => setDialog(null)}
          />
        ))}

      {dialog?.kind === "visibilite" && selected?.kind === "category" && (
        <HideCategoryModal selected={selected} onClose={() => setDialog(null)} />
      )}

      {dialog?.kind === "deplacer" && selected && (
        <MoveModal
          menu={editable}
          selected={selected}
          onClose={() => setDialog(null)}
        />
      )}

      {dialog?.kind === "dupliquer" && selected && (
        <DuplicateModal selected={selected} onClose={() => setDialog(null)} />
      )}

      {dialog?.kind === "supprimer" && selected && (
        <DeleteModal
          selected={selected}
          onClose={() => setDialog(null)}
          onDeleted={() => setSelection(null)}
        />
      )}
    </div>
  );
}

export default function DashboardClient(props: {
  active: Menu;
  editable: Menu;
  hasChanges: boolean;
  ardoise: Ardoise;
  barName: string;
}) {
  return (
    <ToastProvider>
      <DashboardBody {...props} />
    </ToastProvider>
  );
}
