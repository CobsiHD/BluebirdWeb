"use client";

import { useState } from "react";
import type {
  CocktailMetaInput,
  CorpsId,
  EnvieId,
  ParcoursCocktail,
} from "../../lib/carte-types";
import { saveCocktailMeta } from "./actions";
import { Button, ErrorNote, TextField, useAction } from "./editor-ui";

/**
 * Panneau « Parcours » d'un produit : renseigne les métadonnées du parcours
 * « Quel oiseau, ce soir ? » (envies, corps, intensité, sensations, portrait,
 * signature, sans alcool). Enregistré via `upsertCocktailMeta`.
 *
 * Préremplissage best-effort depuis la version publiée (matché par nom) : le
 * brouillon étant cloné de l'active, les valeurs coïncident tant qu'elles n'ont
 * pas été rééditées deux fois avant publication.
 */

const ENVIES: { id: EnvieId; label: string }[] = [
  { id: "floral", label: "Floral" },
  { id: "fruite", label: "Fruité" },
  { id: "gourmand", label: "Gourmand" },
  { id: "audacieux", label: "Audacieux" },
];

const CORPS: { id: CorpsId; label: string }[] = [
  { id: "leger", label: "Léger" },
  { id: "corse", label: "Corsé" },
];

export default function ParcoursPanel({
  productId,
  initial,
  onClose,
}: {
  productId: number;
  initial?: ParcoursCocktail;
  onClose: () => void;
}) {
  const { pending, error, run } = useAction();

  const [inParcours, setInParcours] = useState<boolean>(Boolean(initial));
  const [envies, setEnvies] = useState<EnvieId[]>(initial?.envies ?? []);
  const [corps, setCorps] = useState<CorpsId | null>(initial?.corps ?? null);
  const [intensite, setIntensite] = useState<string>(
    initial?.intensite != null ? String(initial.intensite) : "",
  );
  const [tags, setTags] = useState<string>((initial?.tags ?? []).join(", "));
  const [portrait, setPortrait] = useState<string>(initial?.portrait ?? "");
  const [signature, setSignature] = useState<boolean>(
    initial?.signature ?? false,
  );
  const [sansAlcool, setSansAlcool] = useState<boolean>(
    initial?.sansAlcool ?? false,
  );

  function toggleEnvie(id: EnvieId) {
    setEnvies((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id],
    );
  }

  function submit() {
    const meta: CocktailMetaInput = {
      inParcours,
      envies,
      corps,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      intensite: intensite.trim() === "" ? null : Number(intensite),
      portrait: portrait.trim() === "" ? null : portrait.trim(),
      signature,
      sansAlcool,
    };
    run(() => saveCocktailMeta(productId, meta), onClose);
  }

  const pill =
    "font-body rounded-full border px-3 py-1.5 text-[0.55rem] uppercase tracking-[0.25em] transition-colors duration-200";

  return (
    <div className="mt-3 rounded-xl border border-bb-red/30 bg-bb-red-deeper/10 p-4">
      <label className="flex items-center gap-2.5">
        <input
          type="checkbox"
          checked={inParcours}
          onChange={(e) => setInParcours(e.target.checked)}
          className="h-4 w-4 accent-bb-red"
        />
        <span className="font-body text-xs uppercase tracking-[0.25em] text-bb-white/85">
          Dans le parcours « Quel oiseau, ce soir ? »
        </span>
      </label>

      {inParcours && (
        <div className="mt-4 flex flex-col gap-4">
          <div>
            <span className="font-body text-[0.55rem] uppercase tracking-[0.3em] text-bb-gray-500">
              Envie(s)
            </span>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {ENVIES.map((e) => {
                const on = envies.includes(e.id);
                return (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => toggleEnvie(e.id)}
                    className={`${pill} ${
                      on
                        ? "border-bb-red bg-bb-red text-bb-white"
                        : "border-bb-gray-900/70 text-bb-white/60 hover:border-bb-red"
                    }`}
                  >
                    {e.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <span className="font-body text-[0.55rem] uppercase tracking-[0.3em] text-bb-gray-500">
              Corps
            </span>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {CORPS.map((c) => {
                const on = corps === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCorps(on ? null : c.id)}
                    className={`${pill} ${
                      on
                        ? "border-bb-red bg-bb-red text-bb-white"
                        : "border-bb-gray-900/70 text-bb-white/60 hover:border-bb-red"
                    }`}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <TextField
              label="Intensité (1–5)"
              value={intensite}
              onChange={setIntensite}
              placeholder="3"
              inputMode="numeric"
            />
            <TextField
              label="Sensations (séparées par des virgules)"
              value={tags}
              onChange={setTags}
              placeholder="Floral, Miellé"
            />
          </div>

          <TextField
            label="Portrait"
            value={portrait}
            onChange={setPortrait}
            placeholder="Une gorgée d'aube…"
            multiline
          />

          <div className="flex flex-wrap gap-5">
            <label className="flex items-center gap-2.5">
              <input
                type="checkbox"
                checked={signature}
                onChange={(e) => setSignature(e.target.checked)}
                className="h-4 w-4 accent-bb-red"
              />
              <span className="font-body text-xs text-bb-white/80">
                Signature
              </span>
            </label>
            <label className="flex items-center gap-2.5">
              <input
                type="checkbox"
                checked={sansAlcool}
                onChange={(e) => setSansAlcool(e.target.checked)}
                className="h-4 w-4 accent-bb-red"
              />
              <span className="font-body text-xs text-bb-white/80">
                Sans alcool
              </span>
            </label>
          </div>
        </div>
      )}

      <ErrorNote>{error}</ErrorNote>

      <div className="mt-4 flex gap-2">
        <Button variant="primary" onClick={submit} disabled={pending}>
          {pending ? "Enregistrement…" : "Enregistrer le parcours"}
        </Button>
        <Button variant="quiet" onClick={onClose} disabled={pending}>
          Fermer
        </Button>
      </div>
    </div>
  );
}
