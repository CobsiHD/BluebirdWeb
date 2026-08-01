"use client";

import { useEffect } from "react";

/**
 * Navigation par ancres sans trace dans l'URL.
 *
 * Par défaut, un clic sur `#carte` écrit `#carte` dans la barre d'adresse :
 * au rechargement, le navigateur ramène le visiteur à cette section au lieu
 * du haut de page. Ici, le défilement est déclenché à la main et l'URL n'est
 * jamais modifiée.
 *
 * Trois comportements :
 *   1. rechargement → retour en haut (restauration du scroll désactivée) ;
 *   2. lien partagé contenant une ancre → on l'honore une fois, puis on efface
 *      l'ancre pour que le rechargement suivant reparte du haut ;
 *   3. clic sur une ancre → défilement doux, sans écrire dans l'URL.
 *
 * Monté une seule fois dans le layout : un écouteur sur `document` couvre
 * l'en-tête, le pied de page et tous les appels à l'action de la page.
 */
export default function NavigationAncres() {
  useEffect(() => {
    // 1. Le navigateur ne doit pas restaurer la position au rechargement.
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";

    const effacerAncre = () =>
      history.replaceState(null, "", location.pathname + location.search);

    // 2. Ancre héritée d'un lien partagé : on s'y rend, puis on l'efface.
    if (location.hash) {
      document.querySelector(location.hash)?.scrollIntoView();
      effacerAncre();
    } else {
      // Certains navigateurs restaurent la position avant que cet effet ne
      // s'exécute : on remet explicitement en haut.
      window.scrollTo(0, 0);
    }

    // 3. Clics sur les ancres internes.
    const auClic = (evenement: MouseEvent) => {
      // On ne détourne que le clic gauche simple : ⌘/Ctrl-clic, clic milieu et
      // clic droit doivent garder leur comportement natif (nouvel onglet…).
      if (
        evenement.defaultPrevented ||
        evenement.button !== 0 ||
        evenement.metaKey ||
        evenement.ctrlKey ||
        evenement.shiftKey ||
        evenement.altKey
      )
        return;

      const lien = (evenement.target as HTMLElement | null)?.closest?.("a");
      const href = lien?.getAttribute("href");
      if (!href || !href.startsWith("#") || href === "#") return;

      const cible = document.querySelector(href);
      if (!(cible instanceof HTMLElement)) return;

      evenement.preventDefault();

      const doux = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      cible.scrollIntoView({ behavior: doux ? "smooth" : "auto", block: "start" });

      // Accessibilité : sans navigation réelle, le focus resterait sur le lien
      // et un lecteur d'écran continuerait de lire le menu. On le déplace sur
      // la section, en retirant le `tabindex` technique une fois relâché.
      if (!cible.hasAttribute("tabindex")) {
        cible.setAttribute("tabindex", "-1");
        cible.addEventListener("blur", () => cible.removeAttribute("tabindex"), {
          once: true,
        });
      }
      cible.focus({ preventScroll: true });
    };

    document.addEventListener("click", auClic);
    return () => document.removeEventListener("click", auClic);
  }, []);

  return null;
}
