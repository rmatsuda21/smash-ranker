import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { Layer, Transformer } from "react-konva";
import { Layer as KonvaLayer } from "konva/lib/Layer";
import { KonvaEventObject } from "konva/lib/Node";
import { Transformer as KonvaTransformer } from "konva/lib/shapes/Transformer";

import { Player } from "@/components/top8/Canvas/Player";
import { usePlayerStore } from "@/store/playerStore";
import { useCanvasStore } from "@/store/canvasStore";
import { PlayerDesign } from "@/types/top8/Design";
import { useFontStore } from "@/store/fontStore";

const PlayerLayerComponent = () => {
  const trRef = useRef<KonvaTransformer>(null);
  const mainLayerRef = useRef<KonvaLayer>(null);
  const dragLayerRef = useRef<KonvaLayer>(null);

  const players = usePlayerStore((state) => state.players);
  const selectedPlayerIndex = usePlayerStore(
    (state) => state.selectedPlayerIndex
  );

  const selectedFont = useFontStore((state) => state.selectedFont);

  const editable = useCanvasStore((state) => state.editable);
  const playerLayouts = useCanvasStore((state) => state.design.players);
  const basePlayer = useCanvasStore((state) => state.design.basePlayer);
  const canvasSize = useCanvasStore((state) => state.design.canvasSize);
  const colorPalette = useCanvasStore((state) => state.design.colorPalette);
  const bgAssetId = useCanvasStore((state) => state.design.bgAssetId);
  const dispatch = useCanvasStore((state) => state.dispatch);

  const playerConfigs: PlayerDesign[] = useMemo(() => {
    return playerLayouts.map((player) => ({
      ...basePlayer,
      ...player,
    }));
  }, [basePlayer, playerLayouts]);

  useEffect(() => {
    if (selectedPlayerIndex !== -1 && trRef.current) {
      const node = mainLayerRef.current?.findOne(
        `#${players[selectedPlayerIndex].id}`
      );
      if (node) {
        trRef.current.nodes([node]);
      }
    } else if (trRef.current) {
      trRef.current.nodes([]);
    }
  }, [selectedPlayerIndex, mainLayerRef, players]);

  const handleTransform = useCallback(
    (e: KonvaEventObject<MouseEvent>) => {
      const config = {
        ...basePlayer,
        ...playerLayouts[selectedPlayerIndex],
      };
      dispatch({
        type: "UPDATE_PLAYER_CONFIG",
        payload: {
          index: selectedPlayerIndex,
          config: {
            ...config,
            scale: { x: e.target.scaleX(), y: e.target.scaleY() },
            rotation: e.target.rotation() ?? 0,
          },
        },
      });
    },
    [selectedPlayerIndex, basePlayer, playerLayouts, dispatch]
  );

  const onPlayerDragStart = useCallback((e: KonvaEventObject<MouseEvent>) => {
    const player = e.target;
    if (!player) return;

    trRef.current?.moveTo(dragLayerRef.current);
    player.moveTo(dragLayerRef.current);
  }, []);

  const onPlayerDragEnd = useCallback((e: KonvaEventObject<MouseEvent>) => {
    const player = e.target;
    if (!player) return;

    trRef.current?.moveTo(mainLayerRef.current);
    player.moveTo(mainLayerRef.current);
  }, []);

  if (!playerLayouts) return <Layer ref={mainLayerRef} />;

  return (
    <>
      <Layer ref={mainLayerRef}>
        {players.map((player, index) => {
          if (index >= playerConfigs.length) return null;

          const playerConfig = {
            ...basePlayer,
            ...playerLayouts[index],
          };

          return (
            <Player
              key={player.id}
              config={playerConfig}
              canvasSize={canvasSize}
              design={{ colorPalette, bgAssetId }}
              isSelected={selectedPlayerIndex === index}
              player={player}
              index={index}
              onDragStart={onPlayerDragStart}
              onDragEnd={onPlayerDragEnd}
              fontFamily={selectedFont}
              editable={editable}
            />
          );
        })}
        {editable && (
          <Transformer
            name="player-transformer"
            ref={trRef}
            onTransform={handleTransform}
          />
        )}
      </Layer>

      <Layer ref={dragLayerRef}></Layer>
    </>
  );
};

export const PlayerLayer = memo(PlayerLayerComponent);
