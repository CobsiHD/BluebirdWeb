import "server-only";
import { revalidatePath } from "next/cache";
import type { DB } from "./db";
import { getDb } from "./db";
import { seedCarteIfEmpty } from "./carte-seed";
import type {
  CategoryInput,
  CategoryPatch,
  CocktailMetaInput,
  CorpsId,
  EnvieId,
  GroupInput,
  GroupPatch,
  Menu,
  MenuCategory,
  MenuGroup,
  MenuItem,
  MenuVersionInfo,
  ParcoursCocktail,
  PriceInput,
  PricePatch,
  ProductInput,
  ProductPatch,
} from "./carte-types";

/**
 * ─────────────────────────────────────────────────────────────
 *  Couche d'accès aux données de la carte.
 *
 *  Seule porte vers SQLite : les pages, Server Components et Server Actions
 *  passent EXCLUSIVEMENT par ces fonctions. Tout est SYNCHRONE (better-sqlite3)
 *  et renvoie des objets sérialisables (voir `carte-types.ts`).
 *
 *  Deux plans :
 *    • LECTURE PUBLIQUE — `getActiveMenu`, `getParcoursCocktails` lisent la
 *      version 'active'. Amorcent la base au premier appel.
 *    • ÉDITION — toutes les mutations opèrent sur l'unique version 'draft'
 *      (créée en copiant l'active via `getEditableCarte`). Une garde refuse
 *      toute écriture hors brouillon : la carte publiée reste intouchable
 *      jusqu'à `publishDraft()`.
 * ─────────────────────────────────────────────────────────────
 */

// ── Amorçage ─────────────────────────────────────────────────────────────

/** Garantit une carte de départ (voir `carte-seed.ts`) avant toute lecture. */
function ensureSeeded(): DB {
  const db = getDb();
  seedCarteIfEmpty(db);
  return db;
}

/** Rafraîchit le site public et l'espace admin après une publication. */
function revalidate(): void {
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/carte");
}

// ── Lignes brutes (usage interne) ────────────────────────────────────────

type VersionRow = {
  id: number;
  label: string;
  status: "draft" | "active" | "archived";
  created_at: string;
  published_at: string | null;
};
type CategoryRow = {
  id: number;
  version_id: number;
  slug: string;
  label: string;
  note: string | null;
  position: number;
  active: number;
};
type GroupRow = {
  id: number;
  category_id: number;
  title: string | null;
  note: string | null;
  position: number;
};
type ProductRow = {
  id: number;
  group_id: number;
  name: string;
  description: string | null;
  available: number;
  position: number;
};
type PriceRow = {
  id: number;
  product_id: number;
  label: string | null;
  amount: string;
  vol: string | null;
  position: number;
};

// ── Assemblage d'une version en `Menu` ───────────────────────────────────

/** Produit `MenuItem` à partir d'un produit et de ses prix (ordonnés). */
function toMenuItem(product: ProductRow, prices: PriceRow[]): MenuItem {
  const base: MenuItem = {
    id: product.id,
    name: product.name,
    available: product.available === 1,
  };
  if (product.description) base.desc = product.description;

  if (prices.length === 1 && !prices[0].label) {
    // Tarif unique : montant simple, volume facultatif.
    base.price = prices[0].amount;
    if (prices[0].vol) base.vol = prices[0].vol;
  } else if (prices.length > 0) {
    // Plusieurs formats (verre/bouteille, 25cl/50cl…).
    base.prices = prices.map((p) => ({ label: p.label ?? "", price: p.amount }));
  }
  return base;
}

