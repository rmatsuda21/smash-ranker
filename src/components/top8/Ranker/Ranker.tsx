import { useEffect, useCallback, lazy, Suspense } from "react";
import cn from "classnames";
import { FaChevronUp, FaChevronDown } from "react-icons/fa6";

import { preloadCharacterImages } from "@/utils/top8/preloadCharacterImages";
import { isMobile } from "@/utils/isMobile";
import { useEditorStore } from "@/store/editorStore";
import { SidePanel } from "@/components/top8/SidePanel/SidePanel";
import { Header } from "@/components/top8/Ranker/Header/Header";
import { Skeleton } from "@/components/shared/Skeleton/Skeleton";

import styles from "./Ranker.module.scss";

const Canvas = lazy(() =>
  import("@/components/top8/Canvas/Canvas").then((module) => ({
    default: module.Canvas,
  }))
);

export const Ranker = () => {
  const isCanvasExpanded = useEditorStore((s) => s.isCanvasExpanded);
  const dispatch = useEditorStore((s) => s.dispatch);
  const mobile = isMobile();

  const toggleCanvas = useCallback(() => {
    dispatch({ type: "TOGGLE_CANVAS_EXPANDED" });
  }, [dispatch]);

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
        {mobile && (
          <button className={styles.canvasToggle} onClick={toggleCanvas}>
            {isCanvasExpanded ? <FaChevronDown /> : <FaChevronUp />}
          </button>
        )}
        <div
          className={cn(styles.canvasWrapper, {
            [styles.canvasCollapsed]: mobile && !isCanvasExpanded,
          })}
        >
          <Suspense fallback={<Skeleton className={styles.canvas} />}>
            <Canvas className={styles.canvas} />
          </Suspense>
        </div>
      </div>
    </div>
  );
};
