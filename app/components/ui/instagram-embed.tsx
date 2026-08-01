"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    instgrm?: { Embeds: { process: () => void } };
  }
}

const SCRIPT_ID = "instagram-embed-js";

/**
 * Embeds officiels Instagram.
 *
 * Aucun jeton, aucune app Meta : `embed.js` sait afficher n'importe quelle
 * publication d'un compte public à partir de son lien. En revanche Instagram
 * impose son propre rendu (carte blanche) et le script est chargé depuis
 * instagram.com chez le visiteur — d'où le chargement différé ci-dessous :
 * tant que la galerie n'approche pas de l'écran, aucun appel n'est fait à Meta.
 *
 * Si le script est bloqué (extension, réseau, refus de cookies), la citation
 * reste un simple lien vers la publication : rien ne casse.
 */
export function InstagramEmbeds({ liens }: { liens: string[] }) {
  const conteneur = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  /* On n'appelle Instagram que si le bloc entre dans le champ du visiteur. */
  useEffect(() => {
    const cible = conteneur.current;
    if (!cible || visible) return;

    const observateur = new IntersectionObserver(
      (entrees) => {
        if (entrees.some((e) => e.isIntersecting)) {
          setVisible(true);
          observateur.disconnect();
        }
      },
      { rootMargin: "300px" },
    );
    observateur.observe(cible);
    return () => observateur.disconnect();
  }, [visible]);

  /* Chargement du script puis rendu des citations en publications. */
  useEffect(() => {
    if (!visible) return;

    const traiter = () => window.instgrm?.Embeds.process();

    if (window.instgrm) {
      traiter();
      return;
    }

    const existant = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existant) {
      existant.addEventListener("load", traiter);
      return () => existant.removeEventListener("load", traiter);
    }

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = "https://www.instagram.com/embed.js";
    script.async = true;
    script.addEventListener("load", traiter);
    document.body.appendChild(script);
    return () => script.removeEventListener("load", traiter);
  }, [visible, liens]);

  /**
   * Les cartes d'Instagram n'ont ni la même hauteur ni le même rythme selon la
   * longueur des légendes. Plutôt que de les laisser étirer le bas de page, on
   * les enferme dans un cadre de hauteur fixe qui défile : la section garde une
   * taille constante quel que soit le nombre de publications.
   *
   * Deux colonnes au maximum — Instagram impose une largeur minimale de 326 px
   * à ses cartes, une troisième colonne déborderait.
   */
  return (
    <div className="relative mx-auto mt-10 max-w-3xl">
      <div
        ref={conteneur}
        className="h-[30rem] overflow-y-auto rounded-2xl border border-bb-gray-900/80 bg-bb-black/40 p-3 sm:h-[34rem] sm:p-4"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {liens.map((lien) => (
            <blockquote
              key={lien}
              className="instagram-media"
              data-instgrm-permalink={lien}
              data-instgrm-version="14"
              style={{ background: "transparent", border: 0, margin: 0, padding: 0 }}
            >
              <a
                href={lien}
                target="_blank"
                rel="noopener noreferrer"
                className="font-body block rounded-lg border border-bb-gray-900 px-4 py-6 text-center text-[0.62rem] uppercase tracking-[0.25em] text-bb-white/70 transition-colors hover:border-bb-red hover:text-bb-white"
              >
                Voir la publication ↗
              </a>
            </blockquote>
          ))}
        </div>
      </div>

      {/* Dégradé de bas de cadre : indique qu'il reste des publications à
          faire défiler, sans intercepter le pointeur. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-px bottom-px h-16 rounded-b-2xl bg-gradient-to-t from-bb-black to-transparent"
      />
    </div>
  );
}
