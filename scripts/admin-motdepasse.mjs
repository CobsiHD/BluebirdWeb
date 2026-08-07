#!/usr/bin/env node
/**
 * Définit le mot de passe de l'espace admin.
 *
 *   npm run admin:motdepasse
 *
 * La saisie est MASQUÉE et n'apparaît ni à l'écran, ni dans l'historique du
 * shell, ni dans un fichier de configuration : seule une empreinte scrypt est
 * écrite en base (table `settings`, clé `admin_password_hash`). Le mot de passe
 * lui-même n'est stocké nulle part et reste irrécupérable — s'il est oublié,
 * on en redéfinit un avec ce script.
 *
 * À lancer là où vit la base :
 *   • en local  → base dans <projet>/.data
 *   • en prod   → sur le VPS, dans /var/www/bluebird
 *                 (BLUEBIRD_DATA_DIR est lu depuis .env.local)
 *
 * Une fois un premier mot de passe défini, les changements suivants se font
 * depuis /admin, sans toucher au serveur.
 *
 * ⚠ Le format d'empreinte est dupliqué ici depuis app/lib/admin-password.ts
 *   (source de vérité) : un script Node ne peut pas importer un module
 *   TypeScript marqué `server-only`. Toute évolution du format doit toucher
 *   les deux fichiers.
 */

import { createInterface } from "node:readline";
import { randomBytes, scryptSync } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

const MIN = 10;
const N = 16_384;
const R = 8;
const P = 1;
const KEYLEN = 64;

/** Lit BLUEBIRD_DATA_DIR depuis l'environnement, sinon depuis .env.local. */
function dataDir() {
  if (process.env.BLUEBIRD_DATA_DIR?.trim()) {
    return process.env.BLUEBIRD_DATA_DIR.trim();
  }
  const envFile = path.join(process.cwd(), ".env.local");
  if (existsSync(envFile)) {
    const ligne = readFileSync(envFile, "utf8")
      .split("\n")
      .find((l) => l.startsWith("BLUEBIRD_DATA_DIR="));
    const valeur = ligne?.slice("BLUEBIRD_DATA_DIR=".length).trim();
    if (valeur) return valeur;
  }
  return path.join(process.cwd(), ".data");
}

/** Demande une saisie sans l'afficher (ni écho, ni historique). */
function demanderMasque(question) {
  return new Promise((resolve) => {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
    });
    // On intercepte l'écriture pour n'afficher que l'invite, jamais la frappe.
    let invite = true;
    rl._writeToOutput = (chaine) => {
      if (invite) {
        rl.output.write(chaine);
        invite = false;
      }
    };
    rl.question(question, (reponse) => {
      rl.output.write("\n");
      rl.close();
      resolve(reponse);
    });
  });
}

function empreinte(motDePasse) {
  const sel = randomBytes(16);
  const cle = scryptSync(motDePasse.normalize("NFKC"), sel, KEYLEN, {
    N,
    r: R,
    p: P,
  });
  return `scrypt$${N}$${R}$${P}$${sel.toString("hex")}$${cle.toString("hex")}`;
}

async function main() {
  if (!process.stdin.isTTY) {
    console.error(
      "Ce script demande une saisie masquée : lancez-le depuis un vrai terminal\n" +
        "(en SSH, `ssh -t ubuntu@… 'cd /var/www/bluebird && npm run admin:motdepasse'`).",
    );
    process.exit(1);
  }

  const dir = dataDir();
  const fichier = path.join(dir, "bluebird.db");
  if (!existsSync(fichier)) {
    console.error(
      `Base introuvable : ${fichier}\n` +
        "Lancez le site au moins une fois pour qu'elle soit créée et amorcée.",
    );
    process.exit(1);
  }

  const db = new Database(fichier);
  const existant = db
    .prepare("SELECT value FROM settings WHERE key = 'admin_password_hash'")
    .get();

  console.log(`\nBase : ${fichier}`);
  console.log(
    existant
      ? "Un mot de passe est déjà défini — il sera remplacé, et toutes les sessions ouvertes tomberont.\n"
      : "Aucun mot de passe défini pour l'instant.\n",
  );

  const premier = await demanderMasque("Nouveau mot de passe : ");
  if (premier.length < MIN) {
    console.error(`\nTrop court : ${MIN} caractères minimum.`);
    process.exit(1);
  }
  const second = await demanderMasque("Confirmez             : ");
  if (premier !== second) {
    console.error("\nLes deux saisies diffèrent. Rien n'a été modifié.");
    process.exit(1);
  }

  db.prepare(
    `INSERT INTO settings (key, value, updated_at)
     VALUES ('admin_password_hash', ?, datetime('now'))
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
  ).run(empreinte(premier));

  console.log("\n✓ Mot de passe enregistré (empreinte scrypt).");
  console.log("  Redémarrez le service pour être sûr : sudo systemctl restart bluebird\n");
}

main();
