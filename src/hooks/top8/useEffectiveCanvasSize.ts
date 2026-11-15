import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";

import { useCanvasStore } from "@/store/canvasStore";
import { usePlayerStore } from "@/store/playerStore";
import { getEffectiveCanvasSize } from "@/utils/top8/scene";

/** The current design's canvas size after dynamic player height. */
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

  return useMemo(
    () =>
      getEffectiveCanvasSize(
        canvasSize,
        dynamicPlayerHeight,
        slotCount,
        players,
      ),
    [canvasSize, dynamicPlayerHeight, slotCount, players],
  );
}
