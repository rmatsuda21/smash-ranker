import { useEffect, lazy, Suspense } from "react";
import { FaTriangleExclamation } from "react-icons/fa6";

import { preloadCharacterImages } from "@/utils/top8/preloadCharacterImages";
import { usePlayerStore } from "@/store/playerStore";
import { SidePanel } from "@/components/top8/SidePanel/SidePanel";
import { Header } from "@/components/top8/Ranker/Header/Header";
import { Skeleton } from "@/components/shared/Skeleton/Skeleton";

import styles from "./Ranker.module.scss";

// TODO: Create layout creator tool & graphic generator tool

const Canvas = lazy(() =>
  import("@/components/top8/Canvas/Canvas").then((module) => ({
    default: module.Canvas,
  }))
);

export const Ranker = () => {
  const error = usePlayerStore((state) => state.error);

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

  if (error) {
    return (
      <div className={styles.error}>
        <h1>
          <FaTriangleExclamation /> Error <FaTriangleExclamation />
        </h1>
        <h2>Please refresh the page.</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <Header />
      </div>
      <div className={styles.body}>
        <SidePanel className={styles.sidePanel} />

        <Suspense fallback={<Skeleton className={styles.canvas} />}>
          <Canvas className={styles.canvas} />
        </Suspense>
      </div>
    </div>
  );
};
