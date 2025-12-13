import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { Layer, Transformer } from "react-konva";
import { Layer as KonvaLayer } from "konva/lib/Layer";
import { KonvaEventObject } from "konva/lib/Node";
import { Transformer as KonvaTransformer } from "konva/lib/shapes/Transformer";

import { Player } from "@/components/top8/Canvas/Player";
import { usePlayerStore } from "@/store/playerStore";
import { useCanvasStore } from "@/store/canvasStore";
import { PlayerLayoutConfig } from "@/types/top8/LayoutTypes";

const PlayerLayerComponent = () => {
  const trRef = useRef<KonvaTransformer>(null);
  const mainLayerRef = useRef<KonvaLayer>(null);
  const dragLayerRef = useRef<KonvaLayer>(null);

  const players = usePlayerStore((state) => state.players);
  const editable = useCanvasStore((state) => state.editable);
  const playerLayouts = useCanvasStore((state) => state.layout.players);
  const basePlayer = useCanvasStore((state) => state.layout.basePlayer);
  const canvasConfig = useCanvasStore((state) => state.layout.canvas);
  const dispatch = useCanvasStore((state) => state.dispatch);
  const selectedPlayerIndex = usePlayerStore(
    (state) => state.selectedPlayerIndex
  );

  const playerConfigs: PlayerLayoutConfig[] = useMemo(() => {
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
          return (
            <Player
              key={player.id}
              config={playerConfigs[index]}
              canvasConfig={canvasConfig}
              isSelected={selectedPlayerIndex === index}
              player={player}
              index={index}
              onDragStart={onPlayerDragStart}
              onDragEnd={onPlayerDragEnd}
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
