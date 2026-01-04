import { useCallback, useMemo, memo } from "react";
import { Vector2d } from "konva/lib/types";
import { KonvaEventObject } from "konva/lib/Node";
import isEqual from "lodash/isEqual";

import { PlayerInfo } from "@/types/top8/Player";
import { useCanvasStore } from "@/store/canvasStore";
import { usePlayerStore } from "@/store/playerStore";
import { type Design, PlayerDesign } from "@/types/top8/Design";
import { createKonvaElements } from "@/utils/top8/elementFactory";
import { SelectableElement } from "@/components/top8/Canvas/SelectableElement";
import { useEditorStore } from "@/store/editorStore";
import { EditorTab } from "@/types/top8/Editor";

type Props = {
  player: PlayerInfo;
  canvasSize: Design["canvasSize"];
  design: Pick<Design, "colorPalette" | "textPalette" | "bgAssetId">;
  config: PlayerDesign;
  index: number;
  onDragStart: (e: KonvaEventObject<MouseEvent>) => void;
  onDragEnd: (e: KonvaEventObject<MouseEvent>) => void;
  fontFamily: string;
  editable: boolean;
};

const PlayerComponent = ({
  player,
  canvasSize,
  design,
  index,
  config,
  onDragStart,
  onDragEnd,
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
        payload: EditorTab.PLAYERS,
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
            canvasSize.width -
              (config.size?.width ?? 0) * (config.scale?.x ?? 1)
          )
        ),
        y: Math.max(
          0,
          Math.min(
            pos.y,
            canvasSize.height -
              (config.size?.height ?? 0) * (config.scale?.y ?? 1)
          )
        ),
      };
    },
    [canvasSize.width, canvasSize.height, config.size, config.scale]
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
        design,
      }),
    [config.elements, fontFamily, player, config.size, design]
  );

  return (
    <SelectableElement
      id={player.id}
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
    isEqual(prevProps.canvasSize, nextProps.canvasSize) &&
    isEqual(prevProps.design, nextProps.design) &&
    prevProps.fontFamily === nextProps.fontFamily &&
    prevProps.editable === nextProps.editable
  );
});
