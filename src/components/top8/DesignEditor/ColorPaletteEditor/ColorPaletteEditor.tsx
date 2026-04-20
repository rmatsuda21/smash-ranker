import { useMemo } from "react";
import cn from "classnames";
import { Trans } from "@lingui/react";

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

  const groups = useMemo(() => {
    if (!palette) return [];
    const groupMap = new Map<
      string,
      [string, { color: string; name: string }][]
    >();
    for (const [id, entry] of Object.entries(palette)) {
      const groupName = entry.group ?? "";
      if (!groupMap.has(groupName)) {
        groupMap.set(groupName, []);
      }
      groupMap.get(groupName)!.push([id, entry]);
    }
    return Array.from(groupMap.entries());
  }, [palette]);

  return (
    <div className={cn(className, styles.colorPaletteEditor)}>
      {groups.map(([groupName, entries]) => (
        <div key={groupName} className={styles.group}>
          {groupName && (
            <p className={styles.groupLabel}>
              <Trans id={groupName} message={groupName} />
            </p>
          )}
          <div className={styles.groupColors}>
            {entries.map(([id, { color, name }]) => (
              <div key={id} className={styles.row}>
                <ColorInput
                  color={rgbStringToAlphaHex(color)}
                  onChange={(color) => handleColorChange(id, color, name)}
                />
                <span>
                  <Trans id={name} message={name} />
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
