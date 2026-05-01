import { useThumbnailEditorStore } from "@/store/thumbnailEditorStore";
import { useThumbnailStore } from "@/store/thumbnailStore";

import styles from "./BackgroundTab.module.scss";

export const SettingsTab = () => {
  const snapToGrid = useThumbnailEditorStore((s) => s.snapToGrid);
  const setSnapToGrid = useThumbnailEditorStore((s) => s.setSnapToGrid);
  const showGrid = useThumbnailEditorStore((s) => s.showGrid);
  const setShowGrid = useThumbnailEditorStore((s) => s.setShowGrid);
  const gridSize = useThumbnailEditorStore((s) => s.gridSize);
  const setGridSize = useThumbnailEditorStore((s) => s.setGridSize);
  const snapToElements = useThumbnailEditorStore((s) => s.snapToElements);
  const setSnapToElements = useThumbnailEditorStore(
    (s) => s.setSnapToElements,
  );

  const canvasSize = useThumbnailStore((s) => s.design.canvasSize);
  const dispatch = useThumbnailStore((s) => s.dispatch);

  return (
    <div>
      <div className={styles.section}>
        <h4>Snapping</h4>
        <label className={styles.row}>
          <span>Snap to elements</span>
          <input
            type="checkbox"
            checked={snapToElements}
            onChange={(e) => setSnapToElements(e.target.checked)}
          />
        </label>
        <label className={styles.row}>
          <span>Snap to grid</span>
          <input
            type="checkbox"
            checked={snapToGrid}
            onChange={(e) => setSnapToGrid(e.target.checked)}
          />
        </label>
        <label className={styles.row}>
          <span>Show grid</span>
          <input
            type="checkbox"
            checked={showGrid}
            onChange={(e) => setShowGrid(e.target.checked)}
          />
        </label>
        <div className={styles.row}>
          <label>Grid size</label>
          <input
            type="number"
            min={4}
            max={200}
            value={gridSize}
            onChange={(e) =>
              setGridSize(Math.max(4, Math.min(200, Number(e.target.value))))
            }
          />
        </div>
      </div>
      <div className={styles.section}>
        <h4>Canvas size</h4>
        <div className={styles.row}>
          <label>Width</label>
          <input
            type="number"
            min={64}
            value={canvasSize.width}
            onChange={(e) =>
              dispatch({
                type: "SET_CANVAS_SIZE",
                payload: {
                  width: Math.max(64, Number(e.target.value)),
                  height: canvasSize.height,
                },
              })
            }
          />
        </div>
        <div className={styles.row}>
          <label>Height</label>
          <input
            type="number"
            min={64}
            value={canvasSize.height}
            onChange={(e) =>
              dispatch({
                type: "SET_CANVAS_SIZE",
                payload: {
                  width: canvasSize.width,
                  height: Math.max(64, Number(e.target.value)),
                },
              })
            }
          />
        </div>
      </div>
    </div>
  );
};
