import { useEffect } from "react";

import { useCanvasStore } from "@/store/canvasStore";
import { useFontStore } from "@/store/fontStore";
import { collectDesignFontWeights } from "@/utils/fonts/designWeights";
import { loadFamily } from "@/utils/fonts/fontLoader";

/**
 * Drives the font-swap contract for a ranker canvas: whenever the selected
 * font differs from the one on screen, load it (only the weights the current
 * design draws with) and then promote it to `displayedFont`. Canvas content
 * keeps rendering with `displayedFont` in the meantime.
 */
export const useFontSwap = () => {
  const selectedFont = useFontStore((state) => state.selectedFont);
  const displayedFont = useFontStore((state) => state.displayedFont);
  const fontDispatch = useFontStore((state) => state.dispatch);
  // Re-run once the catalog arrives: weights can only be resolved against it.
  const catalogFetching = useFontStore((state) => state.fetching);

  useEffect(() => {
    if (!selectedFont) return;
    if (selectedFont === displayedFont) return;

    let cancelled = false;
    const finish = () => {
      if (cancelled) return;
      fontDispatch({ type: "SET_DISPLAYED_FONT", payload: selectedFont });
    };
    const weights = collectDesignFontWeights(useCanvasStore.getState().design);
    // A failed load still swaps, so the canvas falls back instead of hanging.
    loadFamily(selectedFont, weights).then(finish).catch(finish);

    return () => {
      cancelled = true;
    };
  }, [selectedFont, displayedFont, catalogFetching, fontDispatch]);

  const isFontLoaded = displayedFont !== "";

  return {
    selectedFont,
    displayedFont,
    /** False until the first font has loaded; the stage must not mount yet. */
    isFontLoaded,
    /** A newly selected font is loading while the old one stays on screen. */
    isFontSwapping: isFontLoaded && selectedFont !== displayedFont,
  };
};
