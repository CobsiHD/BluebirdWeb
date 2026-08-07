"use client";

import { useState } from "react";
import type { Menu } from "../../lib/carte-types";
import {
  duplicateCategoryAction,
  duplicateProductAction,
  editCategory,
  moveProductAction,
  removeCategory,
  removeProduct,
  reorderCategoriesAction,
  reorderProductsAction,
} from "../carte/actions";
import type { Selected } from "./selection";
import { countProducts, selectedLabel } from "./selection";
import { Button, ErrorNote, Modal, SelectField, useAction, useToast } from "./ui";

/**
 * ─────────────────────────────────────────────────────────────
 *  Modales de structure : déplacer, dupliquer, masquer, supprimer
 *  (CDC §16 · US-007, US-009, US-010, US-011, US-019, US-020, US-021).
 *
 *  Chacune énonce ce qu'elle va faire AVANT de le faire, nomme l'élément
 *  concerné, et distingue visuellement l'action destructive (§17).
 * ─────────────────────────────────────────────────────────────
 */

// ── Déplacer ─────────────────────────────────────────────────────────────

/**
 * Choix d'un emplacement. Une catégorie se déplace dans la carte ; un produit
 * peut en plus changer de catégorie (le groupe de destination est explicite,
 * car la carte Bluebird a des sous-groupes — Signature, Pressions, familles).
 */