/** Lit et assemble une version complète (catégories → groupes → produits). */
function buildMenu(db: DB, versionId: number): Menu {
  const version = db
    .prepare("SELECT * FROM menu_version WHERE id = ?")
    .get(versionId) as VersionRow | undefined;
  if (!version) throw new Error(`Version ${versionId} introuvable.`);

  const categories = db
    .prepare("SELECT * FROM category WHERE version_id = ? ORDER BY position")
    .all(versionId) as CategoryRow[];

  const groups = db
    .prepare(
      `SELECT g.* FROM product_group g
       JOIN category c ON c.id = g.category_id
       WHERE c.version_id = ?
       ORDER BY g.category_id, g.position`,
    )
    .all(versionId) as GroupRow[];

  const products = db
    .prepare(
      `SELECT p.* FROM product p
       JOIN product_group g ON g.id = p.group_id
       JOIN category c ON c.id = g.category_id
       WHERE c.version_id = ?
       ORDER BY p.group_id, p.position`,
    )
    .all(versionId) as ProductRow[];

  const prices = db
    .prepare(
      `SELECT pr.* FROM product_price pr
       JOIN product p ON p.id = pr.product_id
       JOIN product_group g ON g.id = p.group_id
       JOIN category c ON c.id = g.category_id
       WHERE c.version_id = ?
       ORDER BY pr.product_id, pr.position`,
    )
    .all(versionId) as PriceRow[];

  // Index enfants → parents pour un assemblage en une passe.
  const pricesByProduct = new Map<number, PriceRow[]>();
  for (const pr of prices) {
    const list = pricesByProduct.get(pr.product_id);
    if (list) list.push(pr);
    else pricesByProduct.set(pr.product_id, [pr]);
  }
  const itemsByGroup = new Map<number, MenuItem[]>();
  for (const p of products) {
    const item = toMenuItem(p, pricesByProduct.get(p.id) ?? []);
    const list = itemsByGroup.get(p.group_id);
    if (list) list.push(item);
    else itemsByGroup.set(p.group_id, [item]);
  }
  const groupsByCategory = new Map<number, MenuGroup[]>();
  for (const g of groups) {
    const group: MenuGroup = {
      id: g.id,
      position: g.position,
      items: itemsByGroup.get(g.id) ?? [],
    };
    if (g.title) group.title = g.title;
    if (g.note) group.note = g.note;
    const list = groupsByCategory.get(g.category_id);
    if (list) list.push(group);
    else groupsByCategory.set(g.category_id, [group]);
  }

  const menuCategories: MenuCategory[] = categories.map((c) => {
    const category: MenuCategory = {
      id: c.id,
      slug: c.slug,
      label: c.label,
      position: c.position,
      active: c.active === 1,
      groups: groupsByCategory.get(c.id) ?? [],
    };
    if (c.note) category.note = c.note;
    return category;
  });

  return {
    versionId: version.id,
    status: version.status,
    label: version.label,
    categories: menuCategories,
  };
}

// ── Lectures publiques ───────────────────────────────────────────────────

/** La carte publiée (version 'active'). Amorce la base au premier appel. */
export function getActiveMenu(): Menu {
  const db = ensureSeeded();
  const active = db
    .prepare("SELECT id FROM menu_version WHERE status = 'active'")
    .get() as { id: number } | undefined;
  if (!active) throw new Error("Aucune carte active.");
  return buildMenu(db, active.id);
}

/** Cocktails du parcours (in_parcours) de la carte publiée. */
export function getParcoursCocktails(): ParcoursCocktail[] {
  const db = ensureSeeded();
  const rows = db
    .prepare(
      `SELECT p.id            AS productId,
              p.name          AS name,
              p.description   AS ingredients,
              m.envies        AS envies,
              m.corps         AS corps,
              m.tags          AS tags,
              m.intensite     AS intensite,
              m.portrait      AS portrait,
              m.signature     AS signature,
              m.sans_alcool   AS sansAlcool,
              (SELECT amount FROM product_price pp
                 WHERE pp.product_id = p.id
                 ORDER BY pp.position LIMIT 1) AS price
       FROM cocktail_meta m
       JOIN product p        ON p.id = m.product_id
       JOIN product_group g  ON g.id = p.group_id
       JOIN category c       ON c.id = g.category_id
       JOIN menu_version v   ON v.id = c.version_id
       WHERE v.status = 'active' AND m.in_parcours = 1
       ORDER BY p.name`,
    )
    .all() as {
    productId: number;
    name: string;
    ingredients: string | null;
    envies: string;
    corps: string | null;
    tags: string;
    intensite: number | null;
    portrait: string | null;
    signature: number;
    sansAlcool: number;
    price: string | null;
  }[];

  return rows.map((r) => {
    const cocktail: ParcoursCocktail = {
      productId: r.productId,
      name: r.name,
      envies: JSON.parse(r.envies) as EnvieId[],
      corps: (r.corps as CorpsId | null) ?? null,
      tags: JSON.parse(r.tags) as string[],
      intensite: r.intensite,
      price: r.price ?? "",
      portrait: r.portrait ?? "",
      signature: r.signature === 1,
      sansAlcool: r.sansAlcool === 1,
    };
    if (r.ingredients) cocktail.ingredients = r.ingredients;
    return cocktail;
  });
}

