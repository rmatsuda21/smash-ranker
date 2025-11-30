import { useCallback, useEffect, useRef } from "react";
import { Stage, Layer } from "react-konva";
import { Stage as KonvaStage } from "konva/lib/Stage";
import { Layer as KonvaLayer } from "konva/lib/Layer";
import cn from "classnames";

import { useCanvasStore } from "@/store/canvasStore";
import { usePlayerStore } from "@/store/playerStore";
import { BackgroundLayer } from "@/components/top8/Canvas/BackgroundLayer";
import { PlayerLayer } from "@/components/top8/Canvas/PlayerLayer";
import { TournamentLayer } from "@/components/top8/Canvas/TournamentLayer";
import { simpleLayout } from "@/layouts/simple";

import styles from "./Canvas.module.scss";
import { KonvaEventObject } from "konva/lib/Node";

type Props = {
  className?: string;
};

export const Canvas = ({ className }: Props) => {
  const stageRef = useRef<KonvaStage>(null);
  const dragLayerRef = useRef<KonvaLayer>(null);
  const mainLayerRef = useRef<KonvaLayer>(null);

  const layout = useCanvasStore((state) => state.layout);
  const canvasDispatch = useCanvasStore((state) => state.dispatch);

  const dispatch = usePlayerStore((state) => state.dispatch);

  const handleStageClick = useCallback(() => {
    dispatch({ type: "CLEAR_SELECTED_PLAYER" });
  }, [dispatch]);

  const onPlayerDragStart = useCallback((e: KonvaEventObject<MouseEvent>) => {
    const player = e.target;
    const playerId = player.name();
    const transformer = player.parent?.findOne(`.transformer-${playerId}`);
    if (transformer) {
      transformer.moveTo(dragLayerRef.current);
    }

    if (player) {
      player.moveTo(dragLayerRef.current);
    }
  }, []);

  const onPlayerDragEnd = useCallback((e: KonvaEventObject<MouseEvent>) => {
    const player = e.target;
    const playerId = player.name();
    const transformer = player.parent?.findOne(`.transformer-${playerId}`);
    if (transformer) {
      transformer.moveTo(mainLayerRef.current);
    }

    if (player) {
      player.moveTo(mainLayerRef.current);
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        dispatch({ type: "CLEAR_SELECTED_PLAYER" });
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [dispatch]);

  useEffect(() => {
    canvasDispatch({ type: "SET_LAYOUT", payload: simpleLayout });
  }, [canvasDispatch]);

  useEffect(() => {
    if (stageRef.current) {
      canvasDispatch({ type: "SET_STAGE_REF", payload: stageRef.current });
    }
    return () => {
      canvasDispatch({ type: "SET_STAGE_REF", payload: null });
    };
  }, [canvasDispatch]);

  return (
    <div
      style={
        {
          "--canvas-width": `${layout?.canvas.size.width}px`,
          "--canvas-height": `${layout?.canvas.size.height}px`,
          "--display-scale": `${layout?.canvas.displayScale ?? 0.5}`,
        } as React.CSSProperties
      }
      className={cn(className, styles.canvasContainer)}
    >
      <div className={styles.canvasWrapper}>
        <Stage
          ref={stageRef}
          id="top8-canvas-stage"
          width={layout?.canvas.size.width}
          height={layout?.canvas.size.height}
          onClick={handleStageClick}
          className={styles.canvas}
        >
          <BackgroundLayer onClick={handleStageClick} />

          <PlayerLayer
            ref={mainLayerRef}
            onPlayerDragStart={onPlayerDragStart}
            onPlayerDragEnd={onPlayerDragEnd}
          />

          <TournamentLayer />

          <Layer ref={dragLayerRef}></Layer>
        </Stage>
      </div>
    </div>
  );
};
