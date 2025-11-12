import { useEffect } from "react";

import { useFetchTop8 } from "@/hooks/top8/useFetchTop8";
import { Canvas } from "@/components/top8/Canvas/Canvas";
import { CanvasConfig } from "@/components/top8/CanvasConfig/CanvasConfig";
import { PlayerList } from "@/components/top8/PlayerList/PlayerList";
import { usePlayerStore } from "@/store/playerStore";
import { PlayerForm } from "@/components/top8/PlayerForm/PlayerForm";

import styles from "./Ranker.module.scss";

export const Ranker = () => {
  const dispatch = usePlayerStore((state) => state.dispatch);

  const { top8, fetching, error } = useFetchTop8(
    // "tournament/genesis-9-1/event/ultimate-singles"
    "tournament/smash-sans-fronti-res-271/event/smash-ultimate-singles"
  );

  useEffect(() => {
    if (top8 && !error) {
      dispatch({ type: "SET_PLAYERS", payload: top8 });
    }
  }, [top8, dispatch]);

  if (fetching) return <div>Loading...</div>;
  if (!top8 || error)
    return <div>{error ? <h1>{error}</h1> : <h1>Error</h1>}</div>;

  return (
    <div className={styles.root}>
      <div className={styles.content}>
        <h1>Ranker</h1>

        <div className={styles.body}>
          <div>
            <PlayerList className={styles.playerList} />
            <PlayerForm />
          </div>

          <Canvas />
        </div>

        <CanvasConfig />
      </div>
    </div>
  );
};
