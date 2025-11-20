import { useEffect, lazy, Suspense } from "react";

import { TournamentConfig } from "@/components/top8/TournamentConfig/TournamentConfig";
import { preloadCharacterImages } from "@/utils/top8/preloadCharacterImages";
import { usePlayerStore } from "@/store/playerStore";
import { useCanvasStore } from "@/store/canvasStore";

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

const PlayerList = lazy(() =>
  import("@/components/top8/PlayerList/PlayerList").then((module) => ({
    default: module.PlayerList,
  }))
);
const PlayerForm = lazy(() =>
  import("@/components/top8/PlayerForm/PlayerForm").then((module) => ({
    default: module.PlayerForm,
  }))
);

export const Ranker = () => {
  const players = usePlayerStore((state) => state.players);
  const error = usePlayerStore((state) => state.error);
  const canvasSize = useCanvasStore((state) => state.size);
  const canvasDisplayScale = useCanvasStore((state) => state.displayScale);

  useEffect(() => {
    preloadCharacterImages();
  }, []);

  if (!players || error)
    return <div>{error ? <h1>{error}</h1> : <h1>Error</h1>}</div>;

  return (
    <div className={styles.root}>
      <div className={styles.content}>
        <h1>Ranker</h1>

        <div className={styles.body}>
          <div className={styles.playerConfig}>
            <Suspense fallback={<div>Loading Player List...</div>}>
              <PlayerList />
            </Suspense>
            <Suspense fallback={<div>Loading Player Form...</div>}>
              <PlayerForm />
            </Suspense>
          </div>
          <Suspense
            fallback={
              <div
                style={{
                  width: `calc(${canvasSize.width}px * ${canvasDisplayScale})`,
                  height: `calc(${canvasSize.height}px * ${canvasDisplayScale})`,
                  maxWidth: `calc(${canvasSize.width}px * ${canvasDisplayScale})`,
                  maxHeight: `calc(${canvasSize.height}px * ${canvasDisplayScale})`,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                Loading Canvas...
              </div>
            }
          >
            <Canvas />
          </Suspense>
        </div>

        <Suspense fallback={<div>Loading Config...</div>}>
          <CanvasConfig />
        </Suspense>

        <TournamentConfig />
      </div>
    </div>
  );
};
