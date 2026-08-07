"use client";

import Image, { type StaticImageData } from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

const EASE_BB = [0.16, 1, 0.3, 1] as const;

export type LayoutGridCard = {
  /** Identifiant stable — sert de clé aux animations partagées (layoutId). */
  id: string;
  /** Import statique : donne largeur/hauteur + blurDataURL automatiques. */
  src: StaticImageData;
  alt: string;
  title: string;
  caption?: string;
  /** Classes de hauteur de la tuile (responsives). */
  height: string;
  /** Classe `object-position` pour caler le recadrage sur le sujet. */
  position?: string;
};

type Props = {
  cards: LayoutGridCard[];
  className?: string;
};

/** Les colonnes sont de largeur égale : une seule règle de `sizes` suffit. */
const SIZES = "(min-width: 1024px) 25vw, 50vw";

/**
 * Mur de photos « tap-to-expand ».
 *
 * Mobile-first : les tuiles coulent dans 2 colonnes CSS (4 à partir de lg) et
 * chacune porte sa propre hauteur, donc les lignes ne se répondent jamais.
 * Quelques colonnes reçoivent en plus un décalage vertical pour désaligner
 * franchement le mur.
 * Au clic, la tuile s'agrandit en plein écran via une animation partagée
 * (framer-motion `layoutId`) : la même boîte se déplace du mur vers la
 * visionneuse, sans fondu ni saut. Navigation clavier (← → Échap), swipe
 * horizontal au doigt, et respect de `prefers-reduced-motion`.
 */
