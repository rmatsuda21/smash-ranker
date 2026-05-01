import { useCallback } from "react";
import {
  FaArrowRotateLeft,
  FaArrowRotateRight,
  FaDownload,
  FaExpand,
  FaMagnifyingGlassMinus,
  FaMagnifyingGlassPlus,
} from "react-icons/fa6";

import { useThumbnailStore } from "@/store/thumbnailStore";
import { useThumbnailEditorStore } from "@/store/thumbnailEditorStore";
import { useHistoryStore } from "@/store/historyStore";
import {
  EXPORT_PIXEL_RATIO,
  MAX_ZOOM,
  MIN_ZOOM,
} from "@/consts/thumbnail/defaults";
import { downloadStageAsPng } from "@/utils/thumbnail/exportPng";

import styles from "./Toolbar.module.scss";

export const Toolbar = () => {
  const stage = useThumbnailEditorStore((s) => s.stage);
  const zoom = useThumbnailEditorStore((s) => s.zoom);
  const setZoom = useThumbnailEditorStore((s) => s.setZoom);
  const setPan = useThumbnailEditorStore((s) => s.setPan);
  const clearSelection = useThumbnailEditorStore((s) => s.clearSelection);
  const setShowGrid = useThumbnailEditorStore((s) => s.setShowGrid);
  const showGrid = useThumbnailEditorStore((s) => s.showGrid);

  const applyUndo = useThumbnailStore((s) => s.applyUndo);
  const applyRedo = useThumbnailStore((s) => s.applyRedo);
  const design = useThumbnailStore((s) => s.design);

  const canUndo = useHistoryStore((s) => s.past.length > 0);
  const canRedo = useHistoryStore((s) => s.future.length > 0);

  const handleZoomIn = () => setZoom(Math.min(MAX_ZOOM, zoom * 1.1));
  const handleZoomOut = () => setZoom(Math.max(MIN_ZOOM, zoom / 1.1));
  const handleFit = () => {
    setPan({ x: 0, y: 0 });
    // Trigger ResizeObserver-based fit by setting zoom to 1 then triggering resize event
    setZoom(1);
    window.dispatchEvent(new Event("resize"));
  };

  const handleExport = useCallback(() => {
    if (!stage) return;
    clearSelection();
    const wasShowingGrid = showGrid;
    if (wasShowingGrid) setShowGrid(false);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const fileName = (design.name || "thumbnail")
          .replace(/[^\w\s-]/g, "")
          .replace(/\s+/g, "_");
        downloadStageAsPng(stage, fileName);
        if (wasShowingGrid) setShowGrid(true);
      });
    });
  }, [clearSelection, design.name, setShowGrid, showGrid, stage]);

  return (
    <div className={styles.toolbar}>
      <div className={styles.group}>
        <button
          className={styles.button}
          onClick={applyUndo}
          disabled={!canUndo}
          title="Undo (Cmd+Z)"
          type="button"
        >
          <FaArrowRotateLeft />
          <span className={styles.label}>Undo</span>
        </button>
        <button
          className={styles.button}
          onClick={applyRedo}
          disabled={!canRedo}
          title="Redo (Cmd+Shift+Z)"
          type="button"
        >
          <FaArrowRotateRight />
          <span className={styles.label}>Redo</span>
        </button>
      </div>
      <div className={styles.divider} />
      <div className={styles.group}>
        <button
          className={styles.button}
          onClick={handleZoomOut}
          title="Zoom out"
          type="button"
        >
          <FaMagnifyingGlassMinus />
        </button>
        <div className={styles.zoom}>{Math.round(zoom * 100)}%</div>
        <button
          className={styles.button}
          onClick={handleZoomIn}
          title="Zoom in"
          type="button"
        >
          <FaMagnifyingGlassPlus />
        </button>
        <button
          className={styles.button}
          onClick={handleFit}
          title="Fit to screen"
          type="button"
        >
          <FaExpand />
          <span className={styles.label}>Fit</span>
        </button>
      </div>
      <div className={styles.spacer} />
      <button
        className={`${styles.button} ${styles.primary}`}
        onClick={handleExport}
        title={`Export PNG (${EXPORT_PIXEL_RATIO}x)`}
        type="button"
      >
        <FaDownload />
        <span className={styles.label}>Export PNG</span>
      </button>
    </div>
  );
};