export function MoveModal({
  menu,
  selected,
  onClose,
}: {
  menu: Menu;
  selected: Selected;
  onClose: () => void;
}) {
  const { pending, error, run } = useAction();
  const toast = useToast();

  // ── Catégorie : liste des positions possibles dans la carte.
  const categories = menu.categories;
  const currentCatIndex =
    selected.kind === "category"
      ? categories.findIndex((c) => c.id === selected.category.id)
      : -1;

  // ── Produit : tous les groupes de la carte, aplatis en destinations.
  const targets = menu.categories.flatMap((c) =>
    c.groups.map((g) => ({
      id: g.id,
      label: g.title ? `${c.label} · ${g.title}` : c.label,
      items: g.items,
    })),
  );

  const [position, setPosition] = useState(String(Math.max(currentCatIndex, 0)));
  const [groupId, setGroupId] = useState(
    selected.kind === "product" ? String(selected.group.id) : "",
  );
  const [index, setIndex] = useState(() => {
    if (selected.kind !== "product") return "0";
    const i = selected.group.items.findIndex((p) => p.id === selected.product.id);
    return String(Math.max(i, 0));
  });

  const target = targets.find((t) => t.id === Number(groupId));
  // Le produit déplacé ne compte pas comme destination pour lui-même.
  const siblings =
    selected.kind === "product"
      ? (target?.items ?? []).filter((p) => p.id !== selected.product.id)
      : [];

  function submitCategory() {
    if (selected.kind !== "category") return;
    const to = Number(position);
    const ids = categories.map((c) => c.id).filter((id) => id !== selected.category.id);
    ids.splice(to, 0, selected.category.id);
    run(() => reorderCategoriesAction(ids), () => {
      toast("Catégorie déplacée.");
      onClose();
    });
  }

  function submitProduct() {
    if (selected.kind !== "product") return;
    const targetGroupId = Number(groupId);
    const ids = siblings.map((p) => p.id);
    ids.splice(Number(index), 0, selected.product.id);

    run(
      async () => {
        if (targetGroupId !== selected.group.id) {
          const moved = await moveProductAction(selected.product.id, targetGroupId);
          if (!moved.ok) return moved;
        }
        return reorderProductsAction(targetGroupId, ids);
      },
      () => {
        toast("Produit déplacé.");
        onClose();
      },
    );
  }

  const isCategory = selected.kind === "category";

  return (
    <Modal
      title={`Déplacer « ${selectedLabel(selected)} »`}
      intro={
        isCategory
          ? "Choisissez la place de la catégorie dans la carte."
          : "Choisissez la catégorie d'accueil, puis la place du produit dans la liste."
      }
      onClose={onClose}
      footer={
        <>
          <Button variant="quiet" onClick={onClose} disabled={pending}>
            Annuler
          </Button>
          <Button
            variant="primary"
            onClick={isCategory ? submitCategory : submitProduct}
            disabled={pending}
          >
            {pending ? "Déplacement…" : "Déplacer"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3.5">
        {isCategory ? (
          <SelectField
            label="Position dans la carte"
            value={position}
            onChange={setPosition}
            options={categories
              .filter((c) => c.id !== selected.category.id)
              .map((c, i) => ({
                value: String(i + 1),
                label: `Après « ${c.label} »`,
              }))
              .concat([{ value: "0", label: "En première position" }])
              .sort((a, b) => Number(a.value) - Number(b.value))}
          />
        ) : (
          <>
            <SelectField
              label="Catégorie d'accueil"
              value={groupId}
              onChange={(v) => {
                setGroupId(v);
                setIndex("0");
              }}
              options={targets.map((t) => ({ value: String(t.id), label: t.label }))}
            />
            <SelectField
              label="Place dans la liste"
              value={index}
              onChange={setIndex}
              options={[{ value: "0", label: "En premier" }].concat(
                siblings.map((p, i) => ({
                  value: String(i + 1),
                  label: `Après « ${p.name} »`,
                })),
              )}
            />
          </>
        )}
        <ErrorNote>{error}</ErrorNote>
      </div>
    </Modal>
  );
}

// ── Dupliquer ────────────────────────────────────────────────────────────

export function DuplicateModal({
  selected,
  onClose,
}: {
  selected: Selected;
  onClose: () => void;
}) {
  const { pending, error, run } = useAction();
  const toast = useToast();
  const isCategory = selected.kind === "category";

  function submit() {
    run(
      () =>
        isCategory
          ? duplicateCategoryAction(selected.category.id)
          : duplicateProductAction(selected.product.id),
      () => {
        toast(isCategory ? "Catégorie dupliquée." : "Produit dupliqué.");
        onClose();
      },
    );
  }

  return (
    <Modal
      title={`Dupliquer « ${selectedLabel(selected)} »`}
      intro="La copie est créée juste en dessous de l'original, qui reste inchangé."
      onClose={onClose}
      footer={
        <>
          <Button variant="quiet" onClick={onClose} disabled={pending}>
            Annuler
          </Button>
          <Button variant="primary" onClick={submit} disabled={pending}>
            {pending ? "Duplication…" : "Dupliquer"}
          </Button>
        </>
      }
    >
      <div className="font-body text-xs leading-relaxed text-bb-white/90">
        {isCategory ? (
          <>
            <p>
              La copie reprend le nom (préfixé « Copie de »), la description,
              l&apos;état visible/masqué, ainsi que{" "}
              <strong className="text-bb-white">
                {countProducts(selected.category)} produit
                {countProducts(selected.category) > 1 ? "s" : ""}
              </strong>{" "}
              avec leurs prix et leur ordre.
            </p>
            <p className="mt-3 text-bb-white/70">
              Les modifications de la copie n&apos;affecteront pas l&apos;originale.
            </p>
          </>
        ) : (
          <p>
            La copie reprend la description, les prix et les formats. Son nom
            reçoit le suffixe «&nbsp;(copie)&nbsp;» pour la repérer.
          </p>
        )}
      </div>
      <ErrorNote>{error}</ErrorNote>
    </Modal>
  );
}

// ── Masquer une catégorie ────────────────────────────────────────────────

export function HideCategoryModal({
  selected,
  onClose,
}: {
  selected: Extract<Selected, { kind: "category" }>;
  onClose: () => void;
}) {
  const { pending, error, run } = useAction();
  const toast = useToast();

  return (
    <Modal
      title={`Masquer « ${selected.category.label} » ?`}
      intro="La catégorie sera retirée de la carte publique. Ses produits sont conservés."
      onClose={onClose}
      footer={
        <>
          <Button variant="quiet" onClick={onClose} disabled={pending}>
            Annuler
          </Button>
          <Button
            variant="danger"
            disabled={pending}
            onClick={() =>
              run(() => editCategory(selected.category.id, { active: false }), () => {
                toast("Catégorie masquée.");
                onClose();
              })
            }
          >
            {pending ? "Application…" : "Masquer"}
          </Button>
        </>
      }
    >
      <p className="font-body text-xs leading-relaxed text-bb-white/90">
        Vous pourrez la réafficher à tout moment avec l&apos;action
        «&nbsp;Activer&nbsp;».
      </p>
      <ErrorNote>{error}</ErrorNote>
    </Modal>
  );
}

// ── Supprimer ────────────────────────────────────────────────────────────

export function DeleteModal({
  selected,
  onClose,
  onDeleted,
}: {
  selected: Selected;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const { pending, error, run } = useAction();
  const toast = useToast();
  const isCategory = selected.kind === "category";
  const count = isCategory ? countProducts(selected.category) : 0;

  function submit() {
    run(
      () =>
        isCategory
          ? removeCategory(selected.category.id)
          : removeProduct(selected.product.id),
      () => {
        toast(isCategory ? "Catégorie supprimée." : "Produit supprimé.");
        onDeleted();
        onClose();
      },
    );
  }

  return (
    <Modal
      title={
        isCategory
          ? `Supprimer la catégorie « ${selected.category.label} » ?`
          : `Supprimer le produit « ${selected.product.name} » ?`
      }
      onClose={onClose}
      footer={
        <>
          <Button variant="quiet" onClick={onClose} disabled={pending}>
            Annuler
          </Button>
          <Button variant="danger" onClick={submit} disabled={pending}>
            {pending ? "Suppression…" : "Supprimer définitivement"}
          </Button>
        </>
      }
    >
      <div className="font-body text-xs leading-relaxed text-bb-white/90">
        {isCategory && count > 0 && (
          <p>
            Cette catégorie contient{" "}
            <strong className="text-bb-white">
              {count} produit{count > 1 ? "s" : ""}
            </strong>
            , qui seront supprimés avec elle.
          </p>
        )}
        <p className={isCategory && count > 0 ? "mt-3" : ""}>
          La suppression ne touche que le brouillon : la carte en ligne reste
          inchangée jusqu&apos;à la publication, et une version précédente peut
          toujours être restaurée.
        </p>
      </div>
      <ErrorNote>{error}</ErrorNote>
    </Modal>
  );
}
