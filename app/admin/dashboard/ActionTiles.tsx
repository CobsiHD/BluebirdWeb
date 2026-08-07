"use client";

import type { ReactNode } from "react";
import { Switch } from "./ui";

/**
 * Les trois grandes tuiles d'action (façon Eazee Link). Grandes cibles
 * tactiles : icône à gauche, libellé au centre, état/commande à droite.
 *   1. « Modifier mon menu »  → interrupteur lecture / édition.
 *   2. « Exporter mon menu »  → PDF (V2, désactivé, « Bientôt »).
 *   3. « Couleurs du menu »   → personnalisation (V2, désactivé, « Bientôt »).
 */

function Tile({
  icon,
  title,
  subtitle,
  right,
  muted,
}: {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  right: ReactNode;
  muted?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-4 rounded-2xl border-2 px-4 py-4 ${
        muted ? "border-bb-white/15 opacity-70" : "border-bb-white/30"
      }`}
    >
      <span
        aria-hidden
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-bb-red text-xl text-bb-red"
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="font-display block text-lg uppercase tracking-wide text-bb-white">
          {title}
        </span>
        {subtitle && (
          <span className="font-body block text-xs text-bb-white/70">
            {subtitle}
          </span>
        )}
      </span>
      <span className="shrink-0">{right}</span>
    </div>
  );
}

export default function ActionTiles({
  editMode,
  onToggleEdit,
}: {
  editMode: boolean;
  onToggleEdit: (v: boolean) => void;
}) {
  return (
    <div className="mt-7 flex flex-col gap-2.5">
      <Tile
        icon="✎"
        title="Modifier mon menu"
        subtitle={editMode ? "Mode édition" : "Mode lecture"}
        right={
          <Switch
            checked={editMode}
            onChange={onToggleEdit}
            label="Activer le mode édition du menu"
          />
        }
      />
      <Tile
        icon="⬇"
        title="Exporter mon menu"
        subtitle="Télécharger au format PDF"
        muted
        right={
          <span className="font-body rounded-full border-2 border-bb-white/30 px-3 py-1 text-[0.56rem] uppercase tracking-[0.2em] text-bb-white/70">
            Bientôt
          </span>
        }
      />
      <Tile
        icon="◑"
        title="Couleurs du menu"
        subtitle="Personnaliser"
        muted
        right={
          <span className="font-body rounded-full border-2 border-bb-white/30 px-3 py-1 text-[0.56rem] uppercase tracking-[0.2em] text-bb-white/70">
            Bientôt
          </span>
        }
      />
    </div>
  );
}
