"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  CONTACT,
  HORAIRES,
  HORAIRES_RENSEIGNES,
  type Horaire,
} from "./infos-data";

const EASE_BB = [0.16, 1, 0.3, 1] as const;

const reveal = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 1, ease: EASE_BB } },
};

const enMinutes = (heure: string) =>
  Number(heure.slice(0, 2)) * 60 + Number(heure.slice(3, 5));

/** Le bar est-il ouvert à cet instant ? Gère les fermetures après minuit. */
function estOuvert(horaires: Horaire[], maintenant: Date) {
  const jour = maintenant.getDay();
  const veille = (jour + 6) % 7;
  const minute = maintenant.getHours() * 60 + maintenant.getMinutes();

  return horaires.some((h) => {
    if (!h.ouvre || !h.ferme) return false;
    const ouvre = enMinutes(h.ouvre);
    const ferme = enMinutes(h.ferme);
    const debordeSurLeLendemain = ferme <= ouvre;

    // Créneau du jour même.
    if (h.index.includes(jour) && minute >= ouvre && (debordeSurLeLendemain || minute < ferme))
      return true;
    // Fin de nuit héritée de la veille.
    return debordeSurLeLendemain && h.index.includes(veille) && minute < ferme;
  });
}

/**
 * Section « Infos » — adresse, horaires, contact.
 *
 * `children` reçoit le feed Instagram : c'est un composant serveur, il est
 * donc passé depuis `page.tsx` plutôt qu'importé ici (ce fichier est client,
 * il embarquerait le jeton d'API dans le bundle).
 */
