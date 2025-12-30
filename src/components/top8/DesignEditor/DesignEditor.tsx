import cn from "classnames";

import { FontSelect } from "@/components/top8/DesignEditor/FontSelect/FontSelect";
import { useCanvasStore } from "@/store/canvasStore";
import { ColorPaletteEditor } from "@/components/top8/DesignEditor/ColorPaletteEditor/ColorPaletteEditor";
import { AssetSelector } from "@/components/top8/AssetSelector/AssetSelector";

import styles from "./DesignEditor.module.scss";

type Props = {
  className?: string;
};

export const DesignEditor = ({ className }: Props) => {
  const canvasDispatch = useCanvasStore((state) => state.dispatch);
  const canvas = useCanvasStore((state) => state.design.canvas);

  return (
    <div className={cn(className, styles.wrapper)}>
      <div>
        <p className={styles.label}>Font</p>
        <FontSelect />
      </div>

      <div className={styles.backgroundImg}>
        <p className={styles.label}>Background Image</p>
        <AssetSelector
          selectedSrc={canvas.bgAssetId}
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
