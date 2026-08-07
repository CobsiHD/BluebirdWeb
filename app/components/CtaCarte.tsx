"use client";

import { motion } from "framer-motion";

const EASE_BB = [0.16, 1, 0.3, 1] as const;

/** CTA de liaison entre le Hero et la suite — mène directement à la carte. */
export default function CtaCarte() {
  return (
    <div className="flex justify-center px-6 py-12 sm:py-16 lg:py-24">
      <motion.a
        href="#carte"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-20%" }}
        transition={{ duration: 0.8, ease: EASE_BB }}
        className="group inline-flex items-center gap-3 rounded-full bg-bb-red px-8 py-4 font-body text-[0.7rem] uppercase tracking-[0.3em] text-bb-white shadow-lg shadow-bb-red/20 transition-all duration-300 hover:bg-bb-red-deep hover:shadow-bb-red/40 sm:text-xs"
      >
        Voir la carte
        <span
          aria-hidden
          className="transition-transform duration-300 group-hover:translate-x-1"
        >
          →
        </span>
      </motion.a>
    </div>
  );
}
