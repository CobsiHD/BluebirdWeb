"use client";

import Image from "next/image";
import { useState } from "react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import {
  CORPS,
  ENVIES,
  rankCocktails,
  type CorpsId,
  type EnvieId,
} from "./carte-data";
import CarteComplete from "./CarteComplete";

const EASE_BB = [0.16, 1, 0.3, 1] as const;

const stepV: Variants = {
  initial: { opacity: 0, y: 22 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: EASE_BB, staggerChildren: 0.07 },
  },
  exit: { opacity: 0, y: -16, transition: { duration: 0.28, ease: "easeIn" } },
};
const optV: Variants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE_BB } },
};
const viewV: Variants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_BB } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.25, ease: "easeIn" } },
};

type Alcool = "avec" | "sans";
type View = "parcours" | "complete";

const VIEWS: { id: View; label: string }[] = [
  { id: "parcours", label: "Mon cocktail" },
  { id: "complete", label: "Carte complète" },
];

/** Section « La carte » — 2 onglets : parcours guidé + carte complète. */
export default function Carte() {
  const [view, setView] = useState<View>("parcours");

  const [alcool, setAlcool] = useState<Alcool | null>(null);
  const [envie, setEnvie] = useState<EnvieId | null>(null);
  const [corps, setCorps] = useState<CorpsId | null>(null);
  const [idx, setIdx] = useState(0);
  const [tries, setTries] = useState(0);
  const [showIng, setShowIng] = useState(false);

  const step =
    alcool == null
      ? "alcool"
      : envie == null
        ? "envie"
        : corps == null
          ? "corps"
          : "result";

  const ranked =
    alcool && envie && corps
      ? rankCocktails(envie, corps, alcool === "sans")
      : [];
  const result = ranked[idx];

  const reset = () => {
    setAlcool(null);
    setEnvie(null);
    setCorps(null);
    setIdx(0);
    setTries(0);
    setShowIng(false);
  };
  const another = () => {
    setIdx((i) => (i + 1) % ranked.length);
    setTries((t) => t + 1);
    setShowIng(false);
  };

  return (
    <section
      id="carte"
      className="relative overflow-hidden border-t border-bb-gray-900/60 px-6 py-24 sm:py-32"
    >
      {/* Décor : macaron encadré + halo, dans une zone de hauteur FIXE ancrée
          en haut — ainsi le fond ne se décale pas quand la carte complète s'ouvre. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[52rem] overflow-hidden"
      >
        <div
          className="absolute left-1/2 top-1/2 h-[82vmin] w-[82vmin] -translate-x-1/2 -translate-y-1/2"
          style={{ background: "radial-gradient(circle, rgba(135,0,16,0.24) 0%, transparent 62%)" }}
        />
        <Image
          src="/brand/logos/macaron-oiseau-red.png"
          alt=""
          width={756}
          height={948}
          className="absolute left-1/2 top-1/2 w-[90vw] max-w-md -translate-x-1/2 -translate-y-1/2 opacity-[0.13]"
        />
      </div>

      <div className="mx-auto flex max-w-xl flex-col items-center text-center">
        <span className="font-body text-[0.7rem] uppercase tracking-[0.4em] text-bb-red">
          II · La carte
        </span>
        <h2 className="font-display mt-5 text-4xl uppercase leading-none tracking-wide text-bb-white sm:text-6xl">
          La carte
        </h2>
      </div>

      {/* Onglets */}
      <div className="mx-auto mt-9 flex w-full max-w-sm gap-1 rounded-full border border-bb-gray-900/70 p-1">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => setView(v.id)}
            aria-pressed={view === v.id}
            className={`relative flex-1 whitespace-nowrap rounded-full px-3 py-2 text-center font-body text-[0.6rem] uppercase tracking-[0.12em] transition-colors duration-300 sm:px-5 sm:tracking-[0.2em] ${
              view === v.id ? "text-bb-white" : "text-bb-white/55 hover:text-bb-white"
            }`}
          >
            {view === v.id && (
              <motion.span
                layoutId="carte-view"
                className="absolute inset-0 rounded-full bg-bb-red"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
              />
            )}
            <span className="relative">{v.label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ───────── Onglet 1 — Parcours guidé ───────── */}
        {view === "parcours" && (
          <motion.div key="parcours" variants={viewV} initial="initial" animate="animate" exit="exit">
            <p className="font-body mx-auto mt-10 max-w-sm text-center text-sm leading-relaxed text-bb-gray-500">
              Suivez vos envies — on vous désigne le cocktail qui vous ressemble.
            </p>

            <div className="relative mx-auto mt-10 min-h-[27rem] max-w-md">
              <AnimatePresence mode="wait">
                {/* Étape 1 — Avec ou sans alcool */}
                {step === "alcool" && (
                  <motion.div key="alcool" variants={stepV} initial="initial" animate="animate" exit="exit">
                    <StepHead index={1} prompt="Avec ou sans alcool ?" />
                    <div className="mt-8 grid gap-3">
                      {[
                        { id: "avec" as Alcool, label: "Avec alcool", hint: "cocktails & créations" },
                        { id: "sans" as Alcool, label: "Sans alcool", hint: "nos alternatives 0%" },
                      ].map((o) => (
                        <motion.button
                          key={o.id}
                          variants={optV}
                          type="button"
                          onClick={() => setAlcool(o.id)}
                          className="group flex items-baseline justify-between rounded-xl border border-bb-gray-900/70 px-6 py-5 text-left transition-colors duration-300 hover:border-bb-red hover:bg-bb-red/[0.06]"
                        >
                          <span className="font-display text-2xl leading-none text-bb-white">
                            {o.label}
                          </span>
                          <span className="font-body text-[0.65rem] text-bb-gray-500">
                            {o.hint}
                          </span>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Étape 2 — Envie */}
                {step === "envie" && (
                  <motion.div key="envie" variants={stepV} initial="initial" animate="animate" exit="exit">
                    <StepHead index={2} prompt="Ce soir, une envie…" />
                    <div className="mt-8 grid grid-cols-2 gap-3">
                      {ENVIES.map((e) => (
                        <motion.button
                          key={e.id}
                          variants={optV}
                          type="button"
                          onClick={() => setEnvie(e.id)}
                          className="group flex flex-col items-start rounded-xl border border-bb-gray-900/70 p-5 text-left transition-colors duration-300 hover:border-bb-red hover:bg-bb-red/[0.06]"
                        >
                          <span className="font-display text-2xl leading-none text-bb-white">
                            {e.label}
                          </span>
                          <span className="font-body mt-2 text-[0.65rem] leading-snug text-bb-gray-500">
                            {e.hint}
                          </span>
                        </motion.button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => setAlcool(null)}
                      className="font-body mt-7 text-[0.6rem] uppercase tracking-[0.3em] text-bb-gray-500 transition-colors hover:text-bb-white"
                    >
                      ← Retour
                    </button>
                  </motion.div>
                )}

                {/* Étape 3 — Corps */}
                {step === "corps" && (
                  <motion.div key="corps" variants={stepV} initial="initial" animate="animate" exit="exit">
                    <StepHead index={3} prompt="Et plutôt…" />
                    <div className="mt-8 grid gap-3">
                      {CORPS.map((c) => (
                        <motion.button
                          key={c.id}
                          variants={optV}
                          type="button"
                          onClick={() => setCorps(c.id)}
                          className="group flex items-baseline justify-between rounded-xl border border-bb-gray-900/70 px-6 py-5 text-left transition-colors duration-300 hover:border-bb-red hover:bg-bb-red/[0.06]"
                        >
                          <span className="font-display text-2xl leading-none text-bb-white">
                            {c.label}
                          </span>
                          <span className="font-body text-[0.65rem] text-bb-gray-500">
                            {c.hint}
                          </span>
                        </motion.button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => setEnvie(null)}
                      className="font-body mt-7 text-[0.6rem] uppercase tracking-[0.3em] text-bb-gray-500 transition-colors hover:text-bb-white"
                    >
                      ← Retour
                    </button>
                  </motion.div>
                )}

                {/* Résultat — portrait du cocktail */}
                {step === "result" && result && (
                  <motion.div
                    key={`result-${result.name}`}
                    variants={stepV}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="flex flex-col items-center text-center"
                  >
                    <span className="font-body text-[0.6rem] uppercase tracking-[0.45em] text-bb-red">
                      Votre oiseau
                    </span>

                    <motion.div
                      className="relative mt-6"
                      initial={{ opacity: 0, scale: 0.85, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ duration: 0.9, ease: EASE_BB }}
                    >
                      <span
                        aria-hidden
                        className="absolute left-1/2 top-1/2 -z-10 h-40 w-40 -translate-x-1/2 -translate-y-1/2 blur-xl"
                        style={{ background: "radial-gradient(circle, rgba(135,0,16,0.55) 0%, transparent 70%)" }}
                      />
                      <Image
                        src="/brand/bird/flying-red.png"
                        alt=""
                        width={400}
                        height={340}
                        className="w-28 sm:w-32"
                      />
                    </motion.div>

                    <h3 className="font-display mt-5 text-3xl leading-tight text-bb-white sm:text-4xl">
                      {result.name}
                    </h3>
                    <p className="font-display mt-3 max-w-sm text-balance text-base italic leading-snug text-bb-white/80">
                      {result.portrait}
                    </p>

                    {/* Sensations */}
                    <div className="mt-6 flex flex-wrap justify-center gap-2">
                      {result.sansAlcool && (
                        <span className="font-body rounded-full border border-bb-white/45 px-3 py-1 text-[0.6rem] uppercase tracking-[0.2em] text-bb-white/85">
                          Sans alcool
                        </span>
                      )}
                      {result.sensations.map((s) => (
                        <span
                          key={s}
                          className="font-body rounded-full border border-bb-red/40 px-3 py-1 text-[0.6rem] uppercase tracking-[0.2em] text-bb-red"
                        >
                          {s}
                        </span>
                      ))}
                    </div>

                    {/* Intensité */}
                    <div className="mt-6 flex items-center gap-3">
                      <span className="font-body text-[0.6rem] uppercase tracking-[0.3em] text-bb-gray-500">
                        Intensité
                      </span>
                      <span className="flex gap-1.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span
                            key={i}
                            className={`h-2 w-2 rounded-full ${
                              i < result.intensite ? "bg-bb-red" : "border border-bb-gray-500/60"
                            }`}
                          />
                        ))}
                      </span>
                      <span className="font-body text-sm tracking-wide text-bb-red">
                        {result.price} €
                      </span>
                    </div>

                    {/* Ingrédients révélables */}
                    {result.ingredients && (
                      <div className="mt-7 w-full">
                        <button
                          type="button"
                          onClick={() => setShowIng((v) => !v)}
                          className="font-body text-[0.6rem] uppercase tracking-[0.3em] text-bb-gray-500 transition-colors hover:text-bb-white"
                        >
                          {showIng ? "Masquer" : "Révéler la composition"}
                        </button>
                        <AnimatePresence>
                          {showIng && (
                            <motion.p
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.4, ease: EASE_BB }}
                              className="font-body overflow-hidden pt-3 text-sm leading-relaxed text-bb-white/70"
                            >
                              {result.ingredients}
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="mt-9 flex flex-col items-center gap-4">
                      {ranked.length > 1 && (
                        <button
                          type="button"
                          onClick={another}
                          className="font-body text-[0.62rem] uppercase tracking-[0.3em] text-bb-white/70 transition-colors hover:text-bb-red"
                        >
                          Une autre suggestion →
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={reset}
                        className="font-body rounded-full border border-bb-white/15 px-7 py-3 text-[0.62rem] uppercase tracking-[0.3em] text-bb-white/70 transition-colors hover:border-bb-red hover:text-bb-white"
                      >
                        Recommencer
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Sur-mesure — proposé après 2 « autre suggestion » sans coup de cœur */}
            <AnimatePresence>
              {tries >= 2 && (
                <motion.div
                  id="sur-mesure"
                  key="surmesure"
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 12 }}
                  transition={{ duration: 0.8, ease: EASE_BB }}
                  className="mx-auto mt-16 max-w-2xl sm:mt-20"
                >
                  <div className="relative overflow-hidden rounded-2xl border border-bb-red/45 bg-gradient-to-b from-bb-red-deeper/25 via-bb-black/40 to-transparent px-7 py-12 text-center sm:px-14">
                    <span
                      aria-hidden
                      className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-64 w-64 -translate-x-1/2 -translate-y-1/2 blur-2xl"
                      style={{ background: "radial-gradient(circle, rgba(135,0,16,0.35) 0%, transparent 70%)" }}
                    />
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-3 rounded-xl border border-bb-white/10"
                    />

                    <Image
                      src="/brand/bird/flying-white.png"
                      alt=""
                      width={400}
                      height={340}
                      className="mx-auto w-16 sm:w-20"
                    />
                    <span className="font-body mt-5 block text-[0.6rem] uppercase tracking-[0.45em] text-bb-red">
                      Sur-mesure
                    </span>
                    <h3 className="font-display mt-3 text-3xl uppercase leading-none tracking-wide text-bb-white sm:text-5xl">
                      Pas de coup de cœur&nbsp;?
                    </h3>
                    <p className="font-body mx-auto mt-5 max-w-md text-sm leading-relaxed text-bb-white/75 sm:text-base">
                      Confiez votre humeur et vos goûts au barman — il compose, à
                      l'instant, le cocktail qui vous ressemble. Un classique, une
                      création, une folie&nbsp;: le bar s'adapte à toutes vos envies.
                    </p>
                    <p className="font-body mt-7 text-[0.65rem] uppercase tracking-[0.35em] text-bb-gray-500">
                      Chaque soir, une création unique
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* ───────── Onglet 2 — Carte complète ───────── */}
        {view === "complete" && (
          <motion.div key="complete" variants={viewV} initial="initial" animate="animate" exit="exit" className="mt-12">
            <CarteComplete />
          </motion.div>
        )}
      </AnimatePresence>

      <p className="font-body mx-auto mt-14 max-w-sm text-center text-[0.7rem] uppercase tracking-[0.25em] text-bb-gray-900">
        Carte non contractuelle · abus d'alcool dangereux pour la santé
      </p>
    </section>
  );
}

function StepHead({ index, prompt }: { index: number; prompt: string }) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="flex items-center gap-2">
        {[1, 2, 3].map((n) => (
          <span
            key={n}
            className={`h-1.5 w-1.5 rounded-full ${n <= index ? "bg-bb-red" : "bg-bb-gray-900"}`}
          />
        ))}
      </div>
      <p className="font-display mt-5 text-2xl italic text-bb-white sm:text-3xl">
        {prompt}
      </p>
    </div>
  );
}
