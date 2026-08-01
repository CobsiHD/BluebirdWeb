import type { PostInstagram } from "../../lib/instagram";

/**
 * ⏻ Affichage des publications elles-mêmes (masquées le 1er août 2026, en
 * attente d'arbitrage sur le rendu blanc imposé par les embeds Instagram).
 *
 * `false` → seuls l'entête du compte et le bouton « Suivre » restent visibles.
 * Rien n'est démonté : liens des publications, cadre défilant et script de
 * récupération sont conservés. Repasser à `true` réaffiche la grille.
 */
export const PUBLICATIONS_VISIBLES = false;

/**
 * ▶ SOURCE PRINCIPALE — liens des publications à afficher.
 *
 * Aucun jeton, aucune app Meta : l'embed officiel d'Instagram sait afficher
 * n'importe quelle publication d'un compte public à partir de son lien.
 *
 * Pour récupérer un lien, depuis l'app Instagram :
 *   publication → « ⋯ » (en haut à droite) → « Copier le lien ».
 * Depuis un navigateur : c'est l'URL de la publication.
 *
 * Coller ci-dessous, une par ligne, dans l'ordre d'affichage souhaité.
 * Les paramètres de suivi (`?igsh=…`, `?utm_source=qr`) peuvent être laissés,
 * ils sont retirés automatiquement.
 *
 * Exemple :
 *   "https://www.instagram.com/p/C8xYzAbCdEf/",
 *   "https://www.instagram.com/reel/C9wXyZaBcDe/",
 */
const LIENS_BRUTS: string[] = [
  "https://www.instagram.com/p/DbGjqJLMr-v/",
  "https://www.instagram.com/p/DY63vkdsWsH/",
  "https://www.instagram.com/p/DYejV04jMH_/",
  "https://www.instagram.com/p/DKkUWnEMgPK/",
];

/** Retire les paramètres de suivi et normalise la barre finale. */
function normaliser(lien: string) {
  try {
    const url = new URL(lien.trim());
    url.search = "";
    url.hash = "";
    if (!url.pathname.endsWith("/")) url.pathname += "/";
    return url.toString();
  } catch {
    return "";
  }
}

export const PUBLICATIONS = LIENS_BRUTS.map(normaliser).filter(Boolean);

/**
 * Solution de repli : vignettes hébergées par nous, intégrées au design du
 * site (fond noir, voile rouge au survol) plutôt qu'au rendu blanc imposé par
 * Instagram. Utilisée si `PUBLICATIONS` est vide et qu'aucun jeton d'API n'est
 * configuré. Déposer les visuels dans `public/brand/instagram/`.
 *
 * Exemple :
 *   {
 *     id: "reveillon",
 *     permalink: "https://www.instagram.com/p/XXXXXXXXXXX/",
 *     image: "/brand/instagram/reveillon.jpg",
 *     alt: "Coupe de champagne sur le comptoir, soir de réveillon",
 *     distante: false,
 *   }
 */
export const POSTS_MANUELS: PostInstagram[] = [];
