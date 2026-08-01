#!/usr/bin/env node
/**
 * Récupère les liens des dernières publications d'un compte Instagram public.
 *
 *   npm run instagram:liens
 *   npm run instagram:liens -- --nombre=8
 *   npm run instagram:liens -- --ecrire      (met à jour instagram-data.ts)
 *
 * ⚠️ À exécuter à la main, en local. Jamais depuis le site.
 *
 *   - Meta interdit la collecte automatisée dans ses conditions d'utilisation.
 *     L'usage visé ici est limité : ton propre compte, tes propres
 *     publications, quelques liens, pour les afficher sur ton propre site avec
 *     l'embed officiel — donc en renvoyant le trafic vers Instagram.
 *   - Rien de tout ça n'est documenté par Meta et peut casser sans préavis.
 *     Le jour où ça arrive, la copie manuelle des liens marche toujours
 *     (publication → « ⋯ » → « Copier le lien »).
 *
 * Source utilisée : la page d'embed du profil (`/<compte>/embed/`), le seul
 * endpoint encore servi aux visiteurs non connectés. L'API `web_profile_info`
 * et `?__a=1` répondent aujourd'hui 400 ou une page vide.
 */

import { readFile, writeFile } from "node:fs/promises";

const COMPTE = "bluebird.chambery";
const FICHIER = new URL("../app/components/sections/instagram-data.ts", import.meta.url);

const args = process.argv.slice(2);
const nombre = Number(args.find((a) => a.startsWith("--nombre="))?.split("=")[1] ?? 6);
const ecrire = args.includes("--ecrire");

/**
 * Ces en-têtes ne sont pas cosmétiques : Instagram sert deux versions de la
 * page d'embed. Sans `Sec-Fetch-Site: same-origin` (accompagné du Referer et
 * de l'identifiant public de l'app web), on reçoit une coquille de 600 Ko qui
 * charge tout en JavaScript et ne contient aucune donnée exploitable. Avec,
 * on reçoit la version rendue côté serveur, avec les publications dedans.
 */
const ENTETES = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
  "Accept-Language": "fr-FR,fr;q=0.9",
  Accept: "*/*",
  Referer: "https://www.instagram.com/",
  "Sec-Fetch-Site": "same-origin",
  "x-ig-app-id": "936619743392459",
};

/** Fin de l'objet `{…}` ouvert à `depart`, accolades entre guillemets ignorées. */
function finObjet(texte, depart) {
  let profondeur = 0;
  let dansChaine = false;
  let echappe = false;

  for (let i = depart; i < texte.length; i++) {
    const c = texte[i];
    if (dansChaine) {
      if (echappe) echappe = false;
      else if (c === "\\") echappe = true;
      else if (c === '"') dansChaine = false;
      continue;
    }
    if (c === '"') dansChaine = true;
    else if (c === "{") profondeur++;
    else if (c === "}" && --profondeur === 0) return i;
  }
  return texte.length;
}

/**
 * Extrait les codes des publications de premier niveau.
 *
 * Subtilité : un carrousel expose aussi le code de chacune de ses images, sous
 * `edge_sidecar_to_children`. Sans ce filtrage on prendrait une même
 * publication pour cinq. On repère donc les blocs « enfants » et on écarte
 * tout code qui tombe dedans.
 */
function extraireCodes(html) {
  // Le JSON est encapsulé dans une chaîne JS : on le déséchappe d'abord.
  const texte = html
    .replaceAll("\\\\", "\\")
    .replaceAll('\\"', '"')
    .replaceAll("\\/", "/");

  const blocsEnfants = [];
  const marqueur = /"edge_sidecar_to_children":\s*\{/g;
  let trouve;
  while ((trouve = marqueur.exec(texte)) !== null) {
    const debut = texte.indexOf("{", trouve.index);
    blocsEnfants.push([debut, finObjet(texte, debut)]);
  }

  const codes = [];
  const vus = new Set();
  for (const m of texte.matchAll(/"shortcode":"([A-Za-z0-9_-]{7,})"/g)) {
    const estEnfant = blocsEnfants.some(([a, b]) => m.index >= a && m.index <= b);
    if (estEnfant || vus.has(m[1])) continue;
    vus.add(m[1]);
    codes.push(m[1]);
  }
  return codes;
}

async function mettreAJourLeFichier(liens) {
  const source = await readFile(FICHIER, "utf8");
  const bloc = /(const LIENS_BRUTS: string\[\] = \[)[\s\S]*?(\];)/;
  if (!bloc.test(source)) throw new Error("LIENS_BRUTS introuvable dans instagram-data.ts");
  const corps = liens.map((l) => `\n  "${l}",`).join("");
  await writeFile(FICHIER, source.replace(bloc, `$1${corps}\n$2`), "utf8");
}

let html;
try {
  const reponse = await fetch(`https://www.instagram.com/${COMPTE}/embed/`, {
    headers: ENTETES,
  });
  if (!reponse.ok) throw new Error(`HTTP ${reponse.status}`);
  html = await reponse.text();
} catch (erreur) {
  console.error(`\nInstagram n'a pas répondu : ${erreur.message}`);
  console.error(
    "\nSolution qui marche toujours : ouvrir chaque publication dans l'app,",
    "\n« ⋯ » → « Copier le lien », et coller dans LIENS_BRUTS.\n",
  );
  process.exit(1);
}

const codes = extraireCodes(html);

if (codes.length === 0) {
  console.error(
    `\nAucune publication trouvée pour @${COMPTE}.`,
    "\nSoit le compte est passé en privé, soit Instagram a changé sa page d'embed.",
    "\nRepli : copier les liens à la main depuis l'app.\n",
  );
  process.exit(1);
}

const liens = codes.slice(0, nombre).map((c) => `https://www.instagram.com/p/${c}/`);

console.log(`\n${liens.length} publication(s) de @${COMPTE} :\n`);
for (const l of liens) console.log(`  "${l}",`);

if (ecrire) {
  await mettreAJourLeFichier(liens);
  console.log("\n✓ instagram-data.ts mis à jour.\n");
} else {
  console.log(
    "\nÀ coller dans LIENS_BRUTS (app/components/sections/instagram-data.ts),",
    "\nou relancer avec --ecrire pour que le script s'en charge.\n",
  );
}
