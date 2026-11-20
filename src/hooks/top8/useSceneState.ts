import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";

import type { SceneDesign } from "@/hooks/top8/useSceneFactoryContext";
import { useTextMetricsVersion } from "@/hooks/top8/useTextMetricsVersion";
import { useUnusedIconSpace } from "@/hooks/top8/useEffectiveCanvasSize";
import { useCanvasStore } from "@/store/canvasStore";
import { useFontStore } from "@/store/fontStore";
import { usePlayerStore } from "@/store/playerStore";
import type { PlayerInfo } from "@/types/top8/Player";
import { getPlayerConfigs, getTournamentElements } from "@/utils/top8/scene";

const NO_PLAYERS: PlayerInfo[] = [];

/** The current design's palettes and background-image settings, stable until
 *  one of them actually changes. */
export const useSceneDesign = (): SceneDesign => {
  const colorPalette = useCanvasStore(
    useShallow((state) => state.design.colorPalette),
  );
  const textPalette = useCanvasStore(
    useShallow((state) => state.design.textPalette),
  );
  const bgAssetId = useCanvasStore((state) => state.design.bgAssetId);
  const bgImageDarkness = useCanvasStore(
    (state) => state.design.bgImageDarkness,
  );

  return useMemo(
    () => ({ colorPalette, textPalette, bgAssetId, bgImageDarkness }),
    [colorPalette, textPalette, bgAssetId, bgImageDarkness],
  );
};

/** The current design's per-slot player layouts for the current players. */
export const usePlayerConfigs = () => {
  const players = usePlayerStore((state) => state.players);
  const basePlayer = useCanvasStore((state) => state.design.basePlayer);
  const playerSlots = useCanvasStore((state) => state.design.players);
  const dynamicPlayerHeight = useCanvasStore(
    (state) => state.design.dynamicPlayerHeight,
  );

  const playerTable = useCanvasStore((state) => state.design.playerTable);

  const fontFamily = useFontStore((state) => state.displayedFont);
  const metricsVersion = useTextMetricsVersion();
  const unusedIconSpace = useUnusedIconSpace();

  return useMemo(
    () =>
      getPlayerConfigs(
        basePlayer,
        playerSlots,
        dynamicPlayerHeight,
        players,
        fontFamily,
        unusedIconSpace,
        playerTable,
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- metricsVersion: remeasure once fonts load
    [
      basePlayer,
      playerSlots,
      dynamicPlayerHeight,
      players,
      fontFamily,
      metricsVersion,
      unusedIconSpace,
      playerTable,
    ],
  );
};

/** The current design's tournament elements, with table headers placed over
 *  their columns. The stored array itself for a design without a table. */
export const useTournamentElements = () => {
  const elements = useCanvasStore((state) => state.design.tournament?.elements);
  const playerTable = useCanvasStore((state) => state.design.playerTable);
  const basePlayer = useCanvasStore((state) => state.design.basePlayer);
  const playerSlots = useCanvasStore((state) => state.design.players);
  // Only a table depends on the players; without one, don't subscribe.
  const players = usePlayerStore((state) =>
    playerTable ? state.players : NO_PLAYERS,
  );

  const fontFamily = useFontStore((state) => state.displayedFont);
  const metricsVersion = useTextMetricsVersion();

  return useMemo(
    () =>
      getTournamentElements(
        elements,
        { basePlayer, players: playerSlots, playerTable },
        players,
        fontFamily,
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- metricsVersion: remeasure once fonts load
    [
      elements,
      basePlayer,
      playerSlots,
      playerTable,
      players,
      fontFamily,
      metricsVersion,
    ],
  );
};
