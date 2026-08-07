"use client";

import { useState } from "react";
import type { MenuGroup, ParcoursCocktail } from "../../lib/carte-types";
import {
  addProduct,
  editGroup,
  removeGroup,
  reorderProductsAction,
} from "./actions";
import {
  Button,
  ConfirmButton,
  ErrorNote,
  MoveButtons,
  TextField,
  useAction,
} from "./editor-ui";
import ProductRow from "./ProductRow";

/** Déplace l'élément d'index `from` d'un cran (`dir` = -1 haut, +1 bas). */
function moved<T extends { id: number }>(list: T[], from: number, dir: number): number[] {
  const to = from + dir;
  const ids = list.map((x) => x.id);
  if (to < 0 || to >= ids.length) return ids;
  [ids[from], ids[to]] = [ids[to], ids[from]];
  return ids;
}

export default function GroupBlock({
  group,
  parcoursByName,
  canUp,
  canDown,
  onMoveUp,
  onMoveDown,
  reordering,
}: {
  group: MenuGroup;
  parcoursByName: Map<string, ParcoursCocktail>;
  canUp: boolean;
  canDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  reordering: boolean;
}) {
  const head = useAction();
  const products = useAction();

  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(group.title ?? "");
  const [note, setNote] = useState(group.note ?? "");
  const [newName, setNewName] = useState("");

  function saveHead() {
    head.run(
      () =>
        editGroup(group.id, {
          title: title.trim() === "" ? null : title.trim(),
          note: note.trim() === "" ? null : note.trim(),
        }),
      () => setEditing(false),
    );
  }

  function add() {
    if (!newName.trim()) return;
    products.run(
      () => addProduct(group.id, { name: newName.trim() }),
      () => setNewName(""),
    );
  }

  function moveProduct(index: number, dir: number) {
    products.run(() =>
      reorderProductsAction(group.id, moved(group.items, index, dir)),
    );
  }

  return (
    <div className="mt-5 first:mt-4">
      <div className="flex items-center gap-2">
        <MoveButtons
          onUp={onMoveUp}
          onDown={onMoveDown}
          canUp={canUp}
          canDown={canDown}
          disabled={reordering}
        />
        {group.title ? (
          <h4 className="font-body text-[0.6rem] uppercase tracking-[0.35em] text-bb-red">
            {group.title}
          </h4>
        ) : (
          <h4 className="font-body text-[0.6rem] uppercase tracking-[0.35em] text-bb-gray-500">
            Sans titre
          </h4>
        )}
        <div className="ml-auto flex gap-1.5">
          <Button variant="quiet" onClick={() => setEditing((v) => !v)}>
            {editing ? "Fermer" : "Titre"}
          </Button>
          <ConfirmButton
            confirmLabel="Supprimer le groupe ?"
            disabled={head.pending}
            onConfirm={() => head.run(() => removeGroup(group.id))}
          >
            ✕
          </ConfirmButton>
        </div>
      </div>

      {group.note && !editing && (
        <p className="font-body mt-1 text-xs italic text-bb-white/50">
          {group.note}
        </p>
      )}

      {editing && (
        <div className="mt-2 flex flex-col gap-3 rounded-xl border border-bb-gray-900/60 p-4">
          <TextField
            label="Titre du groupe (optionnel)"
            value={title}
            onChange={setTitle}
            placeholder="ex. Nos classiques"
          />
          <TextField
            label="Note (optionnelle)"
            value={note}
            onChange={setNote}
            placeholder="Précision affichée sous le titre"
          />
          <ErrorNote>{head.error}</ErrorNote>
          <div>
            <Button variant="primary" onClick={saveHead} disabled={head.pending}>
              {head.pending ? "Enregistrement…" : "Enregistrer le groupe"}
            </Button>
          </div>
        </div>
      )}

      <ul className="mt-2">
        {group.items.map((item, i) => (
          <ProductRow
            key={item.id}
            item={item}
            parcoursInitial={parcoursByName.get(item.name)}
            canUp={i > 0}
            canDown={i < group.items.length - 1}
            onMoveUp={() => moveProduct(i, -1)}
            onMoveDown={() => moveProduct(i, +1)}
            reordering={products.pending}
          />
        ))}
        {group.items.length === 0 && (
          <li className="font-body py-3 text-xs text-bb-gray-500">
            Aucun produit dans ce groupe.
          </li>
        )}
      </ul>

      <div className="mt-3 flex items-end gap-2">
        <div className="flex-1">
          <TextField
            label="Nouveau produit"
            value={newName}
            onChange={setNewName}
            placeholder="Nom du produit…"
          />
        </div>
        <Button
          variant="ghost"
          onClick={add}
          disabled={products.pending || !newName.trim()}
        >
          + Ajouter
        </Button>
      </div>
      <ErrorNote>{products.error}</ErrorNote>
    </div>
  );
}
