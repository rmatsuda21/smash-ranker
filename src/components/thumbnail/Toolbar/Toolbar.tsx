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
import { shareMethodFor } from "@/utils/top8/downloadBlob";
import { logEvent, setPerson, setPersonOnce } from "@/utils/observability/log";
import { TooltipButton } from "@/components/shared/Tooltip/TooltipButton";

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
      requestAnimationFrame(async () => {
        // Letters and digits of any script, so a Japanese name survives.
        const fileName =
          design.name
            .replace(/[^\p{L}\p{N}\s_-]/gu, "")
            .trim()
            .replace(/\s+/g, "_") || "thumbnail";
        try {
          const outcome = await downloadStageAsPng(stage, fileName);
          if (outcome === null) {
            logEvent("graphic_export_fail", {
              export_surface: "thumbnail",
              export_format: "png",
              failure_kind: "blob_null",
            });
          } else if (outcome !== "cancelled") {
            logEvent("graphic_export_complete", {
              export_surface: "thumbnail",
              export_format: "png",
              pixel_ratio: EXPORT_PIXEL_RATIO,
              share_method: shareMethodFor(outcome),
            });
            const now = new Date().toISOString();
            setPersonOnce({ first_export_at: now });
            setPerson({ has_exported: true, last_export_at: now });
          }
        } finally {
          if (wasShowingGrid) setShowGrid(true);
        }
      });
    });
  }, [clearSelection, design.name, setShowGrid, showGrid, stage]);

  return (
    <div className={styles.toolbar}>
      <div className={styles.group}>
        <TooltipButton
          className={styles.button}
          onClick={applyUndo}
          disabled={!canUndo}
          tooltip="Undo (Cmd+Z)"
        >
          <FaArrowRotateLeft />
          <span className={styles.label}>Undo</span>
        </TooltipButton>
        <TooltipButton
          className={styles.button}
          onClick={applyRedo}
          disabled={!canRedo}
          tooltip="Redo (Cmd+Shift+Z)"
        >
          <FaArrowRotateRight />
          <span className={styles.label}>Redo</span>
        </TooltipButton>
      </div>
      <div className={styles.divider} />
      <div className={styles.group}>
        <TooltipButton
          className={styles.button}
          onClick={handleZoomOut}
          tooltip="Zoom out"
          tooltipIsLabel
        >
          <FaMagnifyingGlassMinus />
        </TooltipButton>
        <div className={styles.zoom}>{Math.round(zoom * 100)}%</div>
        <TooltipButton
          className={styles.button}
          onClick={handleZoomIn}
          tooltip="Zoom in"
          tooltipIsLabel
        >
          <FaMagnifyingGlassPlus />
        </TooltipButton>
        <TooltipButton
          className={styles.button}
          onClick={handleFit}
          tooltip="Fit to screen"
        >
          <FaExpand />
          <span className={styles.label}>Fit</span>
        </TooltipButton>
      </div>
      <div className={styles.spacer} />
      <TooltipButton
        className={`${styles.button} ${styles.primary}`}
        onClick={handleExport}
        tooltip={`Export PNG (${EXPORT_PIXEL_RATIO}x)`}
      >
        <FaDownload />
        <span className={styles.label}>Export PNG</span>
      </TooltipButton>
    </div>
  );
};
