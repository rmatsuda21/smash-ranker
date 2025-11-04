import { useEffect } from "react";
import { Stage, Layer } from "react-konva";
import Konva from "konva";

import { Player } from "@/components/top8/Canvas/Player";
import { PlayerInfo } from "@/types/top8/Result";

import styles from "./Canvas.module.scss";

type Props = {
  players: PlayerInfo[];
  setSelectedPlayerId: (playerId: string) => void;
  selectedPlayerId?: string;
  size?: { width: number; height: number };
  displayScale?: number;
  stageRef: React.RefObject<Konva.Stage | null>;
};

export const Canvas = ({
  players,
  setSelectedPlayerId,
  selectedPlayerId,
  size = { width: 1920, height: 1080 },
  displayScale = 0.5,
  stageRef,
}: Props) => {
  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.target === e.target.getStage()) {
      setSelectedPlayerId("");
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedPlayerId("");
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
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
          <Layer>
            {players?.map((player, index) => (
              <Player
                key={`player-${index}`}
                placement={index + 1}
                position={{ x: index * 100, y: index * 100 }}
                player={player}
                setSelectedPlayerId={setSelectedPlayerId}
                isSelected={selectedPlayerId === player.id}
              />
            ))}
          </Layer>
        </Stage>
      </div>
    </div>
  );
};
