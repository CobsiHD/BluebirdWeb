import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    /**
     * AVIF d'abord, WebP en repli pour les navigateurs qui ne le lisent pas
     * (et format d'origine au-delà). À qualité identique — l'encodage reste à
     * 75 —, l'AVIF pèse nettement moins que le WebP : c'est du temps de
     * chargement gagné sans toucher au rendu.
     */
    formats: ["image/avif", "image/webp"],
    /**
     * Nos images sont des imports statiques au contenu figé : inutile de
     * réencoder toutes les 60 s (valeur par défaut). Un an de cache côté
     * serveur comme navigateur.
     */
    minimumCacheTTL: 31_536_000,
    /**
     * Vignettes du feed Instagram (cf. app/lib/instagram.ts).
     * Les URL du CDN Meta portent une signature en query string : on ne peut
     * donc pas verrouiller `search`, sinon l'optimiseur renverrait 400.
     * Le chemin reste limité à ces deux domaines d'images.
     */
    remotePatterns: [
      { protocol: "https", hostname: "**.cdninstagram.com" },
      { protocol: "https", hostname: "**.fbcdn.net" },
    ],
  },
};

export default nextConfig;
