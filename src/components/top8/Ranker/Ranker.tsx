import { useEffect, lazy, Suspense } from "react";

import { useFetchTop8 } from "@/hooks/top8/useFetchTop8";
import { PlayerList } from "@/components/top8/PlayerList/PlayerList";
import { usePlayerStore } from "@/store/playerStore";
import { PlayerForm } from "@/components/top8/PlayerForm/PlayerForm";
import { preloadCharacterImages } from "@/utils/top8/preloadCharacterImages";

import styles from "./Ranker.module.scss";

const Canvas = lazy(() =>
  import("@/components/top8/Canvas/Canvas").then((module) => ({
    default: module.Canvas,
  }))
);

const CanvasConfig = lazy(() =>
  import("@/components/top8/CanvasConfig/CanvasConfig").then((module) => ({
    default: module.CanvasConfig,
  }))
);

export const Ranker = () => {
  const players = usePlayerStore((state) => state.players);
  const fetching = usePlayerStore((state) => state.fetching);
  const error = usePlayerStore((state) => state.error);

  useFetchTop8(
    // "tournament/genesis-9-1/event/ultimate-singles"
    // "tournament/smash-sans-fronti-res-271/event/smash-ultimate-singles"
    // "tournament/the-buddbuds-local-15/event/ultimate-singles"
    "tournament/coffee-break-11-0/event/ultimate-singles"
  );

  useEffect(() => {
    preloadCharacterImages();
  }, []);

  if (fetching) return <div>Loading...</div>;
  if (!players || error)
    return <div>{error ? <h1>{error}</h1> : <h1>Error</h1>}</div>;

  return (
    <div className={styles.root}>
      <div className={styles.content}>
        <h1>Ranker</h1>

        <div className={styles.body}>
          <div className={styles.playerConfig}>
            <PlayerList />
            <PlayerForm />
          </div>
          <Suspense fallback={<div>Loading Canvas...</div>}>
            <Canvas className={styles.canvas} />
          </Suspense>
        </div>

        <Suspense fallback={<div>Loading Config...</div>}>
          <CanvasConfig />
        </Suspense>
      </div>
    </div>
  );
};
