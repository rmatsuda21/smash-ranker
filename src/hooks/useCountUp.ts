import { useEffect, useState } from "react";

const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Animates a number from 0 to `target` (ease-out). Returns `target` straight
// away when the user prefers reduced motion.
export const useCountUp = (target: number, durationMs = 1200): number => {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion() || target === 0) return;

    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / durationMs);
      setValue(target * (1 - Math.pow(1 - progress, 3)));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, durationMs]);

  return prefersReducedMotion() || target === 0 ? target : value;
};
