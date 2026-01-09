import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Layer, Rect, Transformer } from "react-konva";
import { Layer as KonvaLayer } from "konva/lib/Layer";
import { KonvaEventObject } from "konva/lib/Node";
import { Transformer as KonvaTransformer } from "konva/lib/shapes/Transformer";
import { useShallow } from "zustand/react/shallow";

import { Player } from "@/components/top8/Canvas/Player";
import { usePlayerStore } from "@/store/playerStore";
import { useCanvasStore } from "@/store/canvasStore";
import { PlayerDesign } from "@/types/top8/Design";
import { useFontStore } from "@/store/fontStore";
import { PlayerInfo } from "@/types/top8/Player";

type PlayerTransformerLayerProps = {
  players: PlayerInfo[];
  mainLayerRef: React.RefObject<KonvaLayer | null>;
};

const PlayerTransformerLayer = memo(
  ({ players, mainLayerRef }: PlayerTransformerLayerProps) => {
    const trRef = useRef<KonvaTransformer>(null);
    const transformerLayerRef = useRef<KonvaLayer>(null);

    const [selectionBox, setSelectionBox] = useState<{
      x: number;
      y: number;
      width: number;
      height: number;
      scaleX: number;
      scaleY: number;
      rotation: number;
    } | null>(null);

    const selectedPlayerIndex = usePlayerStore(
      (state) => state.selectedPlayerIndex
    );
    const editable = useCanvasStore((state) => state.editable);

    useEffect(() => {
      if (!trRef.current) return;

      if (selectedPlayerIndex !== -1) {
        const stage = mainLayerRef.current?.getStage();
        const id = players?.[selectedPlayerIndex]?.id;
        const node = id ? stage?.findOne(`#${id}`) : null;
        if (node) {
          trRef.current.nodes([node]);

          const syncSelectionBox = () => {
            setSelectionBox({
              x: node.x(),
              y: node.y(),
              width: node.width(),
              height: node.height(),
              scaleX: node.scaleX(),
              scaleY: node.scaleY(),
              rotation: node.rotation() ?? 0,
            });
          };

          syncSelectionBox();
          node.on("dragmove.playerSelection", syncSelectionBox);
          node.on("transform.playerSelection", syncSelectionBox);
          node.on("dragend.playerSelection", syncSelectionBox);
          node.on("transformend.playerSelection", syncSelectionBox);

          return () => {
            node.off(".playerSelection");
          };
        } else {
          trRef.current.nodes([]);
          setSelectionBox(null);
        }
      } else {
        trRef.current.nodes([]);
        setSelectionBox(null);
      }
    }, [selectedPlayerIndex, mainLayerRef, players]);

    return (
      <Layer ref={transformerLayerRef}>
        {selectionBox && (
          <Rect
            x={selectionBox.x}
            y={selectionBox.y}
            width={selectionBox.width}
            height={selectionBox.height}
            scaleX={selectionBox.scaleX}
            scaleY={selectionBox.scaleY}
            rotation={selectionBox.rotation}
            fill="transparent"
            stroke="rgba(0, 0, 255, 0.7)"
            strokeWidth={15}
            listening={false}
          />
        )}
        <Transformer name="player-transformer" ref={trRef} visible={editable} />
      </Layer>
    );
  }
);

const PlayerLayerComponent = ({ onReady }: { onReady?: () => void }) => {
  const readyPlayerCountRef = useRef(0);
  const mainLayerRef = useRef<KonvaLayer>(null);
  const dragLayerRef = useRef<KonvaLayer>(null);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  const players = usePlayerStore((state) => state.players);

  const selectedFont = useFontStore((state) => state.selectedFont);

  const editable = useCanvasStore((state) => state.editable);
  const playerLayouts = useCanvasStore((state) => state.design.players);
  const basePlayer = useCanvasStore((state) => state.design.basePlayer);
  const canvasSize = useCanvasStore(
    useShallow((state) => state.design.canvasSize)
  );
  const colorPalette = useCanvasStore(
    useShallow((state) => state.design.colorPalette)
  );
  const bgAssetId = useCanvasStore((state) => state.design.bgAssetId);

  const design = useMemo(
    () => ({ colorPalette, bgAssetId }),
    [colorPalette, bgAssetId]
  );

  const playerConfigs: PlayerDesign[] = useMemo(() => {
    return playerLayouts.map((player) => ({
      ...basePlayer,
      ...player,
    }));
  }, [basePlayer, playerLayouts]);

  const onPlayerDragStart = useCallback((e: KonvaEventObject<MouseEvent>) => {
    const player = e.target;
    if (!player) return;

    player.moveTo(dragLayerRef.current);
  }, []);

  const onPlayerDragEnd = useCallback((e: KonvaEventObject<MouseEvent>) => {
    const player = e.target;
    if (!player) return;

    player.moveTo(mainLayerRef.current);
  }, []);

  const handlePlayerReady = useCallback(() => {
    readyPlayerCountRef.current++;
    if (readyPlayerCountRef.current === players.length) {
      onReadyRef.current?.();
    }
  }, [players.length]);

  if (!playerLayouts) return <Layer ref={mainLayerRef} />;

  return (
    <>
      <Layer ref={mainLayerRef}>
        {players.map((player, index) => {
          if (index >= playerConfigs.length) return null;

          return (
            <Player
              key={player.id}
              config={playerConfigs[index]}
              canvasSize={canvasSize}
              design={design}
              player={player}
              index={index}
              onDragStart={onPlayerDragStart}
              onDragEnd={onPlayerDragEnd}
              fontFamily={selectedFont}
              editable={editable}
              onReady={handlePlayerReady}
            />
          );
        })}
      </Layer>

      <Layer ref={dragLayerRef}></Layer>
      <PlayerTransformerLayer players={players} mainLayerRef={mainLayerRef} />
    </>
  );
};

export const PlayerLayer = memo(PlayerLayerComponent);
