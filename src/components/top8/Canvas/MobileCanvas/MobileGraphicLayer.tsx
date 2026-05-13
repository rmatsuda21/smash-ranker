import { memo, useMemo } from "react";
import { Group, Layer } from "react-konva";
import { useShallow } from "zustand/react/shallow";

import { useCanvasStore } from "@/store/canvasStore";
import { usePlayerStore } from "@/store/playerStore";
import { useTournamentStore } from "@/store/tournamentStore";
import { useFontStore } from "@/store/fontStore";
import { createKonvaElements } from "@/utils/top8/elementFactory";
import { Player } from "@/components/top8/Canvas/Player";
import { useEffectiveCanvasSize } from "@/hooks/top8/useEffectiveCanvasSize";
import { computeDynamicPlayerLayout } from "@/utils/top8/dynamicPlayerHeight";
import type { Design, ElementConfig, PlayerDesign } from "@/types/top8/Design";

const noop = () => {};

const MobileGraphicLayerComponent = () => {
  // Background layer state
  const backgroundElements = useCanvasStore(
    (state) => state.design.background.elements,
  );
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
  const originalCanvasSize = useCanvasStore(
    useShallow((state) => state.design.canvasSize),
  );
  const effectiveCanvasSize = useEffectiveCanvasSize();
  const selectedFont = useFontStore((state) => state.selectedFont);
  const displayedFont = useFontStore((state) => state.displayedFont);

  // Player layer state
  const players = usePlayerStore((state) => state.players);
  const playerLayouts = useCanvasStore((state) => state.design.players);
  const basePlayer = useCanvasStore((state) => state.design.basePlayer);
  const reversePlayerZOrder = useCanvasStore(
    (state) => state.design.reversePlayerZOrder,
  );
  const dynamicPlayerHeight = useCanvasStore(
    (state) => state.design.dynamicPlayerHeight,
  );

  // Tournament layer state
  const tournamentLayout = useCanvasStore((state) => state.design.tournament);
  const tournament = useTournamentStore((state) => state.info);

  // Background-element height adjustment (matches BackgroundLayer behavior).
  const adjustedBackgroundElements = useMemo(() => {
    if (effectiveCanvasSize.height === originalCanvasSize.height) {
      return backgroundElements;
    }
    return backgroundElements.map((el: ElementConfig) => {
      if (el.type === "rect" && el.size?.height === originalCanvasSize.height) {
        return {
          ...el,
          size: { ...el.size, height: effectiveCanvasSize.height },
        };
      }
      return el;
    });
  }, [
    backgroundElements,
    effectiveCanvasSize.height,
    originalCanvasSize.height,
  ]);

  const backgroundDesign = useMemo(
    () => ({ colorPalette, bgAssetId, bgImageDarkness }),
    [colorPalette, bgAssetId, bgImageDarkness],
  );

  const tournamentDesign = useMemo(
    () => ({ colorPalette, textPalette, bgAssetId, bgImageDarkness }),
    [colorPalette, textPalette, bgAssetId, bgImageDarkness],
  );

  const playerDesign = useMemo<
    Pick<Design, "colorPalette" | "textPalette" | "bgAssetId">
  >(
    () => ({ colorPalette, textPalette, bgAssetId }),
    [colorPalette, textPalette, bgAssetId],
  );

  const backgroundKonvaElements = useMemo(
    () =>
      createKonvaElements(adjustedBackgroundElements, {
        containerSize: effectiveCanvasSize,
        design: backgroundDesign,
        fontFamily: selectedFont,
        options: { editable: false, disableSelectable: true },
      }),
    [
      adjustedBackgroundElements,
      backgroundDesign,
      effectiveCanvasSize,
      selectedFont,
    ],
  );

  const tournamentKonvaElements = useMemo(
    () =>
      createKonvaElements(tournamentLayout?.elements ?? [], {
        fontFamily: displayedFont,
        tournament,
        containerSize: originalCanvasSize,
        design: tournamentDesign,
        options: { editable: false, disableSelectable: true },
      }),
    [
      tournamentLayout?.elements,
      displayedFont,
      tournament,
      originalCanvasSize,
      tournamentDesign,
    ],
  );

  const playerConfigs: PlayerDesign[] = useMemo(() => {
    if (dynamicPlayerHeight) {
      const { configs } = computeDynamicPlayerLayout(
        basePlayer,
        playerLayouts,
        players,
        dynamicPlayerHeight,
      );
      return configs;
    }
    return playerLayouts.map((player) => ({ ...basePlayer, ...player }));
  }, [basePlayer, playerLayouts, dynamicPlayerHeight, players]);

  const playerOrder = reversePlayerZOrder
    ? [...players.keys()].reverse()
    : [...players.keys()];

  return (
    <>
      <Layer listening={false}>{backgroundKonvaElements}</Layer>
      <Layer listening={false}>
        {playerOrder.map((index) => {
          const player = players[index];
          if (index >= playerConfigs.length) return null;
          return (
            <Player
              key={player.id}
              config={playerConfigs[index]}
              canvasSize={effectiveCanvasSize}
              design={playerDesign}
              player={player}
              index={index}
              onDragStart={noop}
              onDragEnd={noop}
              fontFamily={displayedFont}
              editable={false}
            />
          );
        })}
        <Group
          width={originalCanvasSize.width}
          height={originalCanvasSize.height}
          listening={false}
        >
          {tournamentKonvaElements}
        </Group>
      </Layer>
    </>
  );
};

export const MobileGraphicLayer = memo(MobileGraphicLayerComponent);
