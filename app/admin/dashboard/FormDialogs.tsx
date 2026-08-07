"use client";

import { useCallback, useRef, useState } from "react";
import type { MenuCategory, MenuItem, PriceInput } from "../../lib/carte-types";
import {
  addCategory,
  addProduct,
  editCategory,
  editProduct,
  savePrices,
  toggleAvailability,
} from "../carte/actions";
import PricesEditor from "./PricesEditor";
import { Button, ErrorNote, Modal, Switch, TextField, useAction, useToast } from "./ui";

/**
 * ─────────────────────────────────────────────────────────────
 *  Modales de saisie : créer / modifier une catégorie ou un produit
 *  (CDC §16 · US-003, US-005, US-006, US-012, US-014, US-015, US-016).
 *
 *  Deux règles communes :
 *    • les valeurs existantes sont préremplies, et « Annuler » ne modifie rien ;
 *    • quitter avec des modifications non enregistrées demande confirmation
 *      (US-033) — Échap, croix et clic sur le fond passent tous par ce garde-fou.
 * ─────────────────────────────────────────────────────────────
 */

/** Barre de pied commune : Annuler + action principale. */
function FormFooter({
  onCancel,
  onSubmit,
  submitLabel,
  pending,
  disabled,
}: {
  onCancel: () => void;
  onSubmit: () => void;
  submitLabel: string;
  pending: boolean;
  disabled?: boolean;
}) {
  return (
    <>
      <Button variant="quiet" onClick={onCancel} disabled={pending}>
        Annuler
      </Button>
      <Button variant="primary" onClick={onSubmit} disabled={pending || disabled}>
        {pending ? "Enregistrement…" : submitLabel}
      </Button>
    </>
  );
}

/** Confirmation de sortie quand des saisies n'ont pas été enregistrées. */
function LeaveGuard({
  onStay,
  onLeave,
}: {
  onStay: () => void;
  onLeave: () => void;
}) {
  return (
    <Modal
      title="Modifications non enregistrées"
      intro="Vos changements seront perdus si vous quittez maintenant."
      onClose={onStay}
      footer={
        <>
          <Button variant="quiet" onClick={onStay}>
            Continuer l&apos;édition
          </Button>
          <Button variant="danger" onClick={onLeave}>
            Quitter sans enregistrer
          </Button>
        </>
      }
    >
      <p className="font-body text-sm leading-relaxed text-bb-white/90">
        Souhaitez-vous vraiment fermer cette fenêtre&nbsp;?
      </p>
    </Modal>
  );
}

// ── Catégorie ────────────────────────────────────────────────────────────

export function CategoryFormModal({
  category,
  onClose,
}: {
  /** Absent = création ; présent = modification. */
  category?: MenuCategory;
  onClose: () => void;
}) {
  const { pending, error, setError, run } = useAction();
  const toast = useToast();
  const [label, setLabel] = useState(category?.label ?? "");
  const [note, setNote] = useState(category?.note ?? "");
  const [active, setActive] = useState(category?.active ?? true);
  const [asking, setAsking] = useState(false);

  const dirty =
    label !== (category?.label ?? "") ||
    note !== (category?.note ?? "") ||
    active !== (category?.active ?? true);

  function requestClose() {
    if (dirty && !pending) setAsking(true);
    else onClose();
  }

  function submit() {
    const clean = label.trim();
    if (!clean) {
      setError("Le nom de la catégorie est requis.");
      return;
    }
    const payload = { label: clean, note: note.trim(), active };
    if (category) {
      run(
        () =>
          editCategory(category.id, {
            label: payload.label,
            note: payload.note || null,
            active: payload.active,
          }),
        () => {
          toast("Modifications enregistrées.");
          onClose();
        },
      );
    } else {
      run(
        () =>
          addCategory({
            label: payload.label,
            note: payload.note || undefined,
            active: payload.active,
          }),
        () => {
          toast("Catégorie créée avec succès.");
          onClose();
        },
      );
    }
  }

  if (asking) {
    return <LeaveGuard onStay={() => setAsking(false)} onLeave={onClose} />;
  }

  return (
    <Modal
      title={category ? "Modifier la catégorie" : "Créer une catégorie"}
      intro={
        category
          ? "Les modifications restent en brouillon jusqu'à la publication."
          : "La catégorie est ajoutée en fin de carte ; utilisez « Déplacer » pour la repositionner."
      }
      onClose={requestClose}
      footer={
        <FormFooter
          onCancel={requestClose}
          onSubmit={submit}
          submitLabel={category ? "Enregistrer" : "Créer"}
          pending={pending}
          disabled={!label.trim()}
        />
      }
    >
      <div className="flex flex-col gap-3.5">
        <TextField
          label="Nom de la catégorie"
          value={label}
          onChange={setLabel}
          placeholder="ex. Bluebird's Hour"
        />
        <TextField
          label="Description (facultative)"
          value={note}
          onChange={setNote}
          placeholder="ex. 17h — 21h"
          multiline
        />
        <div className="flex items-center justify-between gap-4 rounded-xl border-2 border-bb-white/25 px-4 py-3">
          <span className="font-body text-sm text-bb-white">
            Visible sur la carte publique
          </span>
          <div className="flex items-center gap-3">
            <span className="font-body text-[0.62rem] uppercase tracking-[0.2em] text-bb-white/75">
              {active ? "Visible" : "Masquée"}
            </span>
            <Switch
              checked={active}
              onChange={setActive}
              label="Catégorie visible sur la carte publique"
            />
          </div>
        </div>
        <ErrorNote>{error}</ErrorNote>
      </div>
    </Modal>
  );
}

