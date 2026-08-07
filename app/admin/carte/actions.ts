"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "../../lib/admin-guard";
import {
  getEditableCarte,
  createCategory,
  updateCategory,
  deleteCategory,
  reorderCategories,
  createGroup,
  updateGroup,
  deleteGroup,
  reorderGroups,
  createProduct,
  updateProduct,
  deleteProduct,
  reorderProducts,
  setAvailability,
  setProductPrices,
  upsertCocktailMeta,
  duplicateCategory,
  duplicateProduct,
  moveProductToGroup,
  publishDraft,
  restoreVersion,
} from "../../lib/carte-repo";
import type {
  CategoryInput,
  CategoryPatch,
  GroupInput,
  GroupPatch,
  ProductInput,
  ProductPatch,
  PriceInput,
  CocktailMetaInput,
} from "../../lib/carte-types";

/**
 * ─────────────────────────────────────────────────────────────
 *  Server Actions de l'éditeur de carte.
 *
 *  Règles Next 16 respectées :
 *   • Une Server Action est un point d'entrée POST public → CHAQUE action
 *     ré-authentifie via `requireAdmin()` (le rendu de page ne suffit pas).
 *   • `requireAdmin()` redirige (lève) si la session est absente/invalide :
 *     on l'appelle HORS du try/catch pour ne jamais avaler cette redirection.
 *   • Après une écriture, `revalidatePath('/admin/carte')` rafraîchit l'éditeur ;
 *     la publication/restauration rafraîchit aussi le site public ('/').
 *
 *  Toutes les mutations opèrent sur l'UNIQUE brouillon : on appelle d'abord
 *  `getEditableCarte()` (crée le brouillon en copiant l'active au 1er appel)
 *  pour garantir qu'un brouillon existe avant toute mutation par id.
 * ─────────────────────────────────────────────────────────────
 */

/** Résultat uniforme : succès, ou échec porteur d'un message pour l'UI. */
export type ActionResult =
  | { ok: true; id?: number }
  | { ok: false; error: string };

/** Message d'erreur lisible depuis une exception inconnue. */
function message(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  return "Une erreur est survenue.";
}

/** Bornes de saisie (CDC §5 : « la longueur maximale doit être définie »). */
const LABEL_MAX = 80;
const TEXT_MAX = 600;
const TOO_LONG = `Ce texte dépasse la longueur autorisée (${LABEL_MAX} caractères).`;

/**
 * Normalise un montant saisi : « 6,5 » → « 6.5 ». Renvoie `null` si ce n'est
 * pas un nombre positif à deux décimales au plus (CDC US-016).
 */
function normalizeAmount(raw: string): string | null {
  const clean = raw.trim().replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(clean)) return null;
  return clean;
}

/**
 * Enveloppe commune : entre en mode édition (assure le brouillon), exécute la
 * mutation, revalide l'éditeur. Le retour du repo (souvent un id) est propagé.
 * `requireAdmin` est appelé AVANT par chaque action, jamais ici.
 */
function edit(mutation: () => number | void): ActionResult {
  try {
    getEditableCarte();
    const id = mutation();
    revalidatePath("/admin");
    revalidatePath("/admin/carte");
    return typeof id === "number" ? { ok: true, id } : { ok: true };
  } catch (err) {
    return { ok: false, error: message(err) };
  }
}

// ── Catégories ───────────────────────────────────────────────────────────

export async function addCategory(
  input: CategoryInput,
): Promise<ActionResult> {
  await requireAdmin();
  const clean = input.label.trim();
  if (!clean) return { ok: false, error: "Le nom de la catégorie est requis." };
  if (clean.length > LABEL_MAX) return { ok: false, error: TOO_LONG };
  return edit(() =>
    createCategory({ ...input, label: clean, note: input.note?.trim() || undefined }),
  );
}

export async function editCategory(
  id: number,
  patch: CategoryPatch,
): Promise<ActionResult> {
  await requireAdmin();
  if (patch.label !== undefined) {
    const clean = patch.label.trim();
    if (!clean) return { ok: false, error: "Le nom de la catégorie est requis." };
    if (clean.length > LABEL_MAX) return { ok: false, error: TOO_LONG };
    patch = { ...patch, label: clean };
  }
  if (typeof patch.note === "string" && patch.note.length > TEXT_MAX) {
    return { ok: false, error: "La description est trop longue." };
  }
  return edit(() => updateCategory(id, patch));
}

export async function removeCategory(id: number): Promise<ActionResult> {
  await requireAdmin();
  return edit(() => deleteCategory(id));
}

export async function reorderCategoriesAction(
  orderedIds: number[],
): Promise<ActionResult> {
  await requireAdmin();
  return edit(() => reorderCategories(orderedIds));
}

