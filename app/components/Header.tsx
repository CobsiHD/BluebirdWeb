"use client";

import Image from "next/image";
import { useState } from "react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { CONTACT, HORAIRES_RESUME } from "./sections/infos-data";

const LINKS = [
  { href: "#le-lieu", label: "Le lieu" },
  { href: "#carte", label: "La carte" },
  { href: "#galerie", label: "Galerie" },
  { href: "#infos", label: "Infos" },
];

/** Liens sortants du menu — adresses centralisées dans infos-data.ts. */
const LIENS_EXTERNES = [
  { href: CONTACT.instagram.url, label: "Suivre sur Instagram" },
  { href: CONTACT.avis, label: "Laisser un avis" },
].filter((l) => l.href);

/**
 * Bandeau d'infos pratiques du menu : nom, adresse, horaires, téléphone.
 * Entièrement dérivé de `infos-data.ts` — il ne peut donc pas contredire la
 * section Infos, et un champ vide (le téléphone aujourd'hui) disparaît au
 * lieu d'afficher un trou.
 */
type InfoBandeau = { texte: string; href?: string; externe?: boolean };

const ENTREES: (InfoBandeau | null)[] = [
  { texte: "Bluebird" },
  { texte: `${CONTACT.adresse}, ${CONTACT.codePostalVille}` },
  { texte: HORAIRES_RESUME.ouverture },
  CONTACT.telephone
    ? { texte: CONTACT.telephoneAffiche, href: `tel:${CONTACT.telephone}` }
    : null,
  CONTACT.instagram.url
    ? { texte: CONTACT.instagram.pseudo, href: CONTACT.instagram.url, externe: true }
    : null,
];

const BANDEAU = ENTREES.filter((info): info is InfoBandeau => info !== null);

const EASE_BB = [0.16, 1, 0.3, 1] as const;

const overlay: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { duration: 0.5, ease: EASE_BB, staggerChildren: 0.08, delayChildren: 0.15 },
  },
  exit: { opacity: 0, transition: { duration: 0.35, ease: "easeInOut" } },
};

const linkItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE_BB } },
};

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 flex items-center justify-between px-6 py-5 sm:px-8">
        <a href="#accueil" aria-label="Bluebird — accueil" onClick={() => setOpen(false)}>
          <Image
            src="/brand/logos/bb-simple-white.png"
            alt="Bluebird"
            width={375}
            height={542}
            priority
            className="h-9 w-auto"
          />
        </a>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={open}
          className="relative z-50 flex h-8 w-9 flex-col items-end justify-center gap-[7px]"
        >
          <motion.span
            className="block h-px w-8 bg-bb-white"
            animate={open ? { rotate: 45, y: 4 } : { rotate: 0, y: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          />
          <motion.span
            className="block h-px w-6 bg-bb-white"
            animate={open ? { rotate: -45, y: -4, width: "2rem" } : { rotate: 0, y: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          />
        </button>
      </header>

      <AnimatePresence>
        {open && (
          <motion.nav
            variants={overlay}
            initial="hidden"
            animate="show"
            exit="exit"
            // `pt-32` réserve la place du bandeau haut : sur un écran court,
            // les premiers liens ne doivent pas passer dessous.
            className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-8 bg-bb-black/97 px-6 pb-10 pt-32 backdrop-blur-sm"
          >
            {LINKS.map((l) => (
              <motion.a
                key={l.href}
                href={l.href}
                variants={linkItem}
                onClick={() => setOpen(false)}
                className="font-display text-4xl uppercase tracking-wide text-bb-white/90 transition-colors hover:text-bb-red sm:text-5xl"
              >
                {l.label}
              </motion.a>
            ))}

            {/* Liens sortants, en rouge : ils quittent le site, ce ne sont pas
                des ancres de navigation. */}
            <motion.div
              variants={linkItem}
              className="mt-4 flex flex-col items-center gap-5 border-t border-bb-gray-900/80 pt-8"
            >
              {LIENS_EXTERNES.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setOpen(false)}
                  className="font-body inline-flex items-center gap-2 text-[0.7rem] uppercase tracking-[0.3em] text-bb-red transition-opacity duration-300 hover:opacity-70"
                >
                  {l.label}
                  <span aria-hidden>↗</span>
                </a>
              ))}
            </motion.div>

            {/* Bandeau d'infos pratiques, en tête de menu : où, quand, comment
                joindre — sans avoir à scroller la page jusqu'à la section
                Infos. Décalé sous la barre du logo et du bouton, qui reste
                au-dessus (z-50). */}
            <motion.p
              variants={linkItem}
              className="font-body absolute inset-x-0 top-[4.5rem] border-b border-bb-gray-900/80 px-6 pb-4 text-center text-[0.55rem] uppercase leading-relaxed tracking-[0.22em] text-bb-white/60 sm:text-[0.62rem]"
            >
              {BANDEAU.map((info, i) => (
                <span key={info.texte}>
                  {i > 0 && (
                    <span aria-hidden className="mx-2 text-bb-red">
                      ·
                    </span>
                  )}
                  {info.href ? (
                    <a
                      href={info.href}
                      target={info.externe ? "_blank" : undefined}
                      rel={info.externe ? "noopener noreferrer" : undefined}
                      onClick={() => setOpen(false)}
                      className="text-bb-white/80 underline-offset-4 transition-colors hover:text-bb-red hover:underline"
                    >
                      {info.texte}
                    </a>
                  ) : (
                    info.texte
                  )}
                </span>
              ))}
            </motion.p>
          </motion.nav>
        )}
      </AnimatePresence>
    </>
  );
}
