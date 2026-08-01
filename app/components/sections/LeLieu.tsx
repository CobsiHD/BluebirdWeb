"use client";

import Image from "next/image";
import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import Typewriter from "../Typewriter";

const EASE_BB = [0.16, 1, 0.3, 1] as const;

const reveal = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 1, ease: EASE_BB } },
};

/** Section « Le lieu » — le paradoxe Bukowski, cœur anatomique + cage en parallaxe. */
export default function LeLieu() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const heartY = useTransform(scrollYProgress, [0, 1], [70, -70]);
  const cageY = useTransform(scrollYProgress, [0, 1], [90, -60]);

  return (
    <section
      ref={ref}
      id="le-lieu"
      className="relative overflow-hidden border-t border-bb-gray-900/60 px-6 py-24 sm:py-32"
    >
      {/* Intro */}
      <motion.div
        variants={reveal}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-15%" }}
        className="mx-auto flex max-w-xl flex-col items-center text-center"
      >
        <span className="font-body text-[0.7rem] uppercase tracking-[0.4em] text-bb-red">
          I · Le lieu
        </span>
        <h2 className="font-display mt-5 text-4xl uppercase leading-none tracking-wide text-bb-white sm:text-6xl">
          Le paradoxe
        </h2>
      </motion.div>

      {/* Cœur + texte */}
      <div className="mx-auto mt-14 flex max-w-2xl flex-col items-center gap-10">
        <motion.div
          style={reduce ? undefined : { y: heartY }}
          initial={{ opacity: 0, scale: 0.92 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 1.2, ease: EASE_BB }}
          className="relative"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-64 w-64 -translate-x-1/2 -translate-y-1/2"
            style={{
              background:
                "radial-gradient(circle, rgba(135,0,16,0.35) 0%, transparent 68%)",
            }}
          />
          <Image
            src="/brand/illustrations/coeur-red.png"
            alt="Un oiseau posé sur un cœur, gravure"
            width={1140}
            height={1445}
            className="h-auto w-52 sm:w-64"
          />
        </motion.div>

        <motion.p
          variants={reveal}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-12%" }}
          className="font-body max-w-md text-center text-sm leading-relaxed text-bb-white/75 sm:text-base"
        >
          Le Bluebird est né d'un poème de Charles Bukowski. Derrière l'ombre et
          l'élégance, une douceur que l'on dissimule&nbsp;: la vulnérabilité,
          l'émotion brute. Un bar à cocktails où le raffinement se fait intime,
          et où chaque verre libère un peu de cet oiseau que l'on garde enfermé.
        </motion.p>
      </div>

      {/* Vers du poème + cage */}
      <div className="relative mx-auto mt-24 flex max-w-2xl flex-col items-center gap-12 sm:mt-32">
        <blockquote className="font-display text-balance text-center text-2xl italic leading-snug text-bb-white sm:text-4xl">
          <Typewriter
            text={"« Il y a dans mon cœur un oiseau bleu\nqui voudrait sortir. »"}
            speed={40}
          />
          <motion.footer
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-15%" }}
            transition={{ delay: 2.3, duration: 1, ease: EASE_BB }}
            className="font-body mt-6 block text-[0.7rem] not-italic uppercase tracking-[0.4em] text-bb-red"
          >
            Charles Bukowski
          </motion.footer>
        </blockquote>

        <motion.div
          style={reduce ? undefined : { y: cageY }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 1.4, ease: EASE_BB }}
        >
          <Image
            src="/brand/illustrations/cage-red.png"
            alt="Cage en forme de verre à cocktail, gravure"
            width={993}
            height={2571}
            className="h-auto w-32 opacity-90 sm:w-40"
          />
        </motion.div>
      </div>
    </section>
  );
}
