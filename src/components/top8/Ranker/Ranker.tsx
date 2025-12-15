import { useEffect, lazy, Suspense } from "react";

import { preloadCharacterImages } from "@/utils/top8/preloadCharacterImages";
import { usePlayerStore } from "@/store/playerStore";
import { useCanvasStore } from "@/store/canvasStore";
import { SidePanel } from "@/components/top8/SidePanel/SidePanel";

import styles from "./Ranker.module.scss";
import { Skeleton } from "@radix-ui/themes";

// TODO: Create layout creator tool & graphic generator tool

const Canvas = lazy(() =>
  import("@/components/top8/Canvas/Canvas").then((module) => ({
    default: module.Canvas,
  }))
);

export const Ranker = () => {
  const players = usePlayerStore((state) => state.players);
  const error = usePlayerStore((state) => state.error);
  const layout = useCanvasStore((state) => state.layout);

  useEffect(() => {
    preloadCharacterImages();
  }, []);

  // Page refresh safe check
  useEffect(() => {
    if (import.meta.env.DEV) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  if (!players || error)
    return <div>{error ? <h1>{error}</h1> : <h1>Error</h1>}</div>;

  return (
    <div className={styles.root}>
      <h1>Ranker</h1>

      <div className={styles.body}>
        <SidePanel className={styles.sidePanel} />

        <Suspense
          fallback={
            <Skeleton
              style={{
                width: `calc(${layout?.canvas.size.width}px * ${layout?.canvas.displayScale})`,
                height: `calc(${layout?.canvas.size.height}px * ${layout?.canvas.displayScale})`,
                minWidth: `calc(${layout?.canvas.size.width}px * ${layout?.canvas.displayScale})`,
                minHeight: `calc(${layout?.canvas.size.height}px * ${layout?.canvas.displayScale})`,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            />
          }
        >
          <Canvas />
        </Suspense>
      </div>
    </div>
  );
};
