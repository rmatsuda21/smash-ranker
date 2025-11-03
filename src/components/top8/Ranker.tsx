import { useEffect, useState } from "react";

import { useFetchTop8 } from "@/hooks/top8/useFetchTop8";
import { Canvas } from "@/components/top8/Canvas/Canvas";
import { PlayerInfo, Result } from "@/types/top8/Result";
import { CanvasConfig } from "@/components/top8/CanvasConfig/CanvasConfig";
import { PlayerForm } from "@/components/top8/PlayerForm/PlayerForm";

import styles from "@/components/styles/Top8/Ranker.module.scss";

export const Ranker = () => {
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerInfo | null>(null);
  const [players, setPlayers] = useState<Result | null>(null);

  const { top8, fetching, error } = useFetchTop8(
    "tournament/genesis-9-1/event/ultimate-singles"
  );

  const updatePlayer = (player: PlayerInfo) => {
    if (!players) return;
    setPlayers(players.map((p) => (p.id === player.id ? player : p)));
  };

  useEffect(() => {
    setPlayers(top8);
  }, [top8]);

  if (fetching) return <div>Loading...</div>;
  if (!top8 || error)
    return <div>{error ? <h1>{error.message}</h1> : <h1>Error</h1>}</div>;

  return (
    <div className={styles.root}>
      <div className={styles.content}>
        <h1>Ranker</h1>

        <div className={styles.canvasContainer}>
          <Canvas
            players={players}
            setSelectedPlayer={setSelectedPlayer}
            selectedPlayer={selectedPlayer}
          />
        </div>

        <PlayerForm
          selectedPlayer={selectedPlayer as PlayerInfo}
          updatePlayer={updatePlayer}
        />
        <CanvasConfig />
      </div>
    </div>
  );
};
