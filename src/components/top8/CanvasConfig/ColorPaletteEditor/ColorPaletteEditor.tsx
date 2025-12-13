import cn from "classnames";
import debounce from "lodash/debounce";

import { useCanvasStore } from "@/store/canvasStore";

import styles from "./ColorPaletteEditor.module.scss";
import { useMemo } from "react";
import { rgbStringToHex } from "@/utils/top8/rgbStringToHex";

const DEBOUNCE_TIME = 100;

type Props = {
  className?: string;
};

export const ColorPaletteEditor = ({ className }: Props) => {
  const palette = useCanvasStore((state) => state.layout.canvas.colorPalette);
  const dispatch = useCanvasStore((state) => state.dispatch);

  const debouncedDispatch = useMemo(
    () =>
      debounce((key: string, color: string) => {
        dispatch({ type: "UPDATE_COLOR_PALETTE", payload: { color, key } });
      }, DEBOUNCE_TIME),
    [dispatch]
  );

  const handleColorChange = (key: string, color: string) => {
    debouncedDispatch(key, color);
  };

  return (
    <div className={cn(className, styles.wrapper)}>
      {palette &&
        Object.entries(palette).map(([key, color]) => (
          <div key={key}>
            <label htmlFor={key}>{key}</label>
            <input
              type="color"
              id={key}
              name={key}
              value={rgbStringToHex(color)}
              onChange={(e) => handleColorChange(key, e.target.value)}
            />
          </div>
        ))}
    </div>
  );
};
