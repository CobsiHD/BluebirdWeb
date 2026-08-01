"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MENU, type MenuItem } from "./carte-complete-data";

const EASE_BB = [0.16, 1, 0.3, 1] as const;

function priceLabel(item: MenuItem) {
  if (item.prices?.length) {
    return item.prices.map((p) => `${p.label} ${p.price} €`).join("  ·  ");
  }
  if (!item.price) return "";
  return item.vol ? `${item.vol} · ${item.price} €` : `${item.price} €`;
}

/** Carte complète — accordéon par catégorie (onglet 2 de « La carte »). */
export default function CarteComplete() {
  const [open, setOpen] = useState<string | null>(MENU[0].id);

  return (
    <div className="mx-auto max-w-2xl">
      {MENU.map((cat) => {
        const isOpen = open === cat.id;
        return (
          <div key={cat.id} className="border-b border-bb-gray-900/60">
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : cat.id)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 py-5 text-left"
            >
              <span className="font-display text-2xl uppercase tracking-wide text-bb-white sm:text-3xl">
                {cat.label}
              </span>
              <motion.span
                aria-hidden
                animate={{ rotate: isOpen ? 45 : 0 }}
                transition={{ duration: 0.3, ease: EASE_BB }}
                className="text-2xl font-light leading-none text-bb-red"
              >
                +
              </motion.span>
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  key="body"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.4, ease: EASE_BB }}
                  className="overflow-hidden"
                >
                  <div className="pb-8">
                    {cat.note && (
                      <p className="font-body mb-5 max-w-md text-xs italic leading-relaxed text-bb-gray-500">
                        {cat.note}
                      </p>
                    )}

                    {cat.groups.map((g, gi) => (
                      <div key={g.title ?? gi} className={gi > 0 ? "mt-8" : ""}>
                        {g.title && (
                          <h4 className="font-body mb-1 text-[0.62rem] uppercase tracking-[0.35em] text-bb-red">
                            {g.title}
                          </h4>
                        )}
                        {g.note && (
                          <p className="font-body mb-2 text-[0.6rem] uppercase tracking-[0.2em] text-bb-gray-500">
                            {g.note}
                          </p>
                        )}
                        <ul>
                          {g.items.map((it) => (
                            <li
                              key={it.name}
                              className="border-b border-bb-gray-900/40 py-3 last:border-0"
                            >
                              <div className="flex items-baseline justify-between gap-4">
                                <span className="font-display text-base leading-tight text-bb-white sm:text-lg">
                                  {it.name}
                                </span>
                                <span className="font-body shrink-0 whitespace-nowrap text-xs tracking-wide text-bb-red sm:text-sm">
                                  {priceLabel(it)}
                                </span>
                              </div>
                              {it.desc && (
                                <p className="font-body mt-1 max-w-md text-xs leading-relaxed text-bb-gray-500">
                                  {it.desc}
                                </p>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
