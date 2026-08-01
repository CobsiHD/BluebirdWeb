import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
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
