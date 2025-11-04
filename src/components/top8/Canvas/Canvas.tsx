import { useEffect } from "react";
import Konva from "konva";
import { Stage, Layer } from "react-konva";

import { Player } from "@/components/top8/Canvas/Player";
import { PlayerInfo } from "@/types/top8/Result";

// import styles from "./Canvas.module.scss";

type Props = {
  players: PlayerInfo[];
  setSelectedPlayerId: (playerId: string) => void;
  selectedPlayerId?: string;
  size?: { width: number; height: number };
  displayScale?: number;
};

export const Canvas = ({
  players,
  setSelectedPlayerId,
  selectedPlayerId,
  size = { width: 1920, height: 1080 },
  displayScale = 0.5,
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
      style={{
        width: `${size.width * displayScale}px`,
        height: `${size.height * displayScale}px`,
        overflow: "hidden",
        border: "1px solid #ccc",
      }}
    >
      <Stage
        width={size.width}
        height={size.height}
        scaleX={displayScale}
        scaleY={displayScale}
        onClick={handleStageClick}
      >
        <Layer>
          {players?.map((player, index) => (
            <Player
              placement={index + 1}
              position={{ x: index * 100, y: index * 100 }}
              key={player.id}
              player={player}
              setSelectedPlayerId={setSelectedPlayerId}
              isSelected={selectedPlayerId === player.id}
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
};
