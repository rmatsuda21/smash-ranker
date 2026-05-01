import { useEffect } from "react";

import { Canvas } from "@/components/thumbnail/Canvas/Canvas";
import { Sidebar } from "@/components/thumbnail/Sidebar/Sidebar";
import { Toolbar } from "@/components/thumbnail/Toolbar/Toolbar";
import { KeyboardShortcuts } from "@/components/thumbnail/KeyboardShortcuts";
import { useThumbnailEditorStore } from "@/store/thumbnailEditorStore";

import styles from "./ThumbnailPage.module.scss";

export const ThumbnailPage = () => {
  const clearSelection = useThumbnailEditorStore((s) => s.clearSelection);

  useEffect(() => {
    return () => {
      clearSelection();
    };
  }, [clearSelection]);

  return (
    <div className={styles.root}>
      <KeyboardShortcuts />
      <div className={styles.workspace}>
        <Toolbar />
        <div className={styles.canvasArea}>
          <Canvas />
        </div>
      </div>
      <div className={styles.sidebar}>
        <Sidebar />
      </div>
    </div>
  );
};
