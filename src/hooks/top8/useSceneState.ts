import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";

import type { SceneDesign } from "@/hooks/top8/useSceneFactoryContext";
import { useTextMetricsVersion } from "@/hooks/top8/useTextMetricsVersion";
import { useCanvasStore } from "@/store/canvasStore";
import { useFontStore } from "@/store/fontStore";
import { usePlayerStore } from "@/store/playerStore";
import { getPlayerConfigs } from "@/utils/top8/scene";

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

  const fontFamily = useFontStore((state) => state.displayedFont);
  const metricsVersion = useTextMetricsVersion();

  return useMemo(
    () =>
      getPlayerConfigs(
        basePlayer,
        playerSlots,
        dynamicPlayerHeight,
        players,
        fontFamily,
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- metricsVersion: remeasure once fonts load
    [
      basePlayer,
      playerSlots,
      dynamicPlayerHeight,
      players,
      fontFamily,
      metricsVersion,
    ],
  );
};