// ── Versions ─────────────────────────────────────────────────────────────

/** Historique des versions, la plus récente en tête. */
export function listVersions(): MenuVersionInfo[] {
  const db = ensureSeeded();
  const rows = db
    .prepare("SELECT * FROM menu_version ORDER BY id DESC")
    .all() as VersionRow[];
  return rows.map((v) => ({
    id: v.id,
    label: v.label,
    status: v.status,
    createdAt: v.created_at,
    publishedAt: v.published_at,
  }));
}

/**
 * Copie intégrale d'une version dans une nouvelle version. À exécuter DANS une
 * transaction ouverte par l'appelant (aucune transaction interne).
 */
function cloneVersionInto(
  db: DB,
  sourceVersionId: number,
  label: string,
  status: "draft" | "active" | "archived",
): number {
  const newVersionId = db
    .prepare("INSERT INTO menu_version (label, status) VALUES (?, ?)")
    .run(label, status).lastInsertRowid as number;

  const insCat = db.prepare(
    `INSERT INTO category (version_id, slug, label, note, position, active)
     VALUES (?, ?, ?, ?, ?, ?)`,
  );
  const insGroup = db.prepare(
    `INSERT INTO product_group (category_id, title, note, position)
     VALUES (?, ?, ?, ?)`,
  );
  const insProduct = db.prepare(
    `INSERT INTO product (group_id, name, description, available, position)
     VALUES (?, ?, ?, ?, ?)`,
  );
  const insPrice = db.prepare(
    `INSERT INTO product_price (product_id, label, amount, vol, position)
     VALUES (?, ?, ?, ?, ?)`,
  );
  const insMeta = db.prepare(
    `INSERT INTO cocktail_meta
       (product_id, in_parcours, envies, corps, tags, intensite, portrait, signature, sans_alcool)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );

  const cats = db
    .prepare("SELECT * FROM category WHERE version_id = ? ORDER BY position")
    .all(sourceVersionId) as CategoryRow[];

  for (const c of cats) {
    const newCatId = insCat.run(
      newVersionId,
      c.slug,
      c.label,
      c.note,
      c.position,
      c.active,
    ).lastInsertRowid as number;

    const groups = db
      .prepare("SELECT * FROM product_group WHERE category_id = ? ORDER BY position")
      .all(c.id) as GroupRow[];

    for (const g of groups) {
      const newGroupId = insGroup.run(
        newCatId,
        g.title,
        g.note,
        g.position,
      ).lastInsertRowid as number;

      const prods = db
        .prepare("SELECT * FROM product WHERE group_id = ? ORDER BY position")
        .all(g.id) as ProductRow[];

      for (const p of prods) {
        const newProductId = insProduct.run(
          newGroupId,
          p.name,
          p.description,
          p.available,
          p.position,
        ).lastInsertRowid as number;

        const prices = db
          .prepare("SELECT * FROM product_price WHERE product_id = ? ORDER BY position")
          .all(p.id) as PriceRow[];
        for (const pr of prices) {
          insPrice.run(newProductId, pr.label, pr.amount, pr.vol, pr.position);
        }

        const meta = db
          .prepare("SELECT * FROM cocktail_meta WHERE product_id = ?")
          .get(p.id) as
          | {
              in_parcours: number;
              envies: string;
              corps: string | null;
              tags: string;
              intensite: number | null;
              portrait: string | null;
              signature: number;
              sans_alcool: number;
            }
          | undefined;
        if (meta) {
          insMeta.run(
            newProductId,
            meta.in_parcours,
            meta.envies,
            meta.corps,
            meta.tags,
            meta.intensite,
            meta.portrait,
            meta.signature,
            meta.sans_alcool,
          );
        }
      }
    }
  }

  return newVersionId;
}

/** Id du brouillon courant, ou `undefined` s'il n'y en a pas. */
function findDraftId(db: DB): number | undefined {
  const row = db
    .prepare("SELECT id FROM menu_version WHERE status = 'draft'")
    .get() as { id: number } | undefined;
  return row?.id;
}

/** Id du brouillon courant, en le créant depuis l'active s'il est absent. */
function ensureDraftVersion(db: DB): number {
  const existing = findDraftId(db);
  if (existing !== undefined) return existing;

  const active = db
    .prepare("SELECT id FROM menu_version WHERE status = 'active'")
    .get() as { id: number } | undefined;
  if (!active) throw new Error("Aucune carte active à copier en brouillon.");

  const create = db.transaction(() =>
    cloneVersionInto(db, active.id, "Brouillon", "draft"),
  );
  return create();
}

/** Id du brouillon courant ; erreur explicite si aucun n'est ouvert. */
function requireDraftId(db: DB): number {
  const id = findDraftId(db);
  if (id === undefined) {
    throw new Error(
      "Aucun brouillon ouvert. Appelez getEditableCarte() avant toute mutation.",
    );
  }
  return id;
}

/**
 * Carte en cours d'édition (brouillon). Le crée en copiant l'active au premier
 * appel, puis renvoie toujours le même brouillon tant qu'il n'est pas publié.
 */
export function getEditableCarte(): Menu {
  const db = ensureSeeded();
  const draftId = ensureDraftVersion(db);
  return buildMenu(db, draftId);
}

/** Brouillon courant s'il existe, sinon `null` (sans le créer). */
export function getDraft(): Menu | null {
  const db = ensureSeeded();
  const draftId = findDraftId(db);
  return draftId === undefined ? null : buildMenu(db, draftId);
}

/**
 * Publie le brouillon : draft → active, l'ancienne active → archived. Bascule
 * atomique de statuts, sans réécrire les lignes. Rafraîchit le site public.
 */
export function publishDraft(): number {
  const db = getDb();
  const draftId = requireDraftId(db);
  const publish = db.transaction(() => {
    db.prepare("UPDATE menu_version SET status = 'archived' WHERE status = 'active'").run();
    db.prepare(
      "UPDATE menu_version SET status = 'active', published_at = datetime('now') WHERE id = ?",
    ).run(draftId);
  });
  publish();
  revalidate();
  return draftId;
}

/**
 * Restaure une version : recopie son contenu dans un NOUVEAU brouillon (tout
 * brouillon existant est d'abord jeté). L'admin le relit puis publie. Renvoie
 * l'id du brouillon créé.
 */
export function restoreVersion(id: number): number {
  const db = ensureSeeded();
  const target = db
    .prepare("SELECT id, label FROM menu_version WHERE id = ?")
    .get(id) as { id: number; label: string } | undefined;
  if (!target) throw new Error(`Version ${id} introuvable.`);

  const restore = db.transaction(() => {
    db.prepare("DELETE FROM menu_version WHERE status = 'draft'").run();
    return cloneVersionInto(db, id, `Restauration — ${target.label}`, "draft");
  });
  const newDraftId = restore();
  revalidate();
  return newDraftId;
}

// ── Garde d'édition : refuser toute écriture hors brouillon ───────────────

const STATUS_OF_CATEGORY =
  "SELECT v.status AS status FROM menu_version v JOIN category c ON c.version_id = v.id WHERE c.id = ?";
const STATUS_OF_GROUP =
  "SELECT v.status AS status FROM menu_version v JOIN category c ON c.version_id = v.id JOIN product_group g ON g.category_id = c.id WHERE g.id = ?";
const STATUS_OF_PRODUCT =
  "SELECT v.status AS status FROM menu_version v JOIN category c ON c.version_id = v.id JOIN product_group g ON g.category_id = c.id JOIN product p ON p.group_id = g.id WHERE p.id = ?";
const STATUS_OF_PRICE =
  "SELECT v.status AS status FROM menu_version v JOIN category c ON c.version_id = v.id JOIN product_group g ON g.category_id = c.id JOIN product p ON p.group_id = g.id JOIN product_price pr ON pr.product_id = p.id WHERE pr.id = ?";

/** Vérifie que l'entité ciblée appartient bien au brouillon (sinon refuse). */
function assertDraftScope(db: DB, sql: string, id: number): void {
  const row = db.prepare(sql).get(id) as { status?: string } | undefined;
  if (!row) throw new Error("Élément introuvable.");
  if (row.status !== "draft") {
    throw new Error("Édition interdite hors brouillon.");
  }
}

/** Prochaine position (max + 1) pour une insertion en fin de liste. */
function nextPosition(db: DB, sql: string, parentId: number): number {
  return (db.prepare(sql).get(parentId) as { p: number }).p;
}

type SqlValue = string | number | null;

/** Applique un `UPDATE` partiel sur une table interne connue (aucune injection). */
function applyUpdate(
  db: DB,
  table: "category" | "product_group" | "product" | "product_price",
  id: number,
  assignments: [string, SqlValue][],
): void {
  if (assignments.length === 0) return;
  const setClause = assignments.map(([col]) => `${col} = ?`).join(", ");
  const values = assignments.map(([, value]) => value);
  db.prepare(`UPDATE ${table} SET ${setClause} WHERE id = ?`).run(...values, id);
}

/** Fabrique une ancre lisible et stable à partir d'un libellé. */
function slugify(label: string): string {
  const slug = label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "categorie";
}

// ── Mutations : catégories ───────────────────────────────────────────────

export function createCategory(input: CategoryInput): number {
  const db = getDb();
  const versionId = ensureDraftVersion(db);
  const position = nextPosition(
    db,
    "SELECT COALESCE(MAX(position), -1) + 1 AS p FROM category WHERE version_id = ?",
    versionId,
  );
  return db
    .prepare(
      `INSERT INTO category (version_id, slug, label, note, position, active)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(
      versionId,
      input.slug ?? slugify(input.label),
      input.label,
      input.note ?? null,
      position,
      input.active === false ? 0 : 1,
    ).lastInsertRowid as number;
}

export function updateCategory(id: number, patch: CategoryPatch): void {
  const db = getDb();
  assertDraftScope(db, STATUS_OF_CATEGORY, id);
  const assignments: [string, SqlValue][] = [];
  if (patch.label !== undefined) assignments.push(["label", patch.label]);
  if (patch.slug !== undefined) assignments.push(["slug", patch.slug]);
  if (patch.note !== undefined) assignments.push(["note", patch.note]);
  if (patch.active !== undefined) assignments.push(["active", patch.active ? 1 : 0]);
  applyUpdate(db, "category", id, assignments);
}

export function deleteCategory(id: number): void {
  const db = getDb();
  assertDraftScope(db, STATUS_OF_CATEGORY, id);
  db.prepare("DELETE FROM category WHERE id = ?").run(id);
}

export function reorderCategories(orderedIds: number[]): void {
  const db = getDb();
  const draftId = requireDraftId(db);
  const stmt = db.prepare(
    "UPDATE category SET position = ? WHERE id = ? AND version_id = ?",
  );
  const reorder = db.transaction(() => {
    orderedIds.forEach((id, index) => stmt.run(index, id, draftId));
  });
  reorder();
}

// ── Mutations : groupes ──────────────────────────────────────────────────

export function createGroup(categoryId: number, input: GroupInput): number {
  const db = getDb();
  assertDraftScope(db, STATUS_OF_CATEGORY, categoryId);
  const position = nextPosition(
    db,
    "SELECT COALESCE(MAX(position), -1) + 1 AS p FROM product_group WHERE category_id = ?",
    categoryId,
  );
  return db
    .prepare(
      "INSERT INTO product_group (category_id, title, note, position) VALUES (?, ?, ?, ?)",
    )
    .run(categoryId, input.title ?? null, input.note ?? null, position)
    .lastInsertRowid as number;
}

export function updateGroup(id: number, patch: GroupPatch): void {
  const db = getDb();
  assertDraftScope(db, STATUS_OF_GROUP, id);
  const assignments: [string, SqlValue][] = [];
  if (patch.title !== undefined) assignments.push(["title", patch.title]);
  if (patch.note !== undefined) assignments.push(["note", patch.note]);
  applyUpdate(db, "product_group", id, assignments);
}

export function deleteGroup(id: number): void {
  const db = getDb();
  assertDraftScope(db, STATUS_OF_GROUP, id);
  db.prepare("DELETE FROM product_group WHERE id = ?").run(id);
}

export function reorderGroups(categoryId: number, orderedIds: number[]): void {
  const db = getDb();
  assertDraftScope(db, STATUS_OF_CATEGORY, categoryId);
  const stmt = db.prepare(
    "UPDATE product_group SET position = ? WHERE id = ? AND category_id = ?",
  );
  const reorder = db.transaction(() => {
    orderedIds.forEach((id, index) => stmt.run(index, id, categoryId));
  });
  reorder();
}

// ── Mutations : produits ─────────────────────────────────────────────────

export function createProduct(groupId: number, input: ProductInput): number {
  const db = getDb();
  assertDraftScope(db, STATUS_OF_GROUP, groupId);
  const position = nextPosition(
    db,
    "SELECT COALESCE(MAX(position), -1) + 1 AS p FROM product WHERE group_id = ?",
    groupId,
  );
  return db
    .prepare(
      "INSERT INTO product (group_id, name, description, available, position) VALUES (?, ?, ?, ?, ?)",
    )
    .run(
      groupId,
      input.name,
      input.description ?? null,
      input.available === false ? 0 : 1,
      position,
    ).lastInsertRowid as number;
}

export function updateProduct(id: number, patch: ProductPatch): void {
  const db = getDb();
  assertDraftScope(db, STATUS_OF_PRODUCT, id);
  const assignments: [string, SqlValue][] = [];
  if (patch.name !== undefined) assignments.push(["name", patch.name]);
  if (patch.description !== undefined)
    assignments.push(["description", patch.description]);
  applyUpdate(db, "product", id, assignments);
}

export function deleteProduct(id: number): void {
  const db = getDb();
  assertDraftScope(db, STATUS_OF_PRODUCT, id);
  db.prepare("DELETE FROM product WHERE id = ?").run(id);
}

export function reorderProducts(groupId: number, orderedIds: number[]): void {
  const db = getDb();
  assertDraftScope(db, STATUS_OF_GROUP, groupId);
  const stmt = db.prepare(
    "UPDATE product SET position = ? WHERE id = ? AND group_id = ?",
  );
  const reorder = db.transaction(() => {
    orderedIds.forEach((id, index) => stmt.run(index, id, groupId));
  });
  reorder();
}

/** Disponibilité d'un produit (rupture / retour). */
export function setAvailability(productId: number, available: boolean): void {
  const db = getDb();
  assertDraftScope(db, STATUS_OF_PRODUCT, productId);
  db.prepare("UPDATE product SET available = ? WHERE id = ?").run(
    available ? 1 : 0,
    productId,
  );
}

// ── Mutations : prix ─────────────────────────────────────────────────────

export function createPrice(productId: number, input: PriceInput): number {
  const db = getDb();
  assertDraftScope(db, STATUS_OF_PRODUCT, productId);
  const position = nextPosition(
    db,
    "SELECT COALESCE(MAX(position), -1) + 1 AS p FROM product_price WHERE product_id = ?",
    productId,
  );
  return db
    .prepare(
      "INSERT INTO product_price (product_id, label, amount, vol, position) VALUES (?, ?, ?, ?, ?)",
    )
    .run(
      productId,
      input.label ?? null,
      input.amount,
      input.vol ?? null,
      position,
    ).lastInsertRowid as number;
}

export function updatePrice(id: number, patch: PricePatch): void {
  const db = getDb();
  assertDraftScope(db, STATUS_OF_PRICE, id);
  const assignments: [string, SqlValue][] = [];
  if (patch.label !== undefined) assignments.push(["label", patch.label]);
  if (patch.amount !== undefined) assignments.push(["amount", patch.amount]);
  if (patch.vol !== undefined) assignments.push(["vol", patch.vol]);
  applyUpdate(db, "product_price", id, assignments);
}

export function deletePrice(id: number): void {
  const db = getDb();
  assertDraftScope(db, STATUS_OF_PRICE, id);
  db.prepare("DELETE FROM product_price WHERE id = ?").run(id);
}

export function reorderPrices(productId: number, orderedIds: number[]): void {
  const db = getDb();
  assertDraftScope(db, STATUS_OF_PRODUCT, productId);
  const stmt = db.prepare(
    "UPDATE product_price SET position = ? WHERE id = ? AND product_id = ?",
  );
  const reorder = db.transaction(() => {
    orderedIds.forEach((id, index) => stmt.run(index, id, productId));
  });
  reorder();
}

/** Remplace en bloc l'ensemble des prix d'un produit (opération transactionnelle). */
export function setProductPrices(productId: number, prices: PriceInput[]): void {
  const db = getDb();
  assertDraftScope(db, STATUS_OF_PRODUCT, productId);
  const del = db.prepare("DELETE FROM product_price WHERE product_id = ?");
  const ins = db.prepare(
    "INSERT INTO product_price (product_id, label, amount, vol, position) VALUES (?, ?, ?, ?, ?)",
  );
  const replace = db.transaction(() => {
    del.run(productId);
    prices.forEach((p, index) => {
      ins.run(productId, p.label ?? null, p.amount, p.vol ?? null, index);
    });
  });
  replace();
}

// ── Duplication & déplacement ────────────────────────────────────────────

/** Slug encore libre dans la version : « cocktails », « cocktails-2 »… */
function uniqueSlug(db: DB, versionId: number, base: string): string {
  const taken = new Set(
    (
      db
        .prepare("SELECT slug FROM category WHERE version_id = ?")
        .all(versionId) as { slug: string }[]
    ).map((r) => r.slug),
  );
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base}-${n}`)) n += 1;
  return `${base}-${n}`;
}

/**
 * Recopie ce qui « appartient » à un produit — ses prix et ses métadonnées de
 * parcours — vers une copie fraîchement insérée. À exécuter dans une
 * transaction ouverte par l'appelant.
 */
function copyProductBelongings(db: DB, sourceId: number, targetId: number): void {
  db.prepare(
    `INSERT INTO product_price (product_id, label, amount, vol, position)
     SELECT ?, label, amount, vol, position
       FROM product_price WHERE product_id = ? ORDER BY position`,
  ).run(targetId, sourceId);
  db.prepare(
    `INSERT INTO cocktail_meta
       (product_id, in_parcours, envies, corps, tags, intensite, portrait, signature, sans_alcool)
     SELECT ?, in_parcours, envies, corps, tags, intensite, portrait, signature, sans_alcool
       FROM cocktail_meta WHERE product_id = ?`,
  ).run(targetId, sourceId);
}

/**
 * Duplique un produit (prix et métadonnées compris) juste après l'original,
 * dans le même groupe. Le nom reçoit un suffixe « (copie) » : la copie est
 * identifiable d'un coup d'œil et reste à éditer avant publication.
 */
export function duplicateProduct(productId: number): number {
  const db = getDb();
  assertDraftScope(db, STATUS_OF_PRODUCT, productId);
  const src = db
    .prepare("SELECT * FROM product WHERE id = ?")
    .get(productId) as ProductRow;

  const duplicate = db.transaction(() => {
    // On ouvre un trou à `position + 1` pour insérer la copie sous l'original.
    db.prepare(
      "UPDATE product SET position = position + 1 WHERE group_id = ? AND position > ?",
    ).run(src.group_id, src.position);

    const newId = db
      .prepare(
        "INSERT INTO product (group_id, name, description, available, position) VALUES (?, ?, ?, ?, ?)",
      )
      .run(
        src.group_id,
        `${src.name} (copie)`,
        src.description,
        src.available,
        src.position + 1,
      ).lastInsertRowid as number;

    copyProductBelongings(db, productId, newId);
    return newId;
  });
  return duplicate();
}

/**
 * Duplique une catégorie entière — groupes, produits, prix, métadonnées — juste
 * après l'original. La copie garde l'état visible/masqué de la source ; son
 * libellé devient « Copie de … » et son slug est rendu unique (c'est une ancre
 * de la page publique).
 */
export function duplicateCategory(categoryId: number): number {
  const db = getDb();
  assertDraftScope(db, STATUS_OF_CATEGORY, categoryId);
  const src = db
    .prepare("SELECT * FROM category WHERE id = ?")
    .get(categoryId) as CategoryRow;

  const duplicate = db.transaction(() => {
    db.prepare(
      "UPDATE category SET position = position + 1 WHERE version_id = ? AND position > ?",
    ).run(src.version_id, src.position);

    const newCatId = db
      .prepare(
        `INSERT INTO category (version_id, slug, label, note, position, active)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(
        src.version_id,
        uniqueSlug(db, src.version_id, `${src.slug}-copie`),
        `Copie de ${src.label}`,
        src.note,
        src.position + 1,
        src.active,
      ).lastInsertRowid as number;

    const insGroup = db.prepare(
      "INSERT INTO product_group (category_id, title, note, position) VALUES (?, ?, ?, ?)",
    );
    const insProduct = db.prepare(
      "INSERT INTO product (group_id, name, description, available, position) VALUES (?, ?, ?, ?, ?)",
    );

    const groups = db
      .prepare("SELECT * FROM product_group WHERE category_id = ? ORDER BY position")
      .all(categoryId) as GroupRow[];

    for (const g of groups) {
      const newGroupId = insGroup.run(newCatId, g.title, g.note, g.position)
        .lastInsertRowid as number;
      const prods = db
        .prepare("SELECT * FROM product WHERE group_id = ? ORDER BY position")
        .all(g.id) as ProductRow[];
      for (const p of prods) {
        const newProductId = insProduct.run(
          newGroupId,
          p.name,
          p.description,
          p.available,
          p.position,
        ).lastInsertRowid as number;
        copyProductBelongings(db, p.id, newProductId);
      }
    }

    return newCatId;
  });
  return duplicate();
}

