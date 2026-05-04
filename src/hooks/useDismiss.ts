import { type RefObject, useEffect, useRef } from "react";

type AnyRef = RefObject<HTMLElement | null>;

type DismissOnOutsideClickOptions = {
  enabled: boolean;
  refs: AnyRef[];
  onDismiss: () => void;
};

export const useDismissOnOutsideClick = ({
  enabled,
  refs,
  onDismiss,
}: DismissOnOutsideClickOptions) => {
  const latestRefs = useRef(refs);
  latestRefs.current = refs;

  useEffect(() => {
    if (!enabled) return;
    const handler = (e: MouseEvent) => {
      if (!(e.target instanceof Node)) return;
      for (const ref of latestRefs.current) {
        if (ref.current?.contains(e.target)) return;
      }
      onDismiss();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [enabled, onDismiss]);
};

type DismissOnEscapeOptions = {
  enabled: boolean;
  onDismiss: () => void;
};

export const useDismissOnEscape = ({
  enabled,
  onDismiss,
}: DismissOnEscapeOptions) => {
  useEffect(() => {
    if (!enabled) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDismiss();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [enabled, onDismiss]);
};
