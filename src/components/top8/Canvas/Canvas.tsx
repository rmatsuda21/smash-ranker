import { memo, useCallback, useEffect, useRef, useState } from "react";
import { Stage, Layer } from "react-konva";
import Konva from "konva";

import { Player } from "@/components/top8/Canvas/Player";
import { PlayerInfo } from "@/types/top8/Result";
import { CanvasConfig } from "@/types/top8/Canvas";
import { fetchAndColorSVG } from "@/utils/top8/fetchAndColorSVG";
import { ContainedImage } from "@/components/top8/Canvas/ContainedImage";

import styles from "./Canvas.module.scss";

import backgroundImage from "/assets/top8/theme/wtf/background.svg";

type Props = {
  players: PlayerInfo[];
  playerOrder: number[];
  setSelectedIndex: (index: number | undefined) => void;
  selectedIndex?: number;
  canvasConfig: CanvasConfig;
  stageRef: React.RefObject<Konva.Stage | null>;
};

type PlayerLayerProps = {
  ref: React.RefObject<Konva.Layer | null>;
  players: PlayerInfo[];
  playerOrder: number[];
  setSelectedIndex: (index: number | undefined) => void;
  selectedIndex?: number;
  canvasConfig: CanvasConfig;
  onPlayerDragStart: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onPlayerDragEnd: (e: Konva.KonvaEventObject<MouseEvent>) => void;
};

const PlayerLayer = ({
  ref,
  players,
  playerOrder,
  setSelectedIndex,
  selectedIndex,
  canvasConfig,
  onPlayerDragStart,
  onPlayerDragEnd,
}: PlayerLayerProps) => {
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
            setSelectedIndex={setSelectedIndex}
            isSelected={selectedIndex === index}
            canvasConfig={canvasConfig}
            onDragStart={onPlayerDragStart}
            onDragEnd={onPlayerDragEnd}
          />
        );
      })}
    </Layer>
  );
};

const MemoizedPlayerLayer = memo(PlayerLayer);

export const Canvas = ({
  players,
  playerOrder,
  setSelectedIndex,
  selectedIndex,
  canvasConfig,
  stageRef,
}: Props) => {
  const dragLayerRef = useRef<Konva.Layer>(null);
  const mainLayerRef = useRef<Konva.Layer>(null);
  const [backgroundImageSrc, setBackgroundImageSrc] = useState<string>();

  const { size, displayScale } = canvasConfig;

  const handleStageClick = useCallback(() => {
    setSelectedIndex(undefined);
  }, [setSelectedIndex]);

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
        setSelectedIndex(undefined);
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
          "--canvas-width": `${size.width}px`,
          "--canvas-height": `${size.height}px`,
          "--display-scale": `${displayScale}`,
        } as React.CSSProperties
      }
      className={styles.canvasContainer}
    >
      <div className={styles.canvasWrapper}>
        <Stage
          width={size.width}
          height={size.height}
          onClick={handleStageClick}
          ref={stageRef}
          className={styles.canvas}
        >
          <Layer onClick={handleStageClick}>
            <ContainedImage
              width={size.width}
              height={size.height}
              imageSrc={backgroundImageSrc ?? ""}
            />
          </Layer>
          <Layer ref={dragLayerRef}></Layer>
          <MemoizedPlayerLayer
            ref={mainLayerRef}
            players={players}
            playerOrder={playerOrder}
            setSelectedIndex={setSelectedIndex}
            selectedIndex={selectedIndex}
            canvasConfig={canvasConfig}
            onPlayerDragStart={onPlayerDragStart}
            onPlayerDragEnd={onPlayerDragEnd}
          />
        </Stage>
      </div>
    </div>
  );
};
