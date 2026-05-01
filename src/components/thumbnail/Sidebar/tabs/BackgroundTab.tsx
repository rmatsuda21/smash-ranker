import cn from "classnames";

import { useThumbnailStore } from "@/store/thumbnailStore";
import { ThumbnailBackground } from "@/types/thumbnail/ThumbnailDesign";
import { ColorInput } from "@/components/shared/ColorInput/ColorInput";
import { AssetPickerButton } from "@/components/thumbnail/Pickers/AssetPickerButton";

import styles from "./BackgroundTab.module.scss";

const useUpdateBackground = () => {
  const dispatch = useThumbnailStore((s) => s.dispatch);
  const pushHistory = useThumbnailStore((s) => s.pushHistory);
  const before = useThumbnailStore((s) => s.design.background);
  return (next: ThumbnailBackground) => {
    dispatch({ type: "SET_BACKGROUND", payload: next });
    pushHistory({
      type: "THUMBNAIL_BACKGROUND",
      undoData: before,
      redoData: next,
    });
  };
};

export const BackgroundTab = () => {
  const background = useThumbnailStore((s) => s.design.background);
  const update = useUpdateBackground();

  return (
    <div>
      <div className={styles.section}>
        <h4>Background</h4>
        <div className={styles.tabs}>
          <button
            type="button"
            className={cn({ [styles.active]: background.type === "color" })}
            onClick={() => update({ type: "color", color: "#1a1a1a" })}
          >
            Solid
          </button>
          <button
            type="button"
            className={cn({ [styles.active]: background.type === "split" })}
            onClick={() =>
              update({
                type: "split",
                left: "#D9482F",
                right: "#E7B127",
                angle: 0,
              })
            }
          >
            Split
          </button>
          <button
            type="button"
            className={cn({ [styles.active]: background.type === "image" })}
            onClick={() =>
              update({ type: "image", src: "", fillMode: "cover" })
            }
          >
            Image
          </button>
        </div>
      </div>

      {background.type === "color" && (
        <div className={styles.section}>
          <div className={styles.row}>
            <label>Color</label>
            <ColorInput
              color={background.color}
              onChange={(color) => update({ type: "color", color })}
            />
          </div>
        </div>
      )}

      {background.type === "split" && (
        <div className={styles.section}>
          <div className={styles.row}>
            <label>Left</label>
            <ColorInput
              color={background.left}
              onChange={(color) =>
                update({ ...background, left: color })
              }
            />
          </div>
          <div className={styles.row}>
            <label>Right</label>
            <ColorInput
              color={background.right}
              onChange={(color) =>
                update({ ...background, right: color })
              }
            />
          </div>
        </div>
      )}

      {background.type === "image" && (
        <div className={styles.section}>
          <AssetPickerButton
            src={background.src}
            label="Background"
            onChange={(src) => update({ ...background, src })}
            onClear={() => update({ ...background, src: "" })}
          />
          <div className={styles.row}>
            <label>Fit</label>
            <select
              value={background.fillMode}
              onChange={(e) =>
                update({
                  ...background,
                  fillMode: e.target.value as "contain" | "cover",
                })
              }
            >
              <option value="cover">Cover (fill, crop)</option>
              <option value="contain">Contain (fit, no crop)</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
};
