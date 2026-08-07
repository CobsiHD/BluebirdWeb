"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import type { ActionResult } from "../carte/actions";

/**
 * ─────────────────────────────────────────────────────────────
 *  Primitives d'UI de « Votre assistant de carte » (nouveau tableau
 *  de bord, façon Eazee Link). Ton sobre, tokens Bluebird, pensé pour
 *  l'édition au téléphone derrière le bar (grandes cibles tactiles).
 *
 *  Volontairement autonome (aucune dépendance à l'ancien éditeur) : ce
 *  dossier `dashboard/` peut évoluer sans toucher `carte/`.
 * ─────────────────────────────────────────────────────────────
 */

/**
 * Pilote un appel de Server Action : gère l'état « en cours » via une
 * transition, remonte l'erreur éventuelle, et rafraîchit les données serveur
 * (`router.refresh`) après succès — la revalidation renvoie un RSC re-rendu,
 * les props se mettent à jour toutes seules (source de vérité = serveur).
 */
export function useAction() {
  const router = useRouter();
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
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  return { pending, error, setError, run };
}

// ── Interrupteur (toggle) ────────────────────────────────────────────────

/** Interrupteur tactile façon iOS, aux tokens Bluebird. */
export function Switch({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border-2 transition-colors duration-200 disabled:opacity-40 ${
        checked
          ? "border-bb-red bg-bb-red"
          : "border-bb-white/45 bg-bb-white/10"
      }`}
    >
      <span
        aria-hidden
        className={`inline-block h-5 w-5 transform rounded-full bg-bb-white shadow transition-transform duration-200 ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

// ── Boutons ──────────────────────────────────────────────────────────────

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

/**
 * Variantes à fort contraste : bordures franches (au moins 45 % de blanc) et
 * textes pleins — l'espace s'utilise au téléphone, dans une salle sombre.
 */
const VARIANTS: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "border-bb-red bg-bb-red text-bb-white hover:opacity-90",
  ghost:
    "border-bb-white/45 bg-bb-white/5 text-bb-white hover:border-bb-red hover:bg-bb-red/15",
  danger:
    "border-bb-red bg-bb-red/15 text-bb-white hover:bg-bb-red",
  quiet:
    "border-bb-white/25 bg-transparent text-bb-white/80 hover:border-bb-white/60 hover:text-bb-white",
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
      className={`font-body inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full border-2 px-4 py-2 text-[0.64rem] uppercase tracking-[0.2em] transition-colors duration-200 disabled:opacity-40 ${VARIANTS[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

/**
 * Confirmation EN LIGNE (jamais de window.confirm/alert, qui bloquent le fil
 * et cassent l'expérience mobile) : un 1er clic arme, le 2e exécute.
 */
export function ConfirmInline({
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
    <p
      role="alert"
      className="font-body mt-2 rounded-xl border-2 border-bb-red bg-bb-red/15 px-3 py-2 text-xs leading-relaxed text-bb-white"
    >
      {children}
    </p>
  );
}

/** Paire de flèches haut/bas — réordonnancement (mobile-first, pas de drag). */
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
    <span className="inline-flex flex-col gap-1">
      <button
        type="button"
        onClick={onUp}
        disabled={disabled || !canUp}
        aria-label="Monter"
        title="Monter"
        className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-bb-white/30 leading-none text-bb-white/85 transition-colors hover:border-bb-red hover:text-bb-white disabled:opacity-25"
      >
        ▲
      </button>
      <button
        type="button"
        onClick={onDown}
        disabled={disabled || !canDown}
        aria-label="Descendre"
        title="Descendre"
        className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-bb-white/30 leading-none text-bb-white/85 transition-colors hover:border-bb-red hover:text-bb-white disabled:opacity-25"
      >
        ▼
      </button>
    </span>
  );
}

/** Liste déroulante aux mêmes tokens que `TextField`. */
export function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-body text-[0.58rem] uppercase tracking-[0.28em] text-bb-white/70">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-11 w-full appearance-none rounded-xl border-2 border-bb-white/30 bg-bb-black px-3.5 py-2.5 font-body text-base text-bb-white outline-none transition-colors duration-200 focus:border-bb-red"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

// ── Notifications (toasts) ───────────────────────────────────────────────

type Toast = { id: number; message: string; tone: "success" | "error" };

const ToastContext = createContext<(message: string, tone?: Toast["tone"]) => void>(
  () => {},
);

/** Confirme une action réussie (ou signale un échec) — cf. CDC §18. */
export function useToast() {
  return useContext(ToastContext);
}

/**
 * Fournit `useToast()` et empile les messages en bas de l'écran. Zone `polite` :
 * annoncée aux lecteurs d'écran sans voler le focus. Auto-effacement à 3,5 s.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const push = useCallback((message: string, tone: Toast["tone"] = "success") => {
    const id = nextId.current++;
    setToasts((list) => [...list, { id, message, tone }]);
    window.setTimeout(
      () => setToasts((list) => list.filter((t) => t.id !== id)),
      3500,
    );
  }, []);

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-6 z-[60] flex flex-col items-center gap-2 px-4"
      >
        {toasts.map((t) => (
          <p
            key={t.id}
            className={`font-body max-w-sm rounded-full border-2 px-5 py-2.5 text-center text-xs backdrop-blur ${
              t.tone === "error"
                ? "border-bb-red bg-bb-red-deeper text-bb-white"
                : "border-bb-white/45 bg-bb-gray-900 text-bb-white"
            }`}
          >
            {t.message}
          </p>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// ── Modale ───────────────────────────────────────────────────────────────

/**
 * Modale conforme au CDC §17 : titre explicite, fond inactif, fermeture par
 * Échap ou clic sur le fond (jamais par un clic à l'intérieur), focus piégé
 * dans le panneau, défilement de la page bloqué, hauteur adaptée au mobile.
 *
 * `onClose` est un signal de DEMANDE de fermeture : l'appelant peut l'utiliser
 * pour intercaler une confirmation « modifications non enregistrées » (§12).
 */
export function Modal({
  title,
  intro,
  onClose,
  children,
  footer,
}: {
  title: string;
  intro?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  /**
   * `onClose` change d'identité à chaque rendu du formulaire appelant (c'est
   * une fonction déclarée dans son corps). On le lit donc via une ref : sans
   * cela, l'effet ci-dessous se rejouerait à CHAQUE frappe et redonnerait le
   * focus au premier élément du panneau — le champ perdait le focus à chaque
   * caractère saisi.
   */
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Effet monté UNE fois, à l'ouverture : focus initial, piège à focus,
  // blocage du défilement de la page.
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    // On vise le premier CHAMP de saisie ; à défaut seulement, le panneau
    // lui-même (jamais la croix de fermeture).
    const firstField = panel?.querySelector<HTMLElement>(
      "input:not([disabled]), textarea:not([disabled]), select:not([disabled])",
    );
    if (firstField) firstField.focus();
    else panel?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab" || !panel) return;
      // Piège à focus : Tab boucle à l'intérieur du panneau.
      const focusables = Array.from(
        panel.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflow;
      previous?.focus();
    };
    // Volontairement au montage seulement : voir `onCloseRef` ci-dessus.
  }, []);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-bb-black/80 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl border-2 border-bb-white/25 bg-bb-black px-5 py-5 sm:rounded-3xl sm:px-7"
      >
        <div className="flex items-start justify-between gap-4">
          <h3 className="font-display text-xl uppercase leading-tight tracking-wide text-bb-white">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer la fenêtre"
            className="-mr-1 -mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-bb-white/25 text-lg leading-none text-bb-white/80 transition-colors hover:border-bb-red hover:text-bb-white"
          >
            ✕
          </button>
        </div>
        {intro && (
          <div className="font-body mt-2 text-xs leading-relaxed text-bb-white/75">
            {intro}
          </div>
        )}
        <div className="mt-5">{children}</div>
        {footer && (
          <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/** Champ texte compact aux tokens Bluebird. */
export function TextField({
  label,
  value,
  onChange,
  placeholder,
  multiline,
  inputMode,
  onBlur,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  inputMode?: "text" | "decimal" | "numeric";
  onBlur?: () => void;
}) {
  const shared =
    "w-full rounded-xl border-2 border-bb-white/30 bg-bb-white/5 px-3.5 py-2.5 font-body text-base text-bb-white outline-none transition-colors duration-200 placeholder:text-bb-white/40 focus:border-bb-red";
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-body text-[0.58rem] uppercase tracking-[0.28em] text-bb-white/70">
        {label}
      </span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          rows={2}
          className={`${shared} resize-y`}
        />
      ) : (
        <input
          type="text"
          inputMode={inputMode}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          className={shared}
        />
      )}
    </label>
  );
}
