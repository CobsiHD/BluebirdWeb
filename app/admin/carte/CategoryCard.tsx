"use client";

import { useState } from "react";
import type { MenuCategory, ParcoursCocktail } from "../../lib/carte-types";
import {
  addGroup,
  editCategory,
  removeCategory,
  reorderGroupsAction,
} from "./actions";
import {
  Button,
  ConfirmButton,
  ErrorNote,
  MoveButtons,
  TextField,
  useAction,
} from "./editor-ui";
import GroupBlock from "./GroupBlock";

function moved<T extends { id: number }>(list: T[], from: number, dir: number): number[] {
  const to = from + dir;
  const ids = list.map((x) => x.id);
  if (to < 0 || to >= ids.length) return ids;
  [ids[from], ids[to]] = [ids[to], ids[from]];
  return ids;
}

export default function CategoryCard({
  category,
  parcoursByName,
  canUp,
  canDown,
  onMoveUp,
  onMoveDown,
  reordering,
}: {
  category: MenuCategory;
  parcoursByName: Map<string, ParcoursCocktail>;
  canUp: boolean;
  canDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  reordering: boolean;
}) {
  const head = useAction();
  const groups = useAction();

  const [open, setOpen] = useState(true);
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(category.label);
  const [note, setNote] = useState(category.note ?? "");
  const [newGroup, setNewGroup] = useState("");

  const itemCount = category.groups.reduce((s, g) => s + g.items.length, 0);

  function saveHead() {
    head.run(
      () =>
        editCategory(category.id, {
          label: label.trim(),
          note: note.trim() === "" ? null : note.trim(),
        }),
      () => setEditing(false),
    );
  }

  function toggleActive() {
    head.run(() => editCategory(category.id, { active: !category.active }));
  }

  function addNewGroup() {
    groups.run(
      () =>
        addGroup(category.id, {
          title: newGroup.trim() === "" ? undefined : newGroup.trim(),
        }),
      () => setNewGroup(""),
    );
  }

  function moveGroup(index: number, dir: number) {
    groups.run(() =>
      reorderGroupsAction(category.id, moved(category.groups, index, dir)),
    );
  }

  return (
    <div
      className={`rounded-2xl border px-4 py-5 sm:px-6 ${
        category.active
          ? "border-bb-gray-900/60"
          : "border-bb-gray-900/40 opacity-60"
      }`}
    >
      <div className="flex items-start gap-2">
        <MoveButtons
          onUp={onMoveUp}
          onDown={onMoveDown}
          canUp={canUp}
          canDown={canDown}
          disabled={reordering}
        />
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="min-w-0 flex-1 text-left"
        >
          <h3 className="font-display text-xl uppercase tracking-wide text-bb-white">
            {category.label}
            {!category.active && (
              <span className="font-body ml-2 text-[0.5rem] uppercase tracking-[0.25em] text-bb-gray-500">
                masquée
              </span>
            )}
          </h3>
          <span className="font-body text-[0.55rem] uppercase tracking-[0.25em] text-bb-gray-500">
            /{category.slug} · {category.groups.length} groupe
            {category.groups.length > 1 ? "s" : ""} · {itemCount} produit
            {itemCount > 1 ? "s" : ""} · {open ? "réduire" : "déplier"}
          </span>
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <Button variant="quiet" onClick={() => setEditing((v) => !v)}>
          {editing ? "Fermer" : "Renommer"}
        </Button>
        <Button
          variant={category.active ? "quiet" : "primary"}
          disabled={head.pending}
          onClick={toggleActive}
        >
          {category.active ? "Masquer" : "Afficher"}
        </Button>
        <ConfirmButton
          confirmLabel="Tout supprimer ?"
          disabled={head.pending}
          onConfirm={() => head.run(() => removeCategory(category.id))}
        >
          Supprimer
        </ConfirmButton>
      </div>

      {category.note && !editing && (
        <p className="font-body mt-2 text-xs italic text-bb-white/50">
          {category.note}
        </p>
      )}

      {editing && (
        <div className="mt-3 flex flex-col gap-3 rounded-xl border border-bb-gray-900/60 p-4">
          <TextField label="Nom de la catégorie" value={label} onChange={setLabel} />
          <TextField
            label="Note (optionnelle)"
            value={note}
            onChange={setNote}
            placeholder="Sous-titre affiché sous la catégorie"
          />
          <p className="font-body text-[0.55rem] uppercase tracking-[0.25em] text-bb-gray-500">
            Ancre publique : /{category.slug} (conservée)
          </p>
          <ErrorNote>{head.error}</ErrorNote>
          <div>
            <Button variant="primary" onClick={saveHead} disabled={head.pending}>
              {head.pending ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </div>
        </div>
      )}

      {!editing && <ErrorNote>{head.error}</ErrorNote>}

      {open && (
        <div className="mt-2">
          {category.groups.map((g, i) => (
            <GroupBlock
              key={g.id}
              group={g}
              parcoursByName={parcoursByName}
              canUp={i > 0}
              canDown={i < category.groups.length - 1}
              onMoveUp={() => moveGroup(i, -1)}
              onMoveDown={() => moveGroup(i, +1)}
              reordering={groups.pending}
            />
          ))}

          <div className="mt-4 flex items-end gap-2 border-t border-bb-gray-900/40 pt-4">
            <div className="flex-1">
              <TextField
                label="Nouveau groupe"
                value={newGroup}
                onChange={setNewGroup}
                placeholder="Titre (optionnel) — ex. Nos classiques"
              />
            </div>
            <Button
              variant="ghost"
              onClick={addNewGroup}
              disabled={groups.pending}
            >
              + Groupe
            </Button>
          </div>
          <ErrorNote>{groups.error}</ErrorNote>
        </div>
      )}
    </div>
  );
}
