"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";

type Props = {
  text: string;
  className?: string;
  /** ms entre deux lettres */
  speed?: number;
  /** délai avant de commencer, ms */
  startDelay?: number;
};

/**
 * Écrit `text` lettre par lettre quand le composant entre dans le viewport,
 * puis laisse un curseur clignotant à la fin (façon Word).
 * Respecte prefers-reduced-motion (texte complet, sans curseur).
 * Les sauts de ligne (\n) sont rendus via white-space: pre-line.
 */
export default function Typewriter({
  text,
  className,
  speed = 42,
  startDelay = 250,
}: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-18%" });
  const reduce = useReducedMotion();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      setCount(text.length);
      return;
    }
    let i = 0;
    let tick: ReturnType<typeof setTimeout>;
    const step = () => {
      i += 1;
      setCount(i);
      if (i < text.length) tick = setTimeout(step, speed);
    };
    const start = setTimeout(step, startDelay);
    return () => {
      clearTimeout(start);
      clearTimeout(tick);
    };
  }, [inView, reduce, text, speed, startDelay]);

  return (
    <span ref={ref} className={className} aria-label={text}>
      <span aria-hidden style={{ whiteSpace: "pre-line" }}>
        {text.slice(0, count)}
      </span>
      {!reduce && inView && (
        <motion.span
          aria-hidden
          className="ml-1 inline-block w-[0.06em] bg-bb-red align-middle"
          style={{ height: "0.95em" }}
          animate={{ opacity: [1, 1, 0, 0] }}
          transition={{
            duration: 1.05,
            repeat: Infinity,
            times: [0, 0.5, 0.5, 1],
            ease: "linear",
          }}
        />
      )}
    </span>
  );
}
