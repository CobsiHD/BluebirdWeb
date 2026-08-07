import "server-only";
import { mkdirSync } from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

/**
 * ─────────────────────────────────────────────────────────────
 *  Base SQLite — persistance de la carte modifiable.
 *
 *  Le fichier vit dans un dossier de DONNÉES SÉPARÉ du dépôt
 *  (BLUEBIRD_DATA_DIR), pour survivre au déploiement : celui-ci fait
 *  un `git reset --hard` puis `npm run build` dans /var/www/bluebird,
 *  ce qui écraserait toute donnée rangée dans l'arbre git.
 *
 *    • En prod (VPS)  : BLUEBIRD_DATA_DIR=/var/www/bluebird-data
 *    • En local (dev) : défaut = <projet>/.data  (ignoré par git)
 *
 *  better-sqlite3 est synchrone : pas de pool, une seule connexion
 *  partagée suffit. On la met en cache sur `globalThis` pour survivre
 *  au hot-reload de Next en développement.
 * ─────────────────────────────────────────────────────────────
 */

export type DB = Database.Database;

function resolveDataDir(): string {
  const configured = process.env.BLUEBIRD_DATA_DIR?.trim();
  return configured && configured.length > 0
    ? configured
    : path.join(process.cwd(), ".data");
}

/**
 * Migrations appliquées dans l'ordre, une seule fois chacune.
 * Pour faire évoluer le schéma : ajouter une entrée à la fin, jamais
 * modifier une migration déjà déployée.
 *
 * Les tables de la CARTE seront ajoutées ici une fois le cahier des
 * charges connu (leur forme dépend du modèle d'édition retenu).
 */
const MIGRATIONS: { name: string; up: (db: DB) => void }[] = [
  {
    name: "001_settings",
    up: (db) => {
      // Table clé/valeur généraliste : réglages et métadonnées (ex. version
      // courante de la carte). Point d'ancrage pour la suite.
      db.exec(`
        CREATE TABLE settings (
          key        TEXT PRIMARY KEY,
          value      TEXT NOT NULL,
          updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
      `);
    },
  },
  {
    name: "002_carte",
    up: (db) => {
      // ── Modèle d'édition de la carte ────────────────────────────────
      // La carte est VERSIONNÉE : chaque `menu_version` est un cliché complet
      // (catégories → groupes → produits → prix). À un instant donné on a au
      //  plus une version 'active' (publiée, servie au public) et au plus une
      // version 'draft' (brouillon en cours d'édition). Les anciennes actives
      // deviennent 'archived' à la publication et restent restaurables.
      //
      // Publier = un simple basculement de statut, sans toucher aux lignes :
      // pas de fenêtre où la carte publique serait incohérente.
      //
      // Les montants (`amount`) sont stockés en TEXT pour préserver le format
      // exact saisi ("10.5", "8") sans arrondi flottant. Les booléens sont des
      // INTEGER 0/1 (convention SQLite).
      db.exec(`
        CREATE TABLE menu_version (
          id           INTEGER PRIMARY KEY AUTOINCREMENT,
          label        TEXT NOT NULL,
          status       TEXT NOT NULL CHECK (status IN ('draft', 'active', 'archived')),
          created_at   TEXT NOT NULL DEFAULT (datetime('now')),
          published_at TEXT
        );

        CREATE TABLE category (
          id         INTEGER PRIMARY KEY AUTOINCREMENT,
          version_id INTEGER NOT NULL REFERENCES menu_version(id) ON DELETE CASCADE,
          slug       TEXT NOT NULL,
          label      TEXT NOT NULL,
          note       TEXT,
          position   INTEGER NOT NULL DEFAULT 0,
          active     INTEGER NOT NULL DEFAULT 1
        );

        CREATE TABLE product_group (
          id          INTEGER PRIMARY KEY AUTOINCREMENT,
          category_id INTEGER NOT NULL REFERENCES category(id) ON DELETE CASCADE,
          title       TEXT,
          note        TEXT,
          position    INTEGER NOT NULL DEFAULT 0
        );

        CREATE TABLE product (
          id          INTEGER PRIMARY KEY AUTOINCREMENT,
          group_id    INTEGER NOT NULL REFERENCES product_group(id) ON DELETE CASCADE,
          name        TEXT NOT NULL,
          description TEXT,
          available   INTEGER NOT NULL DEFAULT 1,
          position    INTEGER NOT NULL DEFAULT 0
        );

        CREATE TABLE product_price (
          id         INTEGER PRIMARY KEY AUTOINCREMENT,
          product_id INTEGER NOT NULL REFERENCES product(id) ON DELETE CASCADE,
          label      TEXT,
          amount     TEXT NOT NULL,
          vol        TEXT,
          position   INTEGER NOT NULL DEFAULT 0
        );

        -- Métadonnées « parcours » d'un produit-cocktail (1 pour 1 avec product).
        -- envies/tags sérialisés en JSON (tableaux courts de chaînes).
        CREATE TABLE cocktail_meta (
          product_id  INTEGER PRIMARY KEY REFERENCES product(id) ON DELETE CASCADE,
          in_parcours INTEGER NOT NULL DEFAULT 0,
          envies      TEXT NOT NULL DEFAULT '[]',
          corps       TEXT,
          tags        TEXT NOT NULL DEFAULT '[]',
          intensite   INTEGER,
          portrait    TEXT,
          signature   INTEGER NOT NULL DEFAULT 0,
          sans_alcool INTEGER NOT NULL DEFAULT 0
        );

        -- Lectures par parent, ordonnées : hydratation de la carte en une passe.
        CREATE INDEX idx_category_version ON category(version_id, position);
        CREATE INDEX idx_group_category  ON product_group(category_id, position);
        CREATE INDEX idx_product_group   ON product(group_id, position);
        CREATE INDEX idx_price_product   ON product_price(product_id, position);

        -- Garde-fous : au plus une active et au plus un brouillon à la fois.
        CREATE UNIQUE INDEX idx_one_active ON menu_version(status) WHERE status = 'active';
        CREATE UNIQUE INDEX idx_one_draft  ON menu_version(status) WHERE status = 'draft';
      `);
    },
  },
  {
    name: "003_ardoise",
    up: (db) => {
      // L'ardoise : un message temporaire INDÉPENDANT de la carte (cocktail du
      // jour, Happy Hour, concert…). Une seule ligne (id=1). `content` est du
      // HTML DÉJÀ ASSAINI (sous-ensemble gras/italique/souligné/saut de ligne) ;
      // l'assainissement se fait à l'écriture, jamais à l'affichage.
      db.exec(`
        CREATE TABLE ardoise (
          id           INTEGER PRIMARY KEY CHECK (id = 1),
          active       INTEGER NOT NULL DEFAULT 0,
          content      TEXT NOT NULL DEFAULT '',
          updated_at   TEXT,
          published_at TEXT
        );
        INSERT INTO ardoise (id, active, content) VALUES (1, 0, '');
      `);
    },
  },
];

