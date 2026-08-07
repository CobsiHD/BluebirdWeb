"use client";

import { useEffect, useState } from "react";
import type { MenuItem, PriceInput } from "../../lib/carte-types";
import { Button, TextField } from "./editor-ui";

/**
 * Éditeur des tarifs d'un produit. Deux modes exclusifs, alignés sur la règle
 * de reconstruction du repo :
 *   • « Tarif unique »  → un seul prix SANS libellé (montant + volume) ;
 *   • « Plusieurs formats » → une liste (libellé + montant), ex. 25cl / 50cl.
 *
 * Composant contrôlé : il remonte à chaque changement le tableau `PriceInput[]`
 * prêt pour `setProductPrices` via `onChange`. L'état interne (mode, lignes)
 * est réinitialisé quand le produit change (clé côté parent).
 */

type MultiRow = { label: string; amount: string };

function initialFromItem(item: MenuItem): {
  mode: "single" | "multi";
  amount: string;
  vol: string;
  rows: MultiRow[];
} {
  if (item.prices && item.prices.length > 0) {
    return {
      mode: "multi",
      amount: "",
      vol: "",
      rows: item.prices.map((p) => ({ label: p.label, amount: p.price })),
    };
  }
  return {
    mode: "single",
    amount: item.price ?? "",
    vol: item.vol ?? "",
    rows: [{ label: "", amount: "" }],
  };
}

function build(
  mode: "single" | "multi",
  amount: string,
  vol: string,
  rows: MultiRow[],
): PriceInput[] {
  if (mode === "single") {
    const a = amount.trim();
    if (!a) return [];
    const v = vol.trim();
    // Un seul prix sans libellé → rendu « volume · montant » côté public.
    return v ? [{ amount: a, vol: v }] : [{ amount: a }];
  }
  return rows
    .filter((r) => r.amount.trim() !== "")
    .map((r) => {
      const l = r.label.trim();
      return l ? { label: l, amount: r.amount.trim() } : { amount: r.amount.trim() };
    });
}

export default function PricesEditor({
  item,
  onChange,
}: {
  item: MenuItem;
  onChange: (prices: PriceInput[]) => void;
}) {
  const init = initialFromItem(item);
  const [mode, setMode] = useState<"single" | "multi">(init.mode);
  const [amount, setAmount] = useState(init.amount);
  const [vol, setVol] = useState(init.vol);
  const [rows, setRows] = useState<MultiRow[]>(init.rows);

  // Remonte le tableau reconstruit à chaque évolution de l'état.
  useEffect(() => {
    onChange(build(mode, amount, vol, rows));
    // onChange est stable (défini par le parent) ; on suit uniquement l'état.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, amount, vol, rows]);

  function updateRow(i: number, patch: Partial<MultiRow>) {
    setRows((prev) => prev.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  }

  return (
    <div className="rounded-xl border border-bb-gray-900/50 p-3">
      <div className="mb-3 flex items-center gap-2">
        <span className="font-body text-[0.55rem] uppercase tracking-[0.3em] text-bb-gray-500">
          Tarif
        </span>
        <div className="ml-auto flex gap-1.5">
          <Button
            variant={mode === "single" ? "primary" : "ghost"}
            onClick={() => setMode("single")}
          >
            Unique
          </Button>
          <Button
            variant={mode === "multi" ? "primary" : "ghost"}
            onClick={() => setMode("multi")}
          >
            Plusieurs formats
          </Button>
        </div>
      </div>

      {mode === "single" ? (
        <div className="grid grid-cols-2 gap-3">
          <TextField
            label="Montant (€)"
            value={amount}
            onChange={setAmount}
            placeholder="8.5"
            inputMode="decimal"
          />
          <TextField
            label="Volume (option.)"
            value={vol}
            onChange={setVol}
            placeholder="12cl"
          />
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {rows.map((r, i) => (
            <div key={i} className="flex items-end gap-2">
              <div className="flex-1">
                <TextField
                  label="Libellé"
                  value={r.label}
                  onChange={(v) => updateRow(i, { label: v })}
                  placeholder="25cl"
                />
              </div>
              <div className="w-24">
                <TextField
                  label="€"
                  value={r.amount}
                  onChange={(v) => updateRow(i, { amount: v })}
                  placeholder="5"
                  inputMode="decimal"
                />
              </div>
              <button
                type="button"
                onClick={() =>
                  setRows((prev) => prev.filter((_, j) => j !== i))
                }
                aria-label="Retirer ce format"
                title="Retirer ce format"
                className="mb-2.5 px-2 text-bb-gray-500 transition-colors hover:text-bb-red"
              >
                ✕
              </button>
            </div>
          ))}
          <Button
            variant="ghost"
            onClick={() =>
              setRows((prev) => [...prev, { label: "", amount: "" }])
            }
            className="self-start"
          >
            + Ajouter un format
          </Button>
        </div>
      )}
    </div>
  );
}
