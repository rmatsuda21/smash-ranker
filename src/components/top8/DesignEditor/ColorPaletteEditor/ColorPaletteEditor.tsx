import cn from "classnames";

import { useCanvasStore } from "@/store/canvasStore";
import { rgbStringToAlphaHex } from "@/utils/top8/rgbStringToHex";
import { ColorInput } from "@/components/shared/ColorInput/ColorInput";

import styles from "./ColorPaletteEditor.module.scss";

type Props = {
  className?: string;
};

export const ColorPaletteEditor = ({ className }: Props) => {
  const palette = useCanvasStore((state) => state.design.colorPalette);
  const dispatch = useCanvasStore((state) => state.dispatch);

  const handleColorChange = (id: string, color: string, name: string) => {
    dispatch({
      type: "UPDATE_COLOR_PALETTE",
      payload: { id, value: { color, name } },
    });
  };

  return (
    <div className={cn(className, styles.colorPaletteEditor)}>
      {palette &&
        Object.entries(palette).map(([id, { color, name }]) => (
          <div key={id} className={styles.row}>
            <ColorInput
              color={rgbStringToAlphaHex(color)}
              onChange={(color) => handleColorChange(id, color, name)}
            />
            <span>{name}</span>
          </div>
        ))}
    </div>
  );
};
