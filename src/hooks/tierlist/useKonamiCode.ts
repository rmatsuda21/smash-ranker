import { useEffect, useRef } from "react";

const KONAMI_SEQUENCE = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
];

export const useKonamiCode = (callback: () => void) => {
  const indexRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === KONAMI_SEQUENCE[indexRef.current]) {
        indexRef.current++;
        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          indexRef.current = 0;
        }, 2000);

        if (indexRef.current === KONAMI_SEQUENCE.length) {
          indexRef.current = 0;
          clearTimeout(timerRef.current);
          callback();
        }
      } else {
        indexRef.current = 0;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      clearTimeout(timerRef.current);
    };
  }, [callback]);
};
