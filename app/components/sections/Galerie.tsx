"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { LayoutGrid } from "../ui/layout-grid";
import { GALLERY } from "./galerie-data";

const EASE_BB = [0.16, 1, 0.3, 1] as const;

const reveal = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 1, ease: EASE_BB } },
};

/** Section « Galerie » — mosaïque d'ambiance, agrandissement au clic. */
export default function Galerie() {
  return (
    <section
      id="galerie"
      className="relative overflow-hidden border-t border-bb-gray-900/60 px-4 py-24 sm:px-6 sm:py-32"
    >
      {/* Décor : cœur gravé + halo, dans une zone de hauteur stable ancrée en
          haut (harmonie avec la carte, illustration différente). */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[26rem] overflow-hidden"
      >
        <div
          className="absolute left-1/2 top-1/2 h-[62vmin] w-[62vmin] -translate-x-1/2 -translate-y-1/2"
          style={{ background: "radial-gradient(circle, rgba(135,0,16,0.22) 0%, transparent 62%)" }}
        />
        <Image
          src="/brand/illustrations/coeur-red.png"
          alt=""
          width={1140}
          height={1445}
          className="absolute left-1/2 top-1/2 w-56 max-w-[70vw] -translate-x-1/2 -translate-y-1/2 opacity-[0.1]"
        />
      </div>

      <motion.div
        variants={reveal}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-15%" }}
        className="mx-auto flex max-w-xl flex-col items-center text-center"
      >
        <span className="font-body text-[0.7rem] uppercase tracking-[0.4em] text-bb-red">
          III · La galerie
        </span>
        <h2 className="font-display mt-5 text-4xl uppercase leading-none tracking-wide text-bb-white sm:text-6xl">
          L&apos;atmosphère
        </h2>
        <p className="font-body mt-5 max-w-sm text-sm leading-relaxed text-bb-gray-500">
          La pierre, le velours, le cristal et le néon rouge. Un aperçu des
          soirées au Bluebird.
        </p>
      </motion.div>

      {/* Chaque tuile gère sa propre apparition : pas d'enveloppe animée ici,
          sinon le mur entier se révélerait d'un bloc. */}
      <div className="mt-12 sm:mt-16">
        <LayoutGrid cards={GALLERY} />
      </div>
    </section>
  );
}