/**
 * Déplace un produit vers un autre groupe — d'une catégorie à l'autre, le cas
 * échéant. Il atterrit en fin de liste ; le groupe d'origine est recompacté
 * pour ne pas laisser de trou dans les positions.
 */
export function moveProductToGroup(productId: number, targetGroupId: number): void {
  const db = getDb();
  assertDraftScope(db, STATUS_OF_PRODUCT, productId);
  assertDraftScope(db, STATUS_OF_GROUP, targetGroupId);
  const src = db
    .prepare("SELECT * FROM product WHERE id = ?")
    .get(productId) as ProductRow;
  if (src.group_id === targetGroupId) return;

  const move = db.transaction(() => {
    const position = nextPosition(
      db,
      "SELECT COALESCE(MAX(position), -1) + 1 AS p FROM product WHERE group_id = ?",
      targetGroupId,
    );
    db.prepare("UPDATE product SET group_id = ?, position = ? WHERE id = ?").run(
      targetGroupId,
      position,
      productId,
    );
    db.prepare(
      "UPDATE product SET position = position - 1 WHERE group_id = ? AND position > ?",
    ).run(src.group_id, src.position);
  });
  move();
}

// ── Mutations : métadonnées parcours ─────────────────────────────────────

/** Crée ou met à jour les métadonnées « parcours » d'un produit-cocktail. */
export function upsertCocktailMeta(
  productId: number,
  meta: CocktailMetaInput,
): void {
  const db = getDb();
  assertDraftScope(db, STATUS_OF_PRODUCT, productId);
  db.prepare(
    `INSERT INTO cocktail_meta
       (product_id, in_parcours, envies, corps, tags, intensite, portrait, signature, sans_alcool)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(product_id) DO UPDATE SET
       in_parcours = excluded.in_parcours,
       envies      = excluded.envies,
       corps       = excluded.corps,
       tags        = excluded.tags,
       intensite   = excluded.intensite,
       portrait    = excluded.portrait,
       signature   = excluded.signature,
       sans_alcool = excluded.sans_alcool`,
  ).run(
    productId,
    meta.inParcours ? 1 : 0,
    JSON.stringify(meta.envies),
    meta.corps,
    JSON.stringify(meta.tags),
    meta.intensite,
    meta.portrait,
    meta.signature ? 1 : 0,
    meta.sansAlcool ? 1 : 0,
  );
}
