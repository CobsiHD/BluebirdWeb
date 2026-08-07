"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import type { Ardoise } from "../../lib/ardoise-repo";
import { saveArdoiseAction } from "../ardoise-actions";
import { Button, ErrorNote, Switch } from "./ui";

/**
 * Éditeur de l'ardoise (message temporaire du bar).
 *   • Interrupteur actif / inactif.
 *   • Zone `contenteditable` + barre d'outils (gras / italique / souligné /
 *     listes) via `document.execCommand`. On envoie l'`innerHTML` : le serveur
 *     l'assainit (liste blanche de balises).
 *   • « Enregistrer » → retour visuel « Enregistré ». « Partager » → copie le
 *     lien public dans le presse-papier (toast « Lien copié »).
 *   • Indicateur « modifications non enregistrées » dès la première frappe.
 */
export default function ArdoiseEditor({ ardoise }: { ardoise: Ardoise }) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(ardoise.active);
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Contenu initial injecté UNE fois (React ne pilote pas le contenteditable).
  useEffect(() => {
    if (editorRef.current) editorRef.current.innerHTML = ardoise.content;
    // Volontairement au montage seulement.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function exec(command: string) {
    document.execCommand(command, false);
    editorRef.current?.focus();
    setDirty(true);
    setSaved(false);
  }

  function onInput() {
    setDirty(true);
    setSaved(false);
  }

  function toggleActive(v: boolean) {
    setActive(v);
    setDirty(true);
    setSaved(false);
  }

  function save() {
    const html = editorRef.current?.innerHTML ?? "";
    setError(null);
    startTransition(async () => {
      const res = await saveArdoiseAction(active, html);
      if (res.ok) {
        setDirty(false);
        setSaved(true);
      } else {
        setError(res.error);
      }
    });
  }

  async function share() {
    const url = window.location.origin + "/";
    try {
      await navigator.clipboard.writeText(url);
      setToast("Lien copié");
    } catch {
      setToast("Copie impossible");
    }
    window.setTimeout(() => setToast(null), 2500);
  }

  const toolBtn =
    "flex h-10 w-10 items-center justify-center rounded-lg border-2 border-bb-white/30 font-body text-sm text-bb-white transition-colors hover:border-bb-red hover:bg-bb-red/20";

  return (
    <section className="mt-10">
      <h2 className="font-display text-xl uppercase tracking-wide text-bb-white">
        Actions sur l&apos;ardoise
      </h2>

      <div className="mt-5 flex items-center justify-between gap-4 rounded-2xl border-2 border-bb-white/25 px-4 py-4">
        <span className="font-body text-sm text-bb-white">
          Activer / désactiver l&apos;ardoise
        </span>
        <div className="flex items-center gap-3">
          <span className="font-body text-[0.62rem] uppercase tracking-[0.2em] text-bb-white/75">
            {active ? "En ligne" : "Masquée"}
          </span>
          <Switch checked={active} onChange={toggleActive} label="Ardoise active" />
        </div>
      </div>

      <div className="mt-4 rounded-2xl border-2 border-bb-white/25 p-4">
        <div className="mb-3 flex flex-wrap gap-2">
          <button
            type="button"
            className={`${toolBtn} font-bold`}
            onClick={() => exec("bold")}
            title="Gras"
            aria-label="Gras"
          >
            B
          </button>
          <button
            type="button"
            className={`${toolBtn} italic`}
            onClick={() => exec("italic")}
            title="Italique"
            aria-label="Italique"
          >
            I
          </button>
          <button
            type="button"
            className={`${toolBtn} underline`}
            onClick={() => exec("underline")}
            title="Souligné"
            aria-label="Souligné"
          >
            U
          </button>
          <button
            type="button"
            className={toolBtn}
            onClick={() => exec("insertUnorderedList")}
            title="Liste à puces"
            aria-label="Liste à puces"
          >
            •
          </button>
          <button
            type="button"
            className={toolBtn}
            onClick={() => exec("insertOrderedList")}
            title="Liste numérotée"
            aria-label="Liste numérotée"
          >
            1.
          </button>
        </div>

        <div
          ref={editorRef}
          contentEditable
          role="textbox"
          aria-multiline="true"
          aria-label="Contenu de l'ardoise"
          onInput={onInput}
          data-placeholder="Entrez le contenu de votre ardoise ici"
          className="ardoise-editor min-h-32 w-full rounded-xl border-2 border-bb-white/30 bg-bb-white/5 px-3.5 py-3 font-body text-sm leading-relaxed text-bb-white outline-none transition-colors focus:border-bb-red"
        />
        <style>{`
          .ardoise-editor:empty:before {
            content: attr(data-placeholder);
            color: rgb(255 255 255 / 0.45);
            pointer-events: none;
          }
          .ardoise-editor ul { list-style: disc; padding-left: 1.4em; }
          .ardoise-editor ol { list-style: decimal; padding-left: 1.4em; }
        `}</style>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button variant="primary" onClick={save} disabled={pending}>
            {pending ? "Enregistrement…" : "Enregistrer"}
          </Button>
          <Button variant="ghost" onClick={share}>
            Partager
          </Button>
          {dirty && (
            <span className="font-body text-[0.6rem] uppercase tracking-[0.2em] text-bb-red">
              Modifications non enregistrées
            </span>
          )}
          {!dirty && saved && (
            <span className="font-body text-[0.6rem] uppercase tracking-[0.2em] text-bb-white/60">
              Enregistré
            </span>
          )}
          {toast && (
            <span className="font-body text-[0.6rem] uppercase tracking-[0.2em] text-bb-white/60">
              {toast}
            </span>
          )}
        </div>
        <ErrorNote>{error}</ErrorNote>
      </div>
    </section>
  );
}
