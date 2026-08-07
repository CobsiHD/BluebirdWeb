"use client";

import { useRef, useState, useTransition } from "react";
import type {
  MenuItem,
  ParcoursCocktail,
  PriceInput,
} from "../../lib/carte-types";
import {
  editProduct,
  removeProduct,
  savePrices,
  toggleAvailability,
} from "./actions";
import {
  Button,
  ConfirmButton,
  ErrorNote,
  MoveButtons,
  TextField,
  useAction,
} from "./editor-ui";
import PricesEditor from "./PricesEditor";
import ParcoursPanel from "./ParcoursPanel";

/** Libellé compact des tarifs d'un produit (aperçu de la ligne). */
function priceLabel(item: MenuItem): string {
  if (item.prices?.length) {
    return item.prices.map((p) => `${p.label} ${p.price} €`).join("  ·  ");
  }
  if (item.price) {
    return item.vol ? `${item.vol} · ${item.price} €` : `${item.price} €`;
  }
  return "—";
}

export default function ProductRow({
  item,
  parcoursInitial,
  canUp,
  canDown,
  onMoveUp,
  onMoveDown,
  reordering,
}: {
  item: MenuItem;
  parcoursInitial?: ParcoursCocktail;
  canUp: boolean;
  canDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  reordering: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [showParcours, setShowParcours] = useState(false);
  const quick = useAction();

  // Édition (nom + description + prix) enchaînée en une transition.
  const [name, setName] = useState(item.name);
  const [desc, setDesc] = useState(item.desc ?? "");
  const pricesRef = useRef<PriceInput[]>([]);
  const [saving, startSaving] = useTransition();
  const [saveError, setSaveError] = useState<string | null>(null);

  function openEditor() {
    setName(item.name);
    setDesc(item.desc ?? "");
    setSaveError(null);
    setEditing(true);
  }

  function save() {
    setSaveError(null);
    startSaving(async () => {
      const r1 = await editProduct(item.id, {
        name: name.trim(),
        description: desc.trim() === "" ? null : desc.trim(),
      });
      if (!r1.ok) {
        setSaveError(r1.error);
        return;
      }
      const r2 = await savePrices(item.id, pricesRef.current);
      if (!r2.ok) {
        setSaveError(r2.error);
        return;
      }
      setEditing(false);
    });
  }

  return (
    <li className="border-b border-bb-gray-900/40 py-3 last:border-0">
      <div className="flex items-start gap-3">
        <MoveButtons
          onUp={onMoveUp}
          onDown={onMoveDown}
          canUp={canUp}
          canDown={canDown}
          disabled={reordering}
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span
              className={`font-body text-sm ${
                item.available ? "text-bb-white/90" : "text-bb-gray-500 line-through"
              }`}
            >
              {item.name}
            </span>
            {parcoursInitial && (
              <span className="font-body text-[0.5rem] uppercase tracking-[0.25em] text-bb-red">
                Parcours
              </span>
            )}
            <span className="font-body ml-auto shrink-0 whitespace-nowrap text-xs text-bb-gray-500">
              {priceLabel(item)}
            </span>
          </div>
          {item.desc && (
            <p className="font-body mt-1 text-xs leading-relaxed text-bb-white/50">
              {item.desc}
            </p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Button variant="ghost" onClick={openEditor} disabled={saving}>
              Éditer
            </Button>
            <Button
              variant={item.available ? "quiet" : "primary"}
              disabled={quick.pending}
              onClick={() =>
                quick.run(() => toggleAvailability(item.id, !item.available))
              }
            >
              {item.available ? "Rendre indispo." : "Rendre dispo."}
            </Button>
            <Button
              variant="ghost"
              onClick={() => setShowParcours((v) => !v)}
            >
              Parcours
            </Button>
            <ConfirmButton
              confirmLabel="Supprimer ?"
              disabled={quick.pending}
              onConfirm={() => quick.run(() => removeProduct(item.id))}
            >
              Supprimer
            </ConfirmButton>
          </div>
          <ErrorNote>{quick.error}</ErrorNote>
        </div>
      </div>

      {editing && (
        <div className="mt-3 flex flex-col gap-3 rounded-xl border border-bb-gray-900/60 bg-bb-black/40 p-4">
          <TextField label="Nom" value={name} onChange={setName} />
          <TextField
            label="Description"
            value={desc}
            onChange={setDesc}
            placeholder="Notes de dégustation, ingrédients…"
            multiline
          />
          <PricesEditor
            key={item.id}
            item={item}
            onChange={(p) => {
              pricesRef.current = p;
            }}
          />
          <ErrorNote>{saveError}</ErrorNote>
          <div className="flex gap-2">
            <Button variant="primary" onClick={save} disabled={saving}>
              {saving ? "Enregistrement…" : "Enregistrer"}
            </Button>
            <Button
              variant="quiet"
              onClick={() => setEditing(false)}
              disabled={saving}
            >
              Annuler
            </Button>
          </div>
        </div>
      )}

      {showParcours && (
        <ParcoursPanel
          productId={item.id}
          initial={parcoursInitial}
          onClose={() => setShowParcours(false)}
        />
      )}
    </li>
  );
}
