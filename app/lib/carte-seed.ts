import "server-only";
import type { DB } from "./db";
import { MENU } from "../components/sections/carte-complete-data";
import { COCKTAILS } from "../components/sections/carte-data";

/**
 * ─────────────────────────────────────────────────────────────
 *  Amorçage IDEMPOTENT de la carte.
 *
 *  À la toute première lecture (base vierge, aucune `menu_version`), on
 *  importe la carte de référence tenue dans les fichiers TS du dépôt
 *  (`carte-complete-data.ts`, spiritueux inclus) et les métadonnées du
 *  parcours (`carte-data.ts`) dans une version 'active'.
 *
 *  Ces fichiers TS RESTENT la source d'amorçage : ne pas les supprimer. Une
 *  fois amorcée, la carte vit dans SQLite et s'édite depuis l'admin ; le seed
 *  ne se réexécute plus (garde `COUNT(menu_version) > 0`).
 * ─────────────────────────────────────────────────────────────
 */

/** Cocktails du parcours indexés par nom de produit (association par le nom). */
const COCKTAIL_BY_NAME = new Map(COCKTAILS.map((c) => [c.name, c]));

/**
 * Insère la carte de référence si — et seulement si — la base ne contient
 * encore aucune version. Toute l'opération tient dans une transaction.
 */
export function seedCarteIfEmpty(db: DB): void {
  const { n } = db
    .prepare("SELECT COUNT(*) AS n FROM menu_version")
    .get() as { n: number };
  if (n > 0) return;

  const insertVersion = db.prepare(
    `INSERT INTO menu_version (label, status, published_at)
     VALUES (?, 'active', datetime('now'))`,
  );
  const insertCategory = db.prepare(
    `INSERT INTO category (version_id, slug, label, note, position, active)
     VALUES (?, ?, ?, ?, ?, 1)`,
  );
  const insertGroup = db.prepare(
    `INSERT INTO product_group (category_id, title, note, position)
     VALUES (?, ?, ?, ?)`,
  );
  const insertProduct = db.prepare(
    `INSERT INTO product (group_id, name, description, available, position)
     VALUES (?, ?, ?, 1, ?)`,
  );
  const insertPrice = db.prepare(
    `INSERT INTO product_price (product_id, label, amount, vol, position)
     VALUES (?, ?, ?, ?, ?)`,
  );
  const insertMeta = db.prepare(
    `INSERT INTO cocktail_meta
       (product_id, in_parcours, envies, corps, tags, intensite, portrait, signature, sans_alcool)
     VALUES (?, 1, ?, ?, ?, ?, ?, ?, ?)`,
  );

  const seed = db.transaction(() => {
    const versionId = insertVersion.run("Carte initiale").lastInsertRowid as number;

    MENU.forEach((category, catPos) => {
      const categoryId = insertCategory.run(
        versionId,
        category.id,
        category.label,
        category.note ?? null,
        catPos,
      ).lastInsertRowid as number;

      category.groups.forEach((group, groupPos) => {
        const groupId = insertGroup.run(
          categoryId,
          group.title ?? null,
          group.note ?? null,
          groupPos,
        ).lastInsertRowid as number;

        group.items.forEach((item, itemPos) => {
          const productId = insertProduct.run(
            groupId,
            item.name,
            item.desc ?? null,
            itemPos,
          ).lastInsertRowid as number;

          // Prix : soit plusieurs formats (label + prix), soit un tarif unique
          // (label vide, volume facultatif).
          if (item.prices && item.prices.length > 0) {
            item.prices.forEach((p, pricePos) => {
              insertPrice.run(productId, p.label, p.price, null, pricePos);
            });
          } else if (item.price !== undefined) {
            insertPrice.run(productId, null, item.price, item.vol ?? null, 0);
          }

          // Métadonnées parcours : présentes uniquement pour les cocktails de
          // `COCKTAILS`, appariés par le nom exact du produit.
          const cocktail = COCKTAIL_BY_NAME.get(item.name);
          if (cocktail) {
            insertMeta.run(
              productId,
              JSON.stringify(cocktail.envies),
              cocktail.corps,
              JSON.stringify(cocktail.sensations),
              cocktail.intensite,
              cocktail.portrait,
              cocktail.signature ? 1 : 0,
              cocktail.sansAlcool ? 1 : 0,
            );
          }
        });
      });
    });
  });

  seed();
}
