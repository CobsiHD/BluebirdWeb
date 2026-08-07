"use client";

import { publish } from "../carte/actions";
import { ConfirmInline, ErrorNote, useAction } from "./ui";

/**
 * Barre de publication. Tant qu'un brouillon diffère de la carte en ligne
 * (`hasChanges`), on propose de publier (confirmation en ligne). Sinon, on
 * affiche « Carte à jour ». La publication rafraîchit aussi le site public.
 */
export default function PublishBar({ hasChanges }: { hasChanges: boolean }) {
  const { pending, error, run } = useAction();

  if (!hasChanges) {
    return (
      <div className="mt-4 flex items-center gap-3 rounded-2xl border-2 border-bb-white/25 px-4 py-3">
        <span aria-hidden className="text-base text-bb-white">
          ✓
        </span>
        <span className="font-body text-xs uppercase tracking-[0.2em] text-bb-white">
          Carte à jour
        </span>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-2xl border-2 border-bb-red bg-bb-red-deeper/40 px-4 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="font-body text-sm text-bb-white">
          Vous avez des modifications non publiées.
        </span>
        <ConfirmInline
          variant="primary"
          confirmLabel="Publier maintenant"
          onConfirm={() => run(() => publish())}
          disabled={pending}
        >
          Publier les modifications
        </ConfirmInline>
      </div>
      <ErrorNote>{error}</ErrorNote>
    </div>
  );
}