// ── Produit ──────────────────────────────────────────────────────────────

/** Produit vierge servant de valeurs par défaut au formulaire de création. */
const BLANK: MenuItem = { id: -1, name: "", available: true };

export function ProductFormModal({
  product,
  groupId,
  categoryLabel,
  onClose,
}: {
  /** Absent = création dans `groupId` ; présent = modification. */
  product?: MenuItem;
  groupId: number;
  categoryLabel: string;
  onClose: () => void;
}) {
  const { pending, error, setError, run } = useAction();
  const toast = useToast();
  const base = product ?? BLANK;
  const [name, setName] = useState(base.name);
  const [desc, setDesc] = useState(base.desc ?? "");
  const [available, setAvailable] = useState(base.available);
  const [touchedPrices, setTouchedPrices] = useState(false);
  const [asking, setAsking] = useState(false);

  // Miroir des tarifs remonté par PricesEditor (composant contrôlé).
  const prices = useRef<PriceInput[]>([]);
  const onPricesChange = useCallback((next: PriceInput[]) => {
    prices.current = next;
    setTouchedPrices(true);
  }, []);

  const dirty =
    name !== base.name ||
    desc !== (base.desc ?? "") ||
    available !== base.available ||
    touchedPrices;

  function requestClose() {
    if (dirty && !pending) setAsking(true);
    else onClose();
  }

  /** Un montant vide est accepté (produit sans prix) ; sinon il doit être un nombre. */
  function invalidAmount(): boolean {
    return prices.current.some((p) => !/^\d+([.,]\d{1,2})?$/.test(p.amount.trim()));
  }

  function submit() {
    const clean = name.trim();
    if (!clean) {
      setError("Le nom du produit est requis.");
      return;
    }
    if (invalidAmount()) {
      setError("Veuillez saisir un prix valide.");
      return;
    }
    const description = desc.trim() || null;

    if (product) {
      run(
        async () => {
          const patch = await editProduct(product.id, { name: clean, description });
          if (!patch.ok) return patch;
          if (available !== product.available) {
            const av = await toggleAvailability(product.id, available);
            if (!av.ok) return av;
          }
          return savePrices(product.id, prices.current);
        },
        () => {
          toast("Modifications enregistrées.");
          onClose();
        },
      );
    } else {
      run(
        async () => {
          const created = await addProduct(groupId, {
            name: clean,
            description: description ?? undefined,
            available,
          });
          if (!created.ok || created.id === undefined) return created;
          return savePrices(created.id, prices.current);
        },
        () => {
          toast("Produit créé avec succès.");
          onClose();
        },
      );
    }
  }

  if (asking) {
    return <LeaveGuard onStay={() => setAsking(false)} onLeave={onClose} />;
  }

  return (
    <Modal
      title={product ? "Modifier le produit" : "Créer un produit"}
      intro={`Catégorie : ${categoryLabel}`}
      onClose={requestClose}
      footer={
        <FormFooter
          onCancel={requestClose}
          onSubmit={submit}
          submitLabel={product ? "Enregistrer" : "Créer"}
          pending={pending}
          disabled={!name.trim()}
        />
      }
    >
      <div className="flex flex-col gap-3.5">
        <TextField
          label="Nom du produit"
          value={name}
          onChange={setName}
          placeholder="ex. Old Fashioned"
        />
        <TextField
          label="Description (facultative)"
          value={desc}
          onChange={setDesc}
          placeholder="Ingrédients, note de dégustation…"
          multiline
        />
        <PricesEditor item={base} onChange={onPricesChange} />
        <div className="flex items-center justify-between gap-4 rounded-xl border-2 border-bb-white/25 px-4 py-3">
          <span className="font-body text-sm text-bb-white">
            Disponible à la vente
          </span>
          <div className="flex items-center gap-3">
            <span className="font-body text-[0.62rem] uppercase tracking-[0.2em] text-bb-white/75">
              {available ? "Dispo" : "Épuisé"}
            </span>
            <Switch
              checked={available}
              onChange={setAvailable}
              label="Produit disponible"
            />
          </div>
        </div>
        <ErrorNote>{error}</ErrorNote>
      </div>
    </Modal>
  );
}
