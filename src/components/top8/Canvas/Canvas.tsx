import { useEffect } from "react";
import Konva from "konva";
import { Stage, Layer } from "react-konva";

import { Player } from "@/components/top8/Canvas/Player";
import { PlayerInfo } from "@/types/top8/Result";

// import styles from "./Canvas.module.scss";

const CANVAS_WIDTH = 1920;
const CANVAS_HEIGHT = 1080;
const DISPLAY_SCALE = 0.5;

type Props = {
  players: PlayerInfo[] | null;
  setSelectedPlayer: (player: PlayerInfo | null) => void;
  selectedPlayer: PlayerInfo | null;
};

export const Canvas = ({
  players,
  setSelectedPlayer,
  selectedPlayer,
}: Props) => {
  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.target === e.target.getStage()) {
      setSelectedPlayer(null);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedPlayer(null);
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
        width: `${CANVAS_WIDTH * DISPLAY_SCALE}px`,
        height: `${CANVAS_HEIGHT * DISPLAY_SCALE}px`,
        overflow: "hidden",
        border: "1px solid #ccc",
      }}
    >
      <Stage
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        scaleX={DISPLAY_SCALE}
        scaleY={DISPLAY_SCALE}
        onClick={handleStageClick}
      >
        <Layer>
          {players?.map((player, index) => (
            <Player
              placement={index + 1}
              position={{ x: index * 100, y: index * 100 }}
              key={player.id}
              player={player}
              setSelectedPlayer={setSelectedPlayer}
              isSelected={selectedPlayer?.id === player.id}
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
};
