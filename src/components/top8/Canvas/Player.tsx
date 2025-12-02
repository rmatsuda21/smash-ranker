import { useCallback, useMemo, memo } from "react";
import { Vector2d } from "konva/lib/types";
import { KonvaEventObject } from "konva/lib/Node";
import isEqual from "lodash/isEqual";

import { PlayerInfo } from "@/types/top8/PlayerTypes";
import { useCanvasStore } from "@/store/canvasStore";
import { usePlayerStore } from "@/store/playerStore";
import { PlayerLayoutConfig } from "@/types/top8/LayoutTypes";
import { createKonvaElements } from "@/utils/top8/elementFactory";
import { SelectableElement } from "./SelectableElement";

type Props = {
  player: PlayerInfo;
  config: PlayerLayoutConfig;
  index: number;
  onDragStart: (e: KonvaEventObject<MouseEvent>) => void;
  onDragEnd: (e: KonvaEventObject<MouseEvent>) => void;
  isSelected: boolean;
};

const PlayerComponent = ({
  player,
  index,
  config,
  onDragStart,
  onDragEnd,
  isSelected,
}: Props) => {
  const layout = useCanvasStore((state) => state.layout);
  const selectedFont = useCanvasStore((state) => state.selectedFont);
  const fonts = useCanvasStore((state) => state.fonts);
  const canvasDispatch = useCanvasStore((state) => state.dispatch);
  const dispatch = usePlayerStore((state) => state.dispatch);

  const playerConfig = {
    ...layout.basePlayer,
    ...(layout.players[index] ?? {}),
  };

  const handleDragEnd = useCallback(
    (e: KonvaEventObject<MouseEvent>) => {
      canvasDispatch({
        type: "UPDATE_PLAYER_CONFIG",
        payload: {
          index,
          config: {
            ...config,
            position: { x: e.target.x(), y: e.target.y() },
          },
        },
      });
      onDragEnd(e);
    },
    [onDragEnd, index, config, canvasDispatch]
  );

  const handleGroupClick = useCallback(
    (e: KonvaEventObject<MouseEvent>) => {
      e.cancelBubble = true;
      dispatch({ type: "SET_SELECTED_PLAYER_INDEX", payload: index });
    },
    [index, dispatch]
  );

  const dragBoundFunc = useCallback(
    (pos: Vector2d) => {
      return {
        x: Math.max(
          0,
          Math.min(
            pos.x,
            layout?.canvas.size.width -
              (playerConfig.size?.width ?? 0) * (playerConfig.scale?.x ?? 1)
          )
        ),
        y: Math.max(
          0,
          Math.min(
            pos.y,
            layout?.canvas.size.height -
              (playerConfig.size?.height ?? 0) * (playerConfig.scale?.y ?? 1)
          )
        ),
      };
    },
    [
      layout?.canvas.size.width,
      layout?.canvas.size.height,
      playerConfig.size?.width,
      playerConfig.size?.height,
      playerConfig.scale?.x,
      playerConfig.scale?.y,
    ]
  );

  const fontFamily = fonts[selectedFont] === "loaded" ? selectedFont : "Arial";

  const konvaElements = useMemo(
    () =>
      createKonvaElements(config.elements ?? [], {
        fontFamily,
        player: { ...player, placement: index + 1 },
        containerSize: {
          width: playerConfig.size?.width,
          height: playerConfig.size?.height,
        },
      }),
    [config.elements, fontFamily, player, index, playerConfig.size]
  );

  return (
    <SelectableElement
      id={player.id}
      draggable={isSelected}
      x={playerConfig.position?.x}
      y={playerConfig.position?.y}
      width={playerConfig.size?.width}
      height={playerConfig.size?.height}
      scaleX={playerConfig.scale?.x}
      scaleY={playerConfig.scale?.y}
      rotation={playerConfig.rotation ?? 0}
      onClick={handleGroupClick}
      onDragEnd={handleDragEnd}
      onDragStart={onDragStart}
      dragBoundFunc={dragBoundFunc}
      name={player.id}
    >
      {konvaElements}
    </SelectableElement>
  );
};

export const Player = memo(PlayerComponent, (prevProps, nextProps) => {
  return (
    prevProps.index === nextProps.index &&
    isEqual(prevProps.player, nextProps.player) &&
    isEqual(prevProps.config, nextProps.config) &&
    prevProps.isSelected === nextProps.isSelected
  );
});
