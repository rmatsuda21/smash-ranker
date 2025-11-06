import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { Stage, Layer } from "react-konva";
import Konva from "konva";

import { Player } from "@/components/top8/Canvas/Player";
import { PlayerInfo } from "@/types/top8/Result";
import { CanvasConfig } from "@/types/top8/Canvas";

import styles from "./Canvas.module.scss";

type Props = {
  players: PlayerInfo[];
  setSelectedIndex: (index: number | undefined) => void;
  selectedIndex?: number;
  size?: { width: number; height: number };
  displayScale?: number;
  stageRef: React.RefObject<Konva.Stage | null>;
};

const PlayerLayer = ({
  ref,
  players,
  setSelectedIndex,
  selectedIndex,
  canvasConfig,
  onPlayerDragStart,
  onPlayerDragEnd,
}: {
  ref: React.RefObject<Konva.Layer | null>;
  players: PlayerInfo[];
  setSelectedIndex: (index: number | undefined) => void;
  selectedIndex?: number;
  canvasConfig: CanvasConfig;
  onPlayerDragStart: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onPlayerDragEnd: (e: Konva.KonvaEventObject<MouseEvent>) => void;
}) => {
  return (
    <Layer ref={ref}>
      {players?.map((player, index) => (
        <Player
          key={`player-${index}`}
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
      ))}
    </Layer>
  );
};

const MemoizedPlayerLayer = memo(PlayerLayer);

export const Canvas = ({
  players,
  setSelectedIndex,
  selectedIndex,
  size = { width: 1920, height: 1080 },
  displayScale = 0.5,
  stageRef,
}: Props) => {
  const dragLayerRef = useRef<Konva.Layer>(null);
  const mainLayerRef = useRef<Konva.Layer>(null);

  const handleStageClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (e.target === e.target.getStage()) {
        setSelectedIndex(undefined);
      }
    },
    [setSelectedIndex]
  );

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

  const canvasConfig: CanvasConfig = useMemo(
    () => ({
      size,
      displayScale,
    }),
    [size, displayScale]
  );

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
          <MemoizedPlayerLayer
            ref={mainLayerRef}
            players={players}
            setSelectedIndex={setSelectedIndex}
            selectedIndex={selectedIndex}
            canvasConfig={canvasConfig}
            onPlayerDragStart={onPlayerDragStart}
            onPlayerDragEnd={onPlayerDragEnd}
          />

          <Layer ref={dragLayerRef}></Layer>
        </Stage>
      </div>
    </div>
  );
};
