import { useEffect, useState } from "react";

import { useFetchTop8 } from "@/hooks/top8/useFetchTop8";
import { Canvas } from "@/components/top8/Canvas/Canvas";
import { PlayerInfo } from "@/types/top8/Result";
import { CanvasConfig } from "@/components/top8/CanvasConfig/CanvasConfig";
import { PlayerList } from "@/components/top8/PlayerList/PlayerList";

import styles from "./Ranker.module.scss";

const CANVAS_WIDTH = 1920;
const CANVAS_HEIGHT = 1080;
const DISPLAY_SCALE = 0.5;

export const Ranker = () => {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>();
  const [players, setPlayers] = useState<PlayerInfo[]>();

  const { top8, fetching, error } = useFetchTop8(
    "tournament/genesis-9-1/event/ultimate-singles"
  );

  const updatePlayer = (player: PlayerInfo) => {
    setPlayers(players?.map((p) => (p.id === player.id ? player : p)));
  };

  useEffect(() => {
    setPlayers(top8);
  }, [top8]);

  if (fetching) return <div>Loading...</div>;
  if (!top8 || error)
    return <div>{error ? <h1>{error.message}</h1> : <h1>Error</h1>}</div>;

  if (!players) return <div>No players</div>;

  return (
    <div className={styles.root}>
      <div className={styles.content}>
        <h1>Ranker</h1>

        <div
          className={styles.body}
          style={
            {
              "--canvas-width": CANVAS_WIDTH * DISPLAY_SCALE + "px",
              "--canvas-height": CANVAS_HEIGHT * DISPLAY_SCALE + "px",
            } as React.CSSProperties
          }
        >
          <PlayerList
            className={styles.playerList}
            players={players}
            setPlayers={setPlayers}
            selectedPlayerId={selectedPlayerId}
            updatePlayer={updatePlayer}
            setSelectedPlayerId={setSelectedPlayerId}
          />

          <Canvas
            players={players}
            setSelectedPlayerId={setSelectedPlayerId}
            selectedPlayerId={selectedPlayerId}
            size={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
            displayScale={DISPLAY_SCALE}
          />
        </div>

        <CanvasConfig />
      </div>
    </div>
  );
};
