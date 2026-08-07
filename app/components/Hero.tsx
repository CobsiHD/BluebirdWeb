"use client";

import Image from "next/image";
import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type Variants,
} from "framer-motion";

const EASE_BB = [0.16, 1, 0.3, 1] as const;

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.16, delayChildren: 0.6 } },
};
const item: Variants = {
  hidden: { opacity: 0, x: -24 },
  show: { opacity: 1, x: 0, transition: { duration: 1.1, ease: EASE_BB } },
};

/** Hero — Rouge Velours : photo cocktail rouge, mise en page éditoriale (aligné à gauche). */
export default function Hero() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const contentY = useTransform(scrollYProgress, [0, 1], [0, -90]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.85], [1, 0]);

  return (
    <section
      ref={ref}
      id="accueil"
      className="relative flex min-h-dvh flex-col justify-end overflow-hidden"
    >
      <motion.div
        className="absolute inset-0 -z-20"
        initial={{ scale: 1.12, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 2.2, ease: "easeOut" }}
      >
        <motion.div
          className="relative h-full w-full"
          animate={reduce ? undefined : { scale: [1, 1.06] }}
          transition={{ duration: 16, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
        >
          <Image
            src="/brand/photos/cocktail-red.jpg"
            alt="Cocktail signature du Bluebird sur guéridon doré"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
        </motion.div>
      </motion.div>

      {/* Dégradé bas → texte lisible, laisse respirer le rouge en haut */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,0.90) 0%, rgba(0,0,0,0.55) 22%, transparent 52%)",
        }}
      />

      {/* Contenu éditorial, bas-gauche */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        style={reduce ? undefined : { y: contentY, opacity: contentOpacity }}
        className="relative mx-auto flex w-full max-w-7xl flex-col items-start px-7 pb-16 text-left sm:px-10 sm:pb-20 lg:px-14 lg:pb-28"
      >
        <motion.span
          variants={item}
          className="font-body mb-5 text-[0.6rem] uppercase tracking-[0.45em] text-bb-red lg:mb-7 lg:text-xs"
        >
          Cocktails Bar
        </motion.span>
        <motion.div variants={item}>
          <Image
            src="/brand/logos/bluebird-white.png"
            alt="Bluebird"
            width={809}
            height={148}
            priority
            className="w-60 sm:w-72 lg:w-[26rem]"
          />
        </motion.div>
        <motion.p
          variants={item}
          className="font-display mt-6 max-w-xs text-balance text-xl italic leading-snug text-bb-white/85 sm:text-2xl lg:mt-8 lg:max-w-lg lg:text-3xl"
        >
          L'élégance du paradoxe, un verre à la fois.
        </motion.p>

        <motion.a
          variants={item}
          href="#le-lieu"
          className="group mt-9 flex items-center gap-4"
          aria-label="Découvrir"
        >
          <span className="relative h-px w-12 overflow-hidden bg-bb-white/25">
            <motion.span
              className="absolute inset-y-0 left-0 w-1/2 bg-bb-red"
              animate={reduce ? undefined : { x: ["-100%", "220%"] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            />
          </span>
          <span className="font-body text-[0.6rem] uppercase tracking-[0.4em] text-bb-white/70 transition-colors group-hover:text-bb-white">
            Découvrir
          </span>
        </motion.a>
      </motion.div>
    </section>
  );
}
