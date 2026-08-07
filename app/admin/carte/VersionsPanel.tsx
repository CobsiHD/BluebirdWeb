"use client";

import type { MenuVersionInfo } from "../../lib/carte-types";
import { publish, restore } from "./actions";
import { ConfirmButton, ErrorNote, useAction } from "./editor-ui";

const STATUS_LABEL: Record<MenuVersionInfo["status"], string> = {
  draft: "Brouillon",
  active: "En ligne",
  archived: "Archivée",
};

const STATUS_STYLE: Record<MenuVersionInfo["status"], string> = {
  draft: "border-bb-red text-bb-red",
  active: "border-bb-white/40 text-bb-white",
  archived: "border-bb-gray-900 text-bb-gray-500",
};

/** Date lisible (jj/mm/aaaa hh:mm) à partir d'un « datetime('now') » SQLite. */
function fmt(value: string | null): string {
  if (!value) return "—";
  // SQLite renvoie « YYYY-MM-DD HH:MM:SS » en UTC ; on l'interprète tel quel.
  const iso = value.replace(" ", "T") + "Z";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function VersionsPanel({
  versions,
}: {
  versions: MenuVersionInfo[];
}) {
  const { pending, error, run } = useAction();
  const draft = versions.find((v) => v.status === "draft");

  return (
    <section className="mt-12 rounded-2xl border border-bb-gray-900/60 px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-display text-2xl uppercase tracking-wide text-bb-white">
          Versions
        </h2>
        <ConfirmButton
          variant="primary"
          confirmLabel="Publier le brouillon ?"
          disabled={pending || !draft}
          onConfirm={() => run(() => publish())}
        >
          Publier
        </ConfirmButton>
      </div>

      <p className="font-body mt-3 max-w-xl text-xs leading-relaxed text-bb-white/60">
        Vos modifications s&apos;enregistrent dans un brouillon. Elles
        n&apos;apparaissent sur le site qu&apos;une fois <em>publiées</em>.
        Restaurer une ancienne version la recopie dans un nouveau brouillon,
        que vous pourrez publier à votre tour.
      </p>

      <ErrorNote>{error}</ErrorNote>

      <ul className="mt-5 flex flex-col gap-2">
        {versions.map((v) => (
          <li
            key={v.id}
            className="flex flex-wrap items-center gap-3 rounded-xl border border-bb-gray-900/40 px-4 py-3"
          >
            <span
              className={`font-body rounded-full border px-2.5 py-1 text-[0.5rem] uppercase tracking-[0.25em] ${STATUS_STYLE[v.status]}`}
            >
              {STATUS_LABEL[v.status]}
            </span>
            <span className="font-body text-sm text-bb-white/85">{v.label}</span>
            <span className="font-body text-[0.55rem] uppercase tracking-[0.2em] text-bb-gray-500">
              créée {fmt(v.createdAt)}
              {v.publishedAt ? ` · publiée ${fmt(v.publishedAt)}` : ""}
            </span>
            {v.status !== "draft" && (
              <span className="ml-auto">
                <ConfirmButton
                  variant="ghost"
                  confirmLabel="Restaurer ?"
                  disabled={pending}
                  onConfirm={() => run(() => restore(v.id))}
                >
                  Restaurer
                </ConfirmButton>
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
