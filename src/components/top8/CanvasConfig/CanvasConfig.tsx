import cn from "classnames";

import { FontSelect } from "@/components/top8/CanvasConfig/FontSelect/FontSelect";
import { useCanvasStore } from "@/store/canvasStore";
import { FileUploader } from "@/components/shared/FileUploader/FileUploader";
import { ColorPaletteEditor } from "@/components/top8/CanvasConfig/ColorPaletteEditor/ColorPaletteEditor";

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

      <div>
        <p className={styles.label}>Background Image</p>
        <FileUploader
          value={canvas.backgroundImgSrc}
          onChange={(file) => {
            if (file) {
              const url = URL.createObjectURL(file);
              canvasDispatch({
                type: "SET_BACKGROUND_IMG_SRC",
                payload: url,
              });
            } else {
              canvasDispatch({
                type: "CLEAR_BACKGROUND_IMG_SRC",
              });
            }
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
