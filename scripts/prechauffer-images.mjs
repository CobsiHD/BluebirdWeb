#!/usr/bin/env node
/**
 * Préchauffage du cache d'images.
 *
 *   npm run images:prechauffer                 (vise http://localhost:3000)
 *   npm run images:prechauffer -- https://bluebird-bar.fr
 *
 * Next optimise les images à la demande : le tout premier visiteur à réclamer
 * une taille donnée attend son encodage. Ce script joue ce rôle à sa place,
 * juste après un déploiement, en demandant toutes les variantes présentes dans
 * les `srcset` de la page. Les suivantes sont servies depuis le cache
 * (`minimumCacheTTL` est réglé à un an dans next.config.ts).
 *
 * Idempotent et sans effet de bord : ce ne sont que des GET d'images.
 */

const base = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "");
const ACCEPT = "image/avif,image/webp,*/*";
const PARALLELE = 4; // un VPS modeste encaisse mal plus d'encodages simultanés

const page = await fetch(base, { headers: { "User-Agent": "prechauffage-bluebird" } });
if (!page.ok) {
  console.error(`Page inaccessible : HTTP ${page.status} sur ${base}`);
  process.exit(1);
}
const html = await page.text();

// Toutes les variantes annoncées dans les srcset, plus les src de repli.
const urls = [
  ...new Set(
    [...html.matchAll(/\/_next\/image\?[^"'\s]+/g)]
      .map((m) => m[0].replaceAll("&amp;", "&"))
      .filter((u) => u.includes("url=")),
  ),
];

if (urls.length === 0) {
  console.error("Aucune image optimisée trouvée dans la page.");
  process.exit(1);
}

console.log(`\n${urls.length} variantes à préchauffer sur ${base}\n`);

let faites = 0;
let octets = 0;
let echecs = 0;
const debut = process.hrtime.bigint();

async function traiter(url) {
  try {
    const reponse = await fetch(base + url, { headers: { Accept: ACCEPT } });
    if (!reponse.ok) throw new Error(`HTTP ${reponse.status}`);
    octets += (await reponse.arrayBuffer()).byteLength;
  } catch (erreur) {
    echecs++;
    console.warn(`  échec : ${url.slice(0, 70)}… (${erreur.message})`);
  }
  faites++;
  process.stdout.write(`\r  ${faites}/${urls.length}`);
}

// File d'attente à largeur fixe.
const file = urls.slice();
await Promise.all(
  Array.from({ length: PARALLELE }, async () => {
    for (let url = file.shift(); url; url = file.shift()) await traiter(url);
  }),
);

const secondes = Number(process.hrtime.bigint() - debut) / 1e9;
console.log(
  `\n\n✓ ${faites - echecs} variantes en cache` +
    (echecs ? `, ${echecs} en échec` : "") +
    ` — ${(octets / 1024 / 1024).toFixed(1)} Mo encodés en ${secondes.toFixed(1)} s.\n`,
);
