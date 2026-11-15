import { type RefObject, useLayoutEffect } from "react";

export const SUPPORTS_POPOVER =
  typeof HTMLElement !== "undefined" && "popover" in HTMLElement.prototype;

/**
 * Promotes an element carrying the `popover` attribute to the top layer for
 * as long as it is mounted, so it paints above everything (including modal
 * dialogs) without z-index. No-op where the Popover API is missing.
 */
export const useTopLayer = (ref: RefObject<HTMLElement | null>) => {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !SUPPORTS_POPOVER) return;
    el.showPopover();
    return () => {
      if (el.isConnected && el.matches(":popover-open")) el.hidePopover();
    };
  }, [ref]);
};
