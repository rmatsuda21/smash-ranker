import { useCallback, useEffect, useRef, useState } from "react";
import Konva from "konva";

import { useFetchTop8 } from "@/hooks/top8/useFetchTop8";
import { Canvas } from "@/components/top8/Canvas/Canvas";
import { PlayerInfo } from "@/types/top8/Result";
import { CanvasConfig } from "@/components/top8/CanvasConfig/CanvasConfig";
import { PlayerList } from "@/components/top8/PlayerList/PlayerList";

import styles from "./Ranker.module.scss";
import { PlayerForm } from "../PlayerForm/PlayerForm";

const CANVAS_DIMENSIONS = {
  width: 1920,
  height: 1080,
};

const DISPLAY_SCALE = 0.5;

const DEFAULT_PLAYER: PlayerInfo = {
  id: `0`,
  name: `Player Name`,
  characterId: `1453`,
  alt: 0,
};

export const Ranker = () => {
  const [selectedIndex, setSelectedIndex] = useState<number>();
  const [players, setPlayers] = useState<PlayerInfo[]>(
    Array.from({ length: 8 }).map((_) => ({
      ...DEFAULT_PLAYER,
    }))
  );
  const stageRef = useRef<Konva.Stage>(null);

  const { top8, fetching, error } = useFetchTop8(
    "tournament/genesis-9-1/event/ultimate-singles"
  );

  const updatePlayer = useCallback((index: number, player: PlayerInfo) => {
    console.log(index, player);
    setPlayers((prevPlayers) =>
      prevPlayers?.map((p, i) => (i === index ? player : p))
    );
  }, []);

  useEffect(() => {
    if (top8 && !error) {
      setPlayers(top8);
    }
  }, [top8]);

  if (fetching) return <div>Loading...</div>;
  if (!top8 || error)
    return <div>{error ? <h1>{error.message}</h1> : <h1>Error</h1>}</div>;

  if (!players) return <div>No players</div>;

  const selectedPlayer =
    selectedIndex !== undefined ? players[selectedIndex] : null;

  return (
    <div className={styles.root}>
      <div className={styles.content}>
        <h1>Ranker</h1>

        <div
          className={styles.body}
          style={
            {
              "--canvas-width": CANVAS_DIMENSIONS.width * DISPLAY_SCALE + "px",
              "--canvas-height":
                CANVAS_DIMENSIONS.height * DISPLAY_SCALE + "px",
            } as React.CSSProperties
          }
        >
          <div>
            <PlayerList
              className={styles.playerList}
              players={players}
              setPlayers={setPlayers}
              selectedIndex={selectedIndex}
              setSelectedIndex={setSelectedIndex}
            />
            <PlayerForm
              index={selectedIndex}
              selectedPlayer={selectedPlayer}
              updatePlayer={updatePlayer}
            />
          </div>

          <Canvas
            players={players}
            setSelectedIndex={setSelectedIndex}
            selectedIndex={selectedIndex}
            size={CANVAS_DIMENSIONS}
            displayScale={DISPLAY_SCALE}
            stageRef={stageRef}
          />
        </div>

        <CanvasConfig stageRef={stageRef} />
      </div>
    </div>
  );
};