export function LayoutGrid({ cards, className }: Props) {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState<number | null>(null);
  /**
   * Index de la vignette cliquée. Conservé jusqu'à la fermeture : c'est la
   * seule vignette démontée pendant l'ouverture, et la seule à partager son
   * `layoutId` avec la visionneuse (donc la seule à animer l'aller-retour
   * grille ↔ plein écran). Les photos atteintes ensuite par navigation
   * apparaissent en fondu, sans animation de position.
   */
  const [origin, setOrigin] = useState<number | null>(null);
  const triggers = useRef<Array<HTMLButtonElement | null>>([]);
  const closeButton = useRef<HTMLButtonElement>(null);
  const touchStartX = useRef<number | null>(null);

  const isOpen = index !== null;
  const selected = index === null ? null : cards[index];

  const close = useCallback(() => {
    if (index !== null) triggers.current[index]?.focus();
    setIndex(null);
    setOrigin(null);
  }, [index]);

  const step = useCallback(
    (delta: number) => {
      // `origin` n'est pas réinitialisé : sa vignette doit rester démontée
      // tant que la visionneuse est ouverte, sinon la photo qu'on quitte
      // repart en vol vers la grille et se superpose à la suivante.
      setIndex((current) =>
        current === null ? current : (current + delta + cards.length) % cards.length,
      );
    },
    [cards.length],
  );

  /* Verrou de scroll pendant toute la durée d'ouverture. */
  useEffect(() => {
    if (!isOpen) return;
    const { body } = document;
    const previousOverflow = body.style.overflow;
    body.style.overflow = "hidden";
    closeButton.current?.focus();
    return () => {
      body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  /* Raccourcis clavier : Échap ferme, flèches naviguent. */
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      else if (event.key === "ArrowRight") step(1);
      else if (event.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, close, step]);

  const shared = reduce
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 230, damping: 32, mass: 0.9 };

  return (
    <>
      <div className="relative mx-auto w-full max-w-6xl">
        {/* Halo rouge diffus : lie les tuiles entre elles et au fond noir. */}
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-x-6 -inset-y-10 -z-10 opacity-70"
          style={{
            background:
              "radial-gradient(60% 45% at 50% 40%, rgba(135,0,16,0.22) 0%, transparent 70%)",
          }}
        />

        <div
          className={[
            // Masonry CSS : les tuiles coulent en colonnes, `space-y` fait
            // l'écart vertical, `break-inside-avoid` empêche les coupures.
            "columns-2 gap-3 space-y-3 sm:gap-4 sm:space-y-4 lg:columns-4 lg:gap-5 lg:space-y-5",
            // Décalages : cassent l'alignement des têtes de colonnes.
            "[&>*:nth-child(4)]:pt-6 [&>*:nth-child(9)]:pt-10",
            "lg:[&>*:nth-child(2)]:pt-8 lg:[&>*:nth-child(4)]:pt-14",
            "lg:[&>*:nth-child(7)]:pt-4 lg:[&>*:nth-child(10)]:pt-12",
            className ?? "",
          ].join(" ")}
        >
          {cards.map((card, i) => (
            <motion.div
              key={card.id}
              initial={reduce ? false : { opacity: 0, y: 24, filter: "blur(8px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: true, margin: "-8%" }}
              transition={{ duration: 0.9, ease: EASE_BB, delay: (i % 4) * 0.07 }}
              className="break-inside-avoid"
            >
              <button
                ref={(node) => {
                  triggers.current[i] = node;
                }}
                type="button"
                onClick={() => {
                  setOrigin(i);
                  setIndex(i);
                }}
                aria-label={`Agrandir : ${card.title}`}
                className={`group relative block w-full cursor-pointer overflow-hidden rounded-[1.5rem] bg-bb-gray-900/50 ring-1 ring-bb-white/[0.07] outline-none transition-shadow duration-500 hover:ring-bb-red/40 focus-visible:ring-2 focus-visible:ring-bb-red ${card.height}`}
              >
                {/* La vignette d'origine reste démontée pendant toute la durée
                    d'ouverture : c'est elle, et elle seule, qui partage son
                    `layoutId` avec la visionneuse. Deux éléments portant le
                    même `layoutId` en même temps produiraient un fondu entre
                    deux photos. */}
                {origin !== i && (
                  <motion.div
                    layoutId={`gallery-${card.id}`}
                    transition={shared}
                    className="absolute inset-0"
                  >
                    <Image
                      src={card.src}
                      alt={card.alt}
                      fill
                      placeholder="blur"
                      sizes={SIZES}
                      className={`object-cover ${card.position ?? "object-center"} brightness-[0.82] saturate-[0.95] transition-transform duration-700 ease-out group-hover:scale-110`}
                    />
                    {/* Voile discret : unifie des expositions très différentes. */}
                    <span
                      aria-hidden
                      className="absolute inset-0 bg-gradient-to-t from-bb-black/50 via-transparent to-bb-black/15 transition-opacity duration-500 group-hover:opacity-30"
                    />
                  </motion.div>
                )}
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {selected && index !== null && (
          <motion.div
            key="lightbox"
            role="dialog"
            aria-modal="true"
            aria-label={`Galerie Bluebird — ${selected.title}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.35, ease: "easeInOut" }}
            onClick={close}
            onTouchStart={(event) => {
              touchStartX.current = event.touches[0].clientX;
            }}
            onTouchEnd={(event) => {
              const start = touchStartX.current;
              touchStartX.current = null;
              if (start === null) return;
              const delta = event.changedTouches[0].clientX - start;
              if (Math.abs(delta) > 60) step(delta < 0 ? 1 : -1);
            }}
            className="fixed inset-0 z-[70] flex flex-col items-center justify-center gap-6 bg-bb-black/95 px-4 py-14 backdrop-blur-sm sm:px-8"
          >
            <button
              ref={closeButton}
              type="button"
              onClick={close}
              aria-label="Fermer la galerie"
              className="absolute right-5 top-5 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-bb-gray-900 text-bb-white/70 transition-colors hover:border-bb-red hover:text-bb-white focus-visible:ring-2 focus-visible:ring-bb-red focus-visible:outline-none sm:right-8 sm:top-8"
            >
              <span aria-hidden className="text-lg leading-none">
                ✕
              </span>
            </button>

            <span className="font-body absolute left-5 top-8 text-[0.6rem] uppercase tracking-[0.35em] text-bb-red sm:left-8 sm:top-10">
              {String(index + 1).padStart(2, "0")}
              <span className="text-bb-gray-500"> / {String(cards.length).padStart(2, "0")}</span>
            </span>

            {/* La photo : boîte au ratio natif, donc jamais recadrée une fois ouverte. */}
            <motion.div
              key={`photo-${selected.id}`}
              layoutId={index === origin ? `gallery-${selected.id}` : undefined}
              transition={shared}
              initial={index === origin || reduce ? false : { opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={(event) => event.stopPropagation()}
              style={{
                aspectRatio: `${selected.src.width} / ${selected.src.height}`,
                width: `min(92vw, 54rem, ${(
                  (selected.src.width / selected.src.height) *
                  62
                ).toFixed(1)}vh)`,
              }}
              className="relative overflow-hidden rounded-lg"
            >
              <Image
                src={selected.src}
                alt={selected.alt}
                fill
                placeholder="blur"
                sizes="(min-width: 768px) 60vw, 92vw"
                className="object-cover"
              />
            </motion.div>

            <motion.div
              key={`caption-${selected.id}`}
              initial={{ opacity: 0, y: reduce ? 0 : 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduce ? 0 : 0.5, ease: EASE_BB, delay: reduce ? 0 : 0.12 }}
              onClick={(event) => event.stopPropagation()}
              className="max-w-md text-center"
            >
              <h3 className="font-display text-2xl uppercase leading-none tracking-wide text-bb-white sm:text-3xl">
                {selected.title}
              </h3>
              {selected.caption && (
                <p className="font-body mt-3 text-xs leading-relaxed text-bb-gray-500 sm:text-sm">
                  {selected.caption}
                </p>
              )}
            </motion.div>

            <div
              onClick={(event) => event.stopPropagation()}
              className="flex items-center gap-10"
            >
              <button
                type="button"
                onClick={() => step(-1)}
                aria-label="Photo précédente"
                className="font-body text-[0.6rem] uppercase tracking-[0.3em] text-bb-white/60 transition-colors hover:text-bb-red focus-visible:text-bb-red focus-visible:outline-none"
              >
                ← Préc.
              </button>
              <button
                type="button"
                onClick={() => step(1)}
                aria-label="Photo suivante"
                className="font-body text-[0.6rem] uppercase tracking-[0.3em] text-bb-white/60 transition-colors hover:text-bb-red focus-visible:text-bb-red focus-visible:outline-none"
              >
                Suiv. →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default LayoutGrid;
