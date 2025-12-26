import { useEffect, lazy, Suspense } from "react";

import { preloadCharacterImages } from "@/utils/top8/preloadCharacterImages";
import { SidePanel } from "@/components/top8/SidePanel/SidePanel";
import { Header } from "@/components/top8/Ranker/Header/Header";
import { Skeleton } from "@/components/shared/Skeleton/Skeleton";

import styles from "./Ranker.module.scss";

// TODO: Create layout creator tool & graphic generator tool
// TODO: Background Editor?
// TODO: Tournament Searcher
// TODO: Site light theme?

const Canvas = lazy(() =>
  import("@/components/top8/Canvas/Canvas").then((module) => ({
    default: module.Canvas,
  }))
);

export const Ranker = () => {
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

  return (
    <div className={styles.root}>
      <Header />

      <div className={styles.body}>
        <SidePanel className={styles.sidePanel} />

        <Suspense fallback={<Skeleton className={styles.canvas} />}>
          <Canvas className={styles.canvas} />
        </Suspense>
      </div>
    </div>
  );
};
