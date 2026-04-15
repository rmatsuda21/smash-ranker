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
  const players = usePlayerStore((state) => state.players);

  return useMemo(() => {
    if (!dynamicPlayerHeight) return canvasSize;

    let totalDelta = 0;
    for (const player of players) {
      totalDelta += computePlayerHeightDelta(
        dynamicPlayerHeight,
        player.characters?.length ?? 0,
      );
    }

    if (totalDelta === 0) return canvasSize;

    return {
      width: canvasSize.width,
      height: canvasSize.height + totalDelta,
    };
  }, [canvasSize, dynamicPlayerHeight, players]);
}
