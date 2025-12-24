import cn from "classnames";

import { FontSelect } from "@/components/top8/CanvasConfig/FontSelect/FontSelect";
import { useCanvasStore } from "@/store/canvasStore";
import { ColorPaletteEditor } from "@/components/top8/CanvasConfig/ColorPaletteEditor/ColorPaletteEditor";
import { AssetSelector } from "@/components/top8/AssetSelector/AssetSelector";

import styles from "./CanvasConfig.module.scss";

type Props = {
  className?: string;
};

export const CanvasConfig = ({ className }: Props) => {
  const canvasDispatch = useCanvasStore((state) => state.dispatch);
  const canvas = useCanvasStore((state) => state.layout.canvas);

  return (
    <div className={cn(className, styles.wrapper)}>
      <div>
        <p className={styles.label}>Font</p>
        <FontSelect />
      </div>

      <div className={styles.backgroundImg}>
        <p className={styles.label}>Background Image</p>

        <AssetSelector
          selectedId={canvas.backgroundImgId}
          onSelect={(id) => {
            canvasDispatch({
              type: "SET_BACKGROUND_IMG",
              payload: id,
            });
          }}
          onClear={() => {
            canvasDispatch({
              type: "CLEAR_BACKGROUND_IMG",
            });
          }}
        />
      </div>

      <div>
        <p className={styles.label}>Color Palette</p>
        <ColorPaletteEditor />
      </div>
    </div>
  );
};
