import { useCallback, useEffect, useMemo, useRef, useState, memo } from "react";
import { Vector2d } from "konva/lib/types";
import { Group, Rect, Transformer } from "react-konva";
// import { SceneContext } from "konva/lib/Context";
import { Group as KonvaGroup } from "konva/lib/Group";
import { KonvaEventObject } from "konva/lib/Node";
import { Transformer as KonvaTransformer } from "konva/lib/shapes/Transformer";
import isEqual from "lodash/isEqual";

import { PlayerInfo } from "@/types/top8/PlayerTypes";
import { useCanvasStore } from "@/store/canvasStore";
import { usePlayerStore } from "@/store/playerStore";
import { PlayerLayoutConfig } from "@/types/top8/LayoutTypes";
import { createKonvaElements } from "@/utils/top8/elementFactory";

type Props = {
  player: PlayerInfo;
  config: PlayerLayoutConfig;
  index: number;
  onDragStart: (e: KonvaEventObject<MouseEvent>) => void;
  onDragEnd: (e: KonvaEventObject<MouseEvent>) => void;
};

const PlayerComponent = ({
  player,
  index,
  config,
  onDragStart,
  onDragEnd,
}: Props) => {
  const groupRef = useRef<KonvaGroup>(null);
  const trRef = useRef<KonvaTransformer>(null);

  const [size] = useState(config.size ?? { width: 700, height: 700 });
  const [position, setPosition] = useState(config.position ?? { x: 0, y: 0 });
  const [scale, setScale] = useState(config.scale ?? { x: 1, y: 1 });
  const [isHovered, setIsHovered] = useState(false);

  const layout = useCanvasStore((state) => state.layout);
  const selectedFont = useCanvasStore((state) => state.selectedFont);
  const fonts = useCanvasStore((state) => state.fonts);
  const selectedPlayerIndex = usePlayerStore(
    (state) => state.selectedPlayerIndex
  );
  const dispatch = usePlayerStore((state) => state.dispatch);
  const isSelected = selectedPlayerIndex === index;

  useEffect(() => {
    if (isSelected && trRef.current && groupRef.current) {
      trRef.current.nodes([groupRef.current]);
    } else if (!isSelected && trRef.current) {
      trRef.current.nodes([]);
    }
  }, [isSelected]);

  const handleMouseOver = useCallback((e: KonvaEventObject<MouseEvent>) => {
    const container = e.target.getStage()?.container();
    if (container) {
      container.style.cursor = "pointer";
    }

    setIsHovered(true);
  }, []);

  const handleMouseOut = useCallback((e: KonvaEventObject<MouseEvent>) => {
    const container = e.target.getStage()?.container();
    if (container) {
      container.style.cursor = "default";
    }

    setIsHovered(false);
  }, []);

  const handleDragEnd = useCallback(
    (e: KonvaEventObject<MouseEvent>) => {
      setPosition({ x: e.target.x(), y: e.target.y() });
      onDragEnd(e);
    },
    [onDragEnd]
  );

  const handleGroupClick = useCallback(
    (e: KonvaEventObject<MouseEvent>) => {
      e.cancelBubble = true;
      dispatch({ type: "SET_SELECTED_PLAYER_INDEX", payload: index });
    },
    [index, dispatch]
  );

  const handleTransform = useCallback((e: KonvaEventObject<MouseEvent>) => {
    setScale({ x: e.target.scaleX(), y: e.target.scaleY() });
  }, []);

  const dragBoundFunc = useCallback(
    (pos: Vector2d) => {
      return {
        x: Math.max(
          0,
          Math.min(
            pos.x,
            layout?.canvas.size.width - (size.width ?? 0) * scale.x
          )
        ),
        y: Math.max(
          0,
          Math.min(
            pos.y,
            layout?.canvas.size.height - (size.height ?? 0) * scale.y
          )
        ),
      };
    },
    [
      layout?.canvas.size.width,
      layout?.canvas.size.height,
      size.width,
      size.height,
      scale.x,
      scale.y,
    ]
  );

  const fontFamily = useMemo(() => {
    return fonts[selectedFont] === "loaded" ? selectedFont : "Arial";
  }, [selectedFont, fonts]);

  const playerWithPlacement = useMemo(
    () => ({ ...player, placement: index + 1 }),
    [player, index]
  );

  const konvaElements = useMemo(
    () =>
      createKonvaElements(config.elements ?? [], {
        fontFamily,
        player: playerWithPlacement,
        containerSize: { width: size.width ?? 0, height: size.height ?? 0 },
      }),
    [config.elements, fontFamily, playerWithPlacement, size]
  );

  return (
    <>
      <Group
        ref={groupRef}
        draggable={isSelected}
        x={position.x ?? 0}
        y={position.y ?? 0}
        width={size.width}
        height={size.height}
        scaleX={scale.x}
        scaleY={scale.y}
        onClick={handleGroupClick}
        onMouseOver={handleMouseOver}
        onMouseOut={handleMouseOut}
        onDragEnd={handleDragEnd}
        onDragStart={onDragStart}
        dragBoundFunc={dragBoundFunc}
        name={player.id}
      >
        {konvaElements}
        <Rect
          x={0}
          y={0}
          width={size.width}
          height={size.height}
          fill={isHovered ? "rgba(0, 0, 0, 0.2)" : "transparent"}
        />
      </Group>
      <Transformer
        name={`transformer-${player.id}`}
        ref={trRef}
        onTransform={handleTransform}
      />
    </>
  );
};

export const Player = memo(PlayerComponent, (prevProps, nextProps) => {
  return (
    prevProps.player.id === nextProps.player.id &&
    prevProps.player.gamerTag === nextProps.player.gamerTag &&
    prevProps.player.prefix === nextProps.player.prefix &&
    prevProps.player.twitter === nextProps.player.twitter &&
    isEqual(prevProps.player.characters, nextProps.player.characters) &&
    prevProps.index === nextProps.index &&
    isEqual(prevProps.config, nextProps.config)
  );
});
