import { useCallback, useMemo, memo } from "react";
import { Vector2d } from "konva/lib/types";
import { KonvaEventObject } from "konva/lib/Node";
import isEqual from "lodash/isEqual";

import { PlayerInfo } from "@/types/top8/PlayerTypes";
import { useCanvasStore } from "@/store/canvasStore";
import { usePlayerStore } from "@/store/playerStore";
import { CanvasConfig, PlayerLayoutConfig } from "@/types/top8/LayoutTypes";
import { createKonvaElements } from "@/utils/top8/elementFactory";
import { SelectableElement } from "@/components/top8/Canvas/SelectableElement";
import { useEditorStore } from "@/store/editorStore";
import { EditorTab } from "@/types/top8/EditorTypes";

type Props = {
  player: PlayerInfo;
  canvasConfig: CanvasConfig;
  config: PlayerLayoutConfig;
  index: number;
  onDragStart: (e: KonvaEventObject<MouseEvent>) => void;
  onDragEnd: (e: KonvaEventObject<MouseEvent>) => void;
  isSelected: boolean;
  fontFamily: string;
  editable: boolean;
};

const PlayerComponent = ({
  player,
  canvasConfig,
  index,
  config,
  onDragStart,
  onDragEnd,
  isSelected,
  fontFamily,
  editable,
}: Props) => {
  const dispatch = usePlayerStore((state) => state.dispatch);
  const canvasDispatch = useCanvasStore((state) => state.dispatch);
  const editorDispatch = useEditorStore((state) => state.dispatch);

  // const isUsingBaseElements = !!layout.players[index]?.elements;

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
      editorDispatch({
        type: "SET_ACTIVE_TAB",
        payload: EditorTab.PLAYER_FORM,
      });
    },
    [index, dispatch, editorDispatch]
  );

  const dragBoundFunc = useCallback(
    (pos: Vector2d) => {
      return {
        x: Math.max(
          0,
          Math.min(
            pos.x,
            canvasConfig.size.width -
              (config.size?.width ?? 0) * (config.scale?.x ?? 1)
          )
        ),
        y: Math.max(
          0,
          Math.min(
            pos.y,
            canvasConfig.size.height -
              (config.size?.height ?? 0) * (config.scale?.y ?? 1)
          )
        ),
      };
    },
    [canvasConfig.size, config.size, config.scale]
  );

  const konvaElements = useMemo(
    () =>
      createKonvaElements(config.elements ?? [], {
        fontFamily,
        player,
        containerSize: {
          width: config.size?.width,
          height: config.size?.height,
        },
        canvas: canvasConfig,
      }),
    [config.elements, fontFamily, player, config.size, canvasConfig]
  );

  return (
    <SelectableElement
      id={player.id}
      isSelected={isSelected}
      draggable={editable}
      x={config.position?.x}
      y={config.position?.y}
      width={config.size?.width}
      height={config.size?.height}
      scaleX={config.scale?.x}
      scaleY={config.scale?.y}
      rotation={config.rotation ?? 0}
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
    isEqual(prevProps.canvasConfig, nextProps.canvasConfig) &&
    prevProps.fontFamily === nextProps.fontFamily &&
    prevProps.editable === nextProps.editable &&
    prevProps.isSelected === nextProps.isSelected
  );
});
