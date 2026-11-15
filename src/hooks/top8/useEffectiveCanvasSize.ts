import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";

import { useCanvasStore } from "@/store/canvasStore";
import { usePlayerStore } from "@/store/playerStore";
import { computePlayerHeightDelta } from "@/utils/top8/dynamicPlayerHeight";

export function useEffectiveCanvasSize() {
  const canvasSize = useCanvasStore(
    useShallow((state) => state.design.canvasSize),
  );
  const dynamicPlayerHeight = useCanvasStore(
    (state) => state.design.dynamicPlayerHeight,
  );
  const slotCount = useCanvasStore(
    (state) => state.design.players?.length ?? 0,
  );
  const players = usePlayerStore((state) => state.players);

  return useMemo(() => {
    if (!dynamicPlayerHeight) return canvasSize;

    // Only players that occupy a design slot are drawn, so only they can grow
    // the canvas. Mirrors the loop in `computeDynamicPlayerLayout`.
    let totalDelta = 0;
    for (let i = 0; i < Math.min(slotCount, players.length); i++) {
      totalDelta += computePlayerHeightDelta(
        dynamicPlayerHeight,
        players[i].characters?.length ?? 0,
      );
    }

    if (totalDelta === 0) return canvasSize;

    return {
      width: canvasSize.width,
      height: canvasSize.height + totalDelta,
    };
  }, [canvasSize, dynamicPlayerHeight, slotCount, players]);
}