// ── Groupes ──────────────────────────────────────────────────────────────

export async function addGroup(
  categoryId: number,
  input: GroupInput,
): Promise<ActionResult> {
  await requireAdmin();
  return edit(() => createGroup(categoryId, input));
}

export async function editGroup(
  id: number,
  patch: GroupPatch,
): Promise<ActionResult> {
  await requireAdmin();
  return edit(() => updateGroup(id, patch));
}

export async function removeGroup(id: number): Promise<ActionResult> {
  await requireAdmin();
  return edit(() => deleteGroup(id));
}

export async function reorderGroupsAction(
  categoryId: number,
  orderedIds: number[],
): Promise<ActionResult> {
  await requireAdmin();
  return edit(() => reorderGroups(categoryId, orderedIds));
}

// ── Produits ─────────────────────────────────────────────────────────────

export async function addProduct(
  groupId: number,
  input: ProductInput,
): Promise<ActionResult> {
  await requireAdmin();
  const clean = input.name.trim();
  if (!clean) return { ok: false, error: "Le nom du produit est requis." };
  if (clean.length > LABEL_MAX) return { ok: false, error: TOO_LONG };
  return edit(() => createProduct(groupId, { ...input, name: clean }));
}

export async function editProduct(
  id: number,
  patch: ProductPatch,
): Promise<ActionResult> {
  await requireAdmin();
  if (patch.name !== undefined) {
    const clean = patch.name.trim();
    if (!clean) {
      return { ok: false, error: "Le nom du produit ne peut pas être vide." };
    }
    if (clean.length > LABEL_MAX) return { ok: false, error: TOO_LONG };
    patch = { ...patch, name: clean };
  }
  if (typeof patch.description === "string" && patch.description.length > TEXT_MAX) {
    return { ok: false, error: "La description est trop longue." };
  }
  return edit(() => updateProduct(id, patch));
}

export async function removeProduct(id: number): Promise<ActionResult> {
  await requireAdmin();
  return edit(() => deleteProduct(id));
}

export async function reorderProductsAction(
  groupId: number,
  orderedIds: number[],
): Promise<ActionResult> {
  await requireAdmin();
  return edit(() => reorderProducts(groupId, orderedIds));
}

export async function toggleAvailability(
  productId: number,
  available: boolean,
): Promise<ActionResult> {
  await requireAdmin();
  return edit(() => setAvailability(productId, available));
}

// ── Duplication & déplacement ────────────────────────────────────────────

/** Duplique une catégorie entière (groupes, produits, prix, parcours). */
export async function duplicateCategoryAction(
  id: number,
): Promise<ActionResult> {
  await requireAdmin();
  return edit(() => duplicateCategory(id));
}

/** Duplique un produit (prix et métadonnées compris) sous l'original. */
export async function duplicateProductAction(id: number): Promise<ActionResult> {
  await requireAdmin();
  return edit(() => duplicateProduct(id));
}

/** Déplace un produit vers un autre groupe, éventuellement d'une autre catégorie. */
export async function moveProductAction(
  productId: number,
  targetGroupId: number,
): Promise<ActionResult> {
  await requireAdmin();
  return edit(() => moveProductToGroup(productId, targetGroupId));
}

// ── Prix (remplacement en bloc, transactionnel) ──────────────────────────

export async function savePrices(
  productId: number,
  prices: PriceInput[],
): Promise<ActionResult> {
  await requireAdmin();
  const normalized: PriceInput[] = [];
  for (const p of prices) {
    const amount = normalizeAmount(p.amount);
    if (amount === null) {
      return { ok: false, error: "Veuillez saisir un prix valide." };
    }
    normalized.push({ ...p, amount });
  }
  return edit(() => setProductPrices(productId, normalized));
}

// ── Métadonnées parcours ─────────────────────────────────────────────────

export async function saveCocktailMeta(
  productId: number,
  meta: CocktailMetaInput,
): Promise<ActionResult> {
  await requireAdmin();
  return edit(() => upsertCocktailMeta(productId, meta));
}

// ── Versions ─────────────────────────────────────────────────────────────

/** Publie le brouillon (draft → active). Rafraîchit aussi le site public. */
export async function publish(): Promise<ActionResult> {
  await requireAdmin();
  try {
    const id = publishDraft();
    revalidatePath("/admin/carte");
    revalidatePath("/");
    return { ok: true, id };
  } catch (err) {
    return { ok: false, error: message(err) };
  }
}

/** Restaure une version dans un nouveau brouillon (à publier ensuite). */
export async function restore(id: number): Promise<ActionResult> {
  await requireAdmin();
  try {
    const draftId = restoreVersion(id);
    revalidatePath("/admin/carte");
    return { ok: true, id: draftId };
  } catch (err) {
    return { ok: false, error: message(err) };
  }
}
