import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";

import { useTextMetricsVersion } from "@/hooks/top8/useTextMetricsVersion";
import { useCanvasStore } from "@/store/canvasStore";
import { useFontStore } from "@/store/fontStore";
import { usePlayerStore } from "@/store/playerStore";
import { useTournamentStore } from "@/store/tournamentStore";
import { getEffectiveCanvasSize, getUnusedIconSpace } from "@/utils/top8/scene";

/** Space the current design reserves for a tournament icon that the current
 *  tournament doesn't have. */
export function useUnusedIconSpace() {
  const tournamentIconSpace = useCanvasStore(
    (state) => state.design.tournamentIconSpace,
  );
  const iconSrc = useTournamentStore((state) => state.info.iconSrc);
  return getUnusedIconSpace(tournamentIconSpace, iconSrc);
}

/** The current design's canvas size after dynamic player height and unused
 *  tournament icon space. */
export function useEffectiveCanvasSize() {
  const canvasSize = useCanvasStore(
    useShallow((state) => state.design.canvasSize),
  );
  const dynamicPlayerHeight = useCanvasStore(
    (state) => state.design.dynamicPlayerHeight,
  );
  const basePlayer = useCanvasStore((state) => state.design.basePlayer);
  const playerSlots = useCanvasStore((state) => state.design.players);
  const collapsibleBand = useCanvasStore(
    (state) => state.design.collapsibleBand,
  );
  const players = usePlayerStore((state) => state.players);
  const fontFamily = useFontStore((state) => state.displayedFont);
  const metricsVersion = useTextMetricsVersion();
  const unusedIconSpace = useUnusedIconSpace();

  return useMemo(
    () =>
      getEffectiveCanvasSize(
        {
          canvasSize,
          dynamicPlayerHeight,
          basePlayer,
          players: playerSlots ?? [],
          collapsibleBand,
        },
        players,
        fontFamily,
        unusedIconSpace,
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- metricsVersion: remeasure once fonts load
    [
      canvasSize,
      dynamicPlayerHeight,
      basePlayer,
      playerSlots,
      collapsibleBand,
      players,
      fontFamily,
      metricsVersion,
      unusedIconSpace,
    ],
  );
}