function runMigrations(db: DB): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name       TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  const applied = new Set(
    db
      .prepare("SELECT name FROM schema_migrations")
      .all()
      .map((row) => (row as { name: string }).name),
  );

  const record = db.prepare("INSERT INTO schema_migrations (name) VALUES (?)");

  for (const migration of MIGRATIONS) {
    if (applied.has(migration.name)) continue;
    // Chaque migration + son marquage dans une même transaction : soit tout
    // passe, soit rien — on ne peut pas se retrouver à moitié migré.
    const tx = db.transaction(() => {
      migration.up(db);
      record.run(migration.name);
    });
    tx();
  }
}

function openDatabase(): DB {
  const dir = resolveDataDir();
  mkdirSync(dir, { recursive: true });

  const db = new Database(path.join(dir, "bluebird.db"));
  // WAL : de meilleures lectures concurrentes ; robuste à un arrêt brutal.
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  runMigrations(db);
  return db;
}

// Cache sur globalThis : une seule connexion, y compris à travers le
// hot-reload de Next en développement (sinon on rouvre le fichier à chaque
// rechargement de module).
const globalForDb = globalThis as unknown as { __bluebirdDb?: DB };

/** Connexion SQLite partagée (ouverte et migrée à la première demande). */
export function getDb(): DB {
  if (!globalForDb.__bluebirdDb) {
    globalForDb.__bluebirdDb = openDatabase();
  }
  return globalForDb.__bluebirdDb;
}

/** État de la base — pour vérifier d'un coup d'œil qu'elle est opérationnelle. */
export function getDbStatus(): { dir: string; migrations: string[] } {
  const db = getDb();
  const migrations = db
    .prepare("SELECT name FROM schema_migrations ORDER BY name")
    .all()
    .map((row) => (row as { name: string }).name);
  return { dir: resolveDataDir(), migrations };
}
