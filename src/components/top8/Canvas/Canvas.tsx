import { useCallback, useEffect, useRef, useState } from "react";
import { Stage, Layer } from "react-konva";
import Konva from "konva";

import { useCanvasStore } from "@/store/canvasStore";
import { LayoutConfig } from "@/types/top8/Layout";
import { usePlayerStore } from "@/store/playerStore";
import { BackgroundLayer } from "@/components/top8/Canvas/BackgroundLayer";
import { PlayerLayer } from "@/components/top8/Canvas/PlayerLayer";
import { TournamentLayer } from "@/components/top8/Canvas/TournamentLayer";

import styles from "./Canvas.module.scss";

export const Canvas = () => {
  const dragLayerRef = useRef<Konva.Layer>(null);
  const mainLayerRef = useRef<Konva.Layer>(null);
  const [layout, setLayout] = useState<LayoutConfig | null>(null);

  const canvasSize = useCanvasStore((state) => state.size);
  const displayScale = useCanvasStore((state) => state.displayScale);
  const canvasDispatch = useCanvasStore((state) => state.dispatch);

  const dispatch = usePlayerStore((state) => state.dispatch);

  const handleStageClick = useCallback(() => {
    dispatch({ type: "CLEAR_SELECTED_PLAYER" });
  }, [dispatch]);

  const onPlayerDragStart = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      const player = e.target;
      const playerId = player.name();
      const transformer = player.parent?.findOne(`.transformer-${playerId}`);
      if (transformer) {
        transformer.moveTo(dragLayerRef.current);
      }

      if (player) {
        player.moveTo(dragLayerRef.current);
      }
    },
    []
  );

  const onPlayerDragEnd = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      const player = e.target;
      const playerId = player.name();
      const transformer = player.parent?.findOne(`.transformer-${playerId}`);
      if (transformer) {
        transformer.moveTo(mainLayerRef.current);
      }

      if (player) {
        player.moveTo(mainLayerRef.current);
      }
    },
    []
  );

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
  }, []);

  useEffect(() => {
    const loadLayout = async () => {
      try {
        const response = await fetch("/layouts/simple.json");
        if (response.ok) {
          const layoutData: LayoutConfig = await response.json();
          setLayout(layoutData);
          canvasDispatch({ type: "SET_SIZE", payload: layoutData.canvasSize });
        }
      } catch (error) {
        console.error("Failed to load layout:", error);
      }
    };
    loadLayout();
  }, []);

  return (
    <div
      style={
        {
          "--canvas-width": `${canvasSize.width}px`,
          "--canvas-height": `${canvasSize.height}px`,
          "--display-scale": `${displayScale}`,
        } as React.CSSProperties
      }
      className={styles.canvasContainer}
    >
      <div className={styles.canvasWrapper}>
        <Stage
          id="top8-canvas-stage"
          width={canvasSize.width}
          height={canvasSize.height}
          onClick={handleStageClick}
          className={styles.canvas}
        >
          <BackgroundLayer onClick={handleStageClick} />

          <PlayerLayer
            ref={mainLayerRef}
            onPlayerDragStart={onPlayerDragStart}
            onPlayerDragEnd={onPlayerDragEnd}
            layout={layout}
          />

          <TournamentLayer />

          <Layer ref={dragLayerRef}></Layer>
        </Stage>
      </div>
    </div>
  );
};
