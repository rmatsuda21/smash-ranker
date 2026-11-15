import { memo, useCallback, useEffect, useRef, useState } from "react";
import { Group, Layer, Rect, Transformer } from "react-konva";
import { Group as KonvaGroup } from "konva/lib/Group";
import { Layer as KonvaLayer } from "konva/lib/Layer";
import { KonvaEventObject } from "konva/lib/Node";
import { Rect as KonvaRect } from "konva/lib/shapes/Rect";
import { Transformer as KonvaTransformer } from "konva/lib/shapes/Transformer";
import { useShallow } from "zustand/react/shallow";

import { BackgroundContent } from "@/components/top8/Canvas/scene/BackgroundContent";
import { PlayersContent } from "@/components/top8/Canvas/scene/PlayersContent";
import { usePlayerStore } from "@/store/playerStore";
import { useCanvasStore } from "@/store/canvasStore";
import { useFontStore } from "@/store/fontStore";
import { PlayerInfo } from "@/types/top8/Player";
import { useEffectiveCanvasSize } from "@/hooks/top8/useEffectiveCanvasSize";
import { usePlayerConfigs, useSceneDesign } from "@/hooks/top8/useSceneState";

type PlayerSelectionProps = {
  players: PlayerInfo[];
  contentLayerRef: React.RefObject<KonvaLayer | null>;
};

/** Outline and transform handles for the selected player. */
const PlayerSelection = memo(
  ({ players, contentLayerRef }: PlayerSelectionProps) => {
    const trRef = useRef<KonvaTransformer>(null);

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
      (state) => state.selectedPlayerIndex,
    );
    const editable = useCanvasStore((state) => state.editable);

    useEffect(() => {
      if (!trRef.current) return;

      if (selectedPlayerIndex !== -1) {
        const stage = contentLayerRef.current?.getStage();
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
    }, [selectedPlayerIndex, contentLayerRef, players]);

    return (
      <>
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
      </>
    );
  },
);

const HOVER_FILL = "rgba(0, 0, 0, 0.2)";

type Props = {
  onBackgroundReady?: () => void;
  onPlayersReady?: () => void;
};

/**
 * The editor's background and players, plus everything drawn over them while
 * editing.
 *
 * Two layers, because each Konva layer owns a stage-sized canvas:
 * - content: background and players. Redraws when the design or data change.
 * - overlay: hover highlights, the player being dragged, and the selection
 *   handles. Redraws on pointer movement without touching the content.
 */
const EditableContentLayersComponent = ({
  onBackgroundReady,
  onPlayersReady,
}: Props) => {
  const contentLayerRef = useRef<KonvaLayer>(null);
  const playersGroupRef = useRef<KonvaGroup>(null);
  const dragGroupRef = useRef<KonvaGroup>(null);
  const hoverRectsByPlayerId = useRef<Map<string, KonvaRect>>(new Map());

  const players = usePlayerStore((state) => state.players);
  const displayedFont = useFontStore((state) => state.displayedFont);
  const editable = useCanvasStore((state) => state.editable);
  const backgroundElements = useCanvasStore(
    (state) => state.design.background.elements,
  );
  const reversePlayerZOrder = useCanvasStore(
    (state) => state.design.reversePlayerZOrder,
  );
  const canvasSize = useCanvasStore(
    useShallow((state) => state.design.canvasSize),
  );
  const effectiveCanvasSize = useEffectiveCanvasSize();
  const design = useSceneDesign();
  const playerConfigs = usePlayerConfigs();

  const handlePlayerHoverChange = useCallback(
    (playerId: string, isHovered: boolean) => {
      const node = hoverRectsByPlayerId.current.get(playerId);
      if (!node) return;
      node.opacity(isHovered ? 1 : 0);
      node.getLayer()?.batchDraw();
    },
    [],
  );

  // A dragged player is lifted into the overlay layer so only that layer
  // repaints while it moves, then dropped back among the other players.
  const onPlayerDragStart = useCallback((e: KonvaEventObject<MouseEvent>) => {
    if (dragGroupRef.current) e.target?.moveTo(dragGroupRef.current);
  }, []);

  const onPlayerDragEnd = useCallback((e: KonvaEventObject<MouseEvent>) => {
    if (playersGroupRef.current) e.target?.moveTo(playersGroupRef.current);
  }, []);

  return (
    <>
      <Layer ref={contentLayerRef}>
        <Group listening={false}>
          <BackgroundContent
            elements={backgroundElements}
            canvasSize={canvasSize}
            effectiveCanvasSize={effectiveCanvasSize}
            design={design}
            fontFamily={displayedFont}
            onReady={onBackgroundReady}
          />
        </Group>
        <Group ref={playersGroupRef}>
          <PlayersContent
            players={players}
            configs={playerConfigs}
            reverseZOrder={reversePlayerZOrder}
            canvasSize={effectiveCanvasSize}
            design={design}
            fontFamily={displayedFont}
            editable={editable}
            onDragStart={onPlayerDragStart}
            onDragEnd={onPlayerDragEnd}
            onHoverChange={handlePlayerHoverChange}
            onReady={onPlayersReady}
          />
        </Group>
      </Layer>

      <Layer>
        <Group listening={false}>
          {playerConfigs.map((config, index) => {
            const player = players[index];
            if (!player) return null;
            return (
              <Rect
                key={player.id}
                ref={(node) => {
                  if (node) hoverRectsByPlayerId.current.set(player.id, node);
                  else hoverRectsByPlayerId.current.delete(player.id);
                }}
                x={config.position?.x}
                y={config.position?.y}
                width={config.size?.width}
                height={config.size?.height}
                scaleX={config.scale?.x ?? 1}
                scaleY={config.scale?.y ?? 1}
                rotation={config.rotation ?? 0}
                fill={HOVER_FILL}
                opacity={0}
                listening={false}
                perfectDrawEnabled={false}
              />
            );
          })}
        </Group>
        <Group ref={dragGroupRef} />
        <PlayerSelection players={players} contentLayerRef={contentLayerRef} />
      </Layer>
    </>
  );
};

export const EditableContentLayers = memo(EditableContentLayersComponent);
