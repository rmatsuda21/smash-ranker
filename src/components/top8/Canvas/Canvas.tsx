import { useCallback, useEffect, useRef, useState } from "react";
import { Stage, Layer } from "react-konva";
import Konva from "konva";

import { Player } from "@/components/top8/Canvas/Player";
import { fetchAndColorSVG } from "@/utils/top8/fetchAndColorSVG";
import { CustomImage } from "@/components/top8/Canvas/CustomImage";
import { useCanvasStore } from "@/store/canvasStore";
import backgroundImage from "/assets/top8/theme/wtf/background.svg";
import { usePlayerStore } from "@/store/playerStore";

import styles from "./Canvas.module.scss";

type Props = {
  stageRef: React.RefObject<Konva.Stage | null>;
};

type PlayerLayerProps = {
  ref: React.RefObject<Konva.Layer | null>;
  onPlayerDragStart: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onPlayerDragEnd: (e: Konva.KonvaEventObject<MouseEvent>) => void;
};

const PlayerLayer = ({
  ref,
  onPlayerDragStart,
  onPlayerDragEnd,
}: PlayerLayerProps) => {
  const { players, playerOrder } = usePlayerStore();

  return (
    <Layer ref={ref}>
      {playerOrder.map((playerIndex, index) => {
        const player = players[playerIndex];
        if (!player) return null;

        return (
          <Player
            key={player.id}
            placement={index + 1}
            size={{ width: 400, height: 400 }}
            position={{
              x: Math.floor(index / 2) * 400,
              y: Math.floor(index % 2) * 400,
            }}
            player={player}
            index={index}
            onDragStart={onPlayerDragStart}
            onDragEnd={onPlayerDragEnd}
          />
        );
      })}
    </Layer>
  );
};

export const Canvas = ({ stageRef }: Props) => {
  const { dispatch } = usePlayerStore();

  const dragLayerRef = useRef<Konva.Layer>(null);
  const mainLayerRef = useRef<Konva.Layer>(null);
  const [backgroundImageSrc, setBackgroundImageSrc] = useState<string>();

  const { size: canvasSize, displayScale } = useCanvasStore();

  const handleStageClick = useCallback(() => {
    dispatch({ type: "CLEAR_SELECTED_PLAYER" });
  }, [dispatch]);

  const onPlayerDragStart = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      const player = e.target;

      if (player) {
        player.moveTo(dragLayerRef.current);
      }
    },
    []
  );

  const onPlayerDragEnd = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      const player = e.target;

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
    const fetchBackgroundImageSrc = async () => {
      const url = await fetchAndColorSVG(backgroundImage, "rgba(0, 0, 0, 0.8)");
      if (url) {
        setBackgroundImageSrc(url);
      }
    };
    fetchBackgroundImageSrc();
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
          width={canvasSize.width}
          height={canvasSize.height}
          onClick={handleStageClick}
          ref={stageRef}
          className={styles.canvas}
        >
          <Layer onClick={handleStageClick}>
            <CustomImage
              width={canvasSize.width}
              height={canvasSize.height}
              imageSrc={backgroundImageSrc ?? ""}
            />
          </Layer>
          <Layer ref={dragLayerRef}></Layer>
          <PlayerLayer
            ref={mainLayerRef}
            onPlayerDragStart={onPlayerDragStart}
            onPlayerDragEnd={onPlayerDragEnd}
          />
        </Stage>
      </div>
    </div>
  );
};
