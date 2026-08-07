"use client";

import { useState, useTransition, type ReactNode } from "react";
import type { ActionResult } from "./actions";

/**
 * ─────────────────────────────────────────────────────────────
 *  Primitives d'UI partagées par l'éditeur de carte.
 *  Ton sobre, tokens Bluebird, pensé mobile-first (édition au téléphone).
 * ─────────────────────────────────────────────────────────────
 */

/**
 * Pilote un appel de Server Action : gère l'état « en cours » via une
 * transition et remonte le message d'erreur éventuel. Le rafraîchissement des
 * données passe par la revalidation côté serveur (les props de la page se
 * mettent à jour toutes seules), donc rien à réinjecter côté client.
 */
export function useAction() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(
    action: () => Promise<ActionResult>,
    onSuccess?: (id?: number) => void,
  ) {
    setError(null);
    startTransition(async () => {
      const res = await action();
      if (res.ok) {
        onSuccess?.(res.id);
      } else {
        setError(res.error);
      }
    });
  }

  return { pending, error, setError, run };
}

type ButtonProps = {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  variant?: "primary" | "ghost" | "danger" | "quiet";
  className?: string;
  title?: string;
  "aria-label"?: string;
};

const VARIANTS: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "border-bb-white/15 bg-bb-red text-bb-white hover:opacity-90",
  ghost:
    "border-bb-white/15 bg-transparent text-bb-white/70 hover:border-bb-red hover:text-bb-white",
  danger:
    "border-bb-red/50 bg-transparent text-bb-red hover:bg-bb-red hover:text-bb-white",
  quiet:
    "border-transparent bg-transparent text-bb-gray-500 hover:text-bb-white",
};

/** Bouton générique aux tokens Bluebird. */
export function Button({
  children,
  onClick,
  type = "button",
  disabled,
  variant = "ghost",
  className = "",
  title,
  ...aria
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={aria["aria-label"]}
      className={`font-body inline-flex items-center justify-center gap-1.5 rounded-full border px-4 py-2 text-[0.6rem] uppercase tracking-[0.25em] transition-colors duration-200 disabled:opacity-40 ${VARIANTS[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

/**
 * Bouton à double détente : un premier clic demande confirmation, le second
 * exécute. Aucune boîte de dialogue système (mobile-friendly). Réservé aux
 * actions destructrices (suppression, publication).
 */
export function ConfirmButton({
  children,
  confirmLabel = "Confirmer ?",
  onConfirm,
  disabled,
  variant = "danger",
  className = "",
}: {
  children: ReactNode;
  confirmLabel?: string;
  onConfirm: () => void;
  disabled?: boolean;
  variant?: ButtonProps["variant"];
  className?: string;
}) {
  const [armed, setArmed] = useState(false);

  if (armed) {
    return (
      <span className="inline-flex items-center gap-1.5">
        <Button
          variant="danger"
          disabled={disabled}
          onClick={() => {
            setArmed(false);
            onConfirm();
          }}
          className={className}
        >
          {confirmLabel}
        </Button>
        <Button variant="quiet" onClick={() => setArmed(false)}>
          Annuler
        </Button>
      </span>
    );
  }

  return (
    <Button
      variant={variant}
      disabled={disabled}
      onClick={() => setArmed(true)}
      className={className}
    >
      {children}
    </Button>
  );
}

/** Petit message d'erreur en ligne, ton sobre. */
export function ErrorNote({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <p role="alert" className="font-body mt-2 text-xs leading-relaxed text-bb-red">
      {children}
    </p>
  );
}

/** Paire de flèches haut/bas — réordonnancement de secours (mobile-first). */
export function MoveButtons({
  onUp,
  onDown,
  disabled,
  canUp,
  canDown,
}: {
  onUp: () => void;
  onDown: () => void;
  disabled?: boolean;
  canUp: boolean;
  canDown: boolean;
}) {
  return (
    <span className="inline-flex flex-col">
      <button
        type="button"
        onClick={onUp}
        disabled={disabled || !canUp}
        aria-label="Monter"
        title="Monter"
        className="px-2 leading-none text-bb-gray-500 transition-colors hover:text-bb-white disabled:opacity-25"
      >
        ▲
      </button>
      <button
        type="button"
        onClick={onDown}
        disabled={disabled || !canDown}
        aria-label="Descendre"
        title="Descendre"
        className="px-2 leading-none text-bb-gray-500 transition-colors hover:text-bb-white disabled:opacity-25"
      >
        ▼
      </button>
    </span>
  );
}

/** Champ texte compact aux tokens Bluebird. */
export function TextField({
  label,
  value,
  onChange,
  placeholder,
  multiline,
  type = "text",
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  type?: string;
  inputMode?: "text" | "decimal" | "numeric";
}) {
  const shared =
    "w-full rounded-xl border border-bb-gray-900/70 bg-transparent px-3 py-2.5 font-body text-sm text-bb-white outline-none transition-colors duration-200 placeholder:text-bb-gray-500 focus:border-bb-red";
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-body text-[0.55rem] uppercase tracking-[0.3em] text-bb-gray-500">
        {label}
      </span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className={`${shared} resize-y`}
        />
      ) : (
        <input
          type={type}
          inputMode={inputMode}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={shared}
        />
      )}
    </label>
  );
}