export default function Infos({ children }: { children?: React.ReactNode }) {
  /**
   * Calculés après montage seulement : la page est prérendue statiquement,
   * l'heure du visiteur n'existe pas côté serveur (sinon désynchronisation
   * d'hydratation, et un jour figé à la date du build).
   */
  const [ouvert, setOuvert] = useState<boolean | null>(null);
  const [aujourdhui, setAujourdhui] = useState(-1);

  useEffect(() => {
    const rafraichir = () => {
      const maintenant = new Date();
      setAujourdhui(maintenant.getDay());
      if (HORAIRES_RENSEIGNES) setOuvert(estOuvert(HORAIRES, maintenant));
    };
    rafraichir();
    const timer = setInterval(rafraichir, 60_000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section
      id="infos"
      className="relative overflow-hidden border-t border-bb-gray-900/60 px-6 py-24 sm:py-32 lg:px-10 lg:py-40"
    >
      {/* Décor : cage gravée (« le nid ») + halo, zone de hauteur stable ancrée
          en haut — harmonie avec la carte, illustration différente. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[34rem] overflow-hidden"
      >
        <div
          className="absolute left-1/2 top-1/2 h-[60vmin] w-[60vmin] -translate-x-1/2 -translate-y-1/2"
          style={{ background: "radial-gradient(circle, rgba(135,0,16,0.2) 0%, transparent 62%)" }}
        />
        <Image
          src="/brand/illustrations/cage-red.png"
          alt=""
          width={993}
          height={2571}
          className="absolute left-1/2 top-1/2 h-auto w-40 max-w-[55vw] -translate-x-1/2 -translate-y-1/2 opacity-[0.1]"
        />
      </div>

      <motion.div
        variants={reveal}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-15%" }}
        className="mx-auto flex max-w-xl flex-col items-center text-center lg:max-w-2xl"
      >
        <span className="font-body text-[0.7rem] uppercase tracking-[0.4em] text-bb-red lg:text-xs">
          IV · Infos
        </span>
        <h2 className="font-display mt-5 text-4xl uppercase leading-none tracking-wide text-bb-white sm:text-6xl lg:text-7xl">
          Le nid
        </h2>
        <p className="font-body mt-5 max-w-sm text-sm leading-relaxed text-bb-gray-500 lg:max-w-md lg:text-base">
          Poussez la porte noire. Le reste se passe à l&apos;intérieur.
        </p>
      </motion.div>

      <div className="mx-auto mt-16 grid max-w-4xl gap-12 sm:grid-cols-2 sm:gap-10 lg:mt-24 lg:max-w-5xl lg:gap-20">
        {/* Adresse + contact */}
        <motion.div
          variants={reveal}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-10%" }}
          className="flex flex-col items-center text-center sm:items-start sm:text-left"
        >
          <h3 className="font-body text-[0.6rem] uppercase tracking-[0.35em] text-bb-red lg:text-[0.7rem]">
            L&apos;adresse
          </h3>
          <address className="font-display mt-4 text-2xl not-italic leading-tight text-bb-white sm:text-3xl lg:text-4xl">
            {CONTACT.adresse}
            <br />
            {CONTACT.codePostalVille}
          </address>

          <div className="mt-6 flex flex-wrap justify-center gap-3 sm:justify-start">
            {CONTACT.maps && (
              <a
                href={CONTACT.maps}
                target="_blank"
                rel="noopener noreferrer"
                className="font-body inline-flex items-center gap-2 rounded-full border border-bb-gray-900 px-6 py-3 text-[0.62rem] uppercase tracking-[0.25em] text-bb-white/80 transition-colors duration-300 hover:border-bb-red hover:text-bb-white"
              >
                Itinéraire
                <span aria-hidden>↗</span>
              </a>
            )}
            {CONTACT.avis && (
              <a
                href={CONTACT.avis}
                target="_blank"
                rel="noopener noreferrer"
                className="font-body inline-flex items-center gap-2 rounded-full border border-bb-red/60 px-6 py-3 text-[0.62rem] uppercase tracking-[0.25em] text-bb-red transition-colors duration-300 hover:border-bb-red hover:bg-bb-red hover:text-bb-white"
              >
                Laisser un avis
                <span aria-hidden>↗</span>
              </a>
            )}
          </div>

          {/* Le numéro n'apparaît que s'il est renseigné — plus de mention
              « à compléter » à l'écran. Instagram n'est plus repris ici : il a
              déjà son bloc dédié, le menu et le pied de page. */}
          {CONTACT.telephone && (
            <a
              href={`tel:${CONTACT.telephone}`}
              className="font-body mt-8 text-sm text-bb-white/70 transition-colors hover:text-bb-red"
            >
              {CONTACT.telephoneAffiche}
            </a>
          )}
        </motion.div>

        {/* Horaires */}
        <motion.div
          variants={reveal}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-10%" }}
          className="flex flex-col items-center text-center sm:items-start sm:text-left"
        >
          <div className="flex items-center gap-3">
            <h3 className="font-body text-[0.6rem] uppercase tracking-[0.35em] text-bb-red lg:text-[0.7rem]">
              Les horaires
            </h3>
            {ouvert !== null && (
              <span className="font-body inline-flex items-center gap-1.5 text-[0.6rem] uppercase tracking-[0.2em] text-bb-white/70">
                <span
                  aria-hidden
                  className={`h-1.5 w-1.5 rounded-full ${
                    ouvert ? "animate-pulse bg-bb-red" : "bg-bb-gray-500"
                  }`}
                />
                {ouvert ? "Ouvert" : "Fermé"}
              </span>
            )}
          </div>

          <ul className="mt-5 w-full max-w-xs sm:max-w-none">
            {HORAIRES.map((h) => {
              const cJour = h.index.includes(aujourdhui);
              return (
                <li
                  key={h.jours}
                  className={`flex items-baseline justify-between gap-6 border-b border-bb-gray-900/60 py-3 ${
                    cJour ? "text-bb-white" : "text-bb-white/60"
                  }`}
                >
                  <span className="font-body text-sm tracking-wide lg:text-base">{h.jours}</span>
                  <span
                    className={`font-body text-sm tracking-wide ${
                      h.ouvre ? "text-bb-red" : "text-bb-gray-500"
                    }`}
                  >
                    {h.ouvre && h.ferme ? `${h.ouvre} — ${h.ferme}` : "Fermé"}
                  </span>
                </li>
              );
            })}
          </ul>

          {!HORAIRES_RENSEIGNES && (
            <p className="font-body mt-4 text-[0.6rem] uppercase tracking-[0.25em] text-bb-gray-500">
              Horaires à compléter
            </p>
          )}
        </motion.div>
      </div>

      {children && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-8%" }}
          transition={{ duration: 1, ease: EASE_BB }}
        >
          {children}
        </motion.div>
      )}
    </section>
  );
}
