import cn from "classnames";
import { Trans } from "@lingui/react/macro";

import { FontSelect } from "@/components/top8/DesignEditor/FontSelect/FontSelect";
import { CustomFontManager } from "@/components/top8/DesignEditor/CustomFontManager/CustomFontManager";
import { useCanvasStore } from "@/store/canvasStore";
import { ColorPaletteEditor } from "@/components/top8/DesignEditor/ColorPaletteEditor/ColorPaletteEditor";
import { AssetSelector } from "@/components/top8/AssetSelector/AssetSelector";
import { Slider } from "@/components/shared/Slider/Slider";

import styles from "./DesignEditor.module.scss";

type Props = {
  className?: string;
};

export const DesignEditor = ({ className }: Props) => {
  const canvasDispatch = useCanvasStore((state) => state.dispatch);
  const bgAssetId = useCanvasStore((state) => state.design.bgAssetId);
  const bgImageDarkness = useCanvasStore(
    (state) => state.design.bgImageDarkness ?? 0
  );

  return (
    <div className={cn(className, styles.wrapper)}>
      <div>
        <p className={styles.label}>
          <Trans>Font</Trans>
        </p>
        <FontSelect />
      </div>

      <div>
        <p className={styles.label}>
          <Trans>Custom Fonts</Trans>
        </p>
        <CustomFontManager />
      </div>

      <div className={styles.backgroundImg}>
        <p className={styles.label}>
          <Trans>Background Image</Trans>
        </p>
        <AssetSelector
          selectedSrc={bgAssetId}
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
        {bgAssetId && (
          <div className={styles.darknessSlider}>
            <p className={styles.label}>
              <Trans>Image darkness</Trans>
            </p>
            <Slider
              min={0}
              max={100}
              value={Math.round(bgImageDarkness * 100)}
              onValueChange={(value) => {
                canvasDispatch({
                  type: "SET_BACKGROUND_IMAGE_DARKNESS",
                  payload: value / 100,
                });
              }}
            />
          </div>
        )}
      </div>

      <div>
        <p className={styles.label}>
          <Trans>Color Palette</Trans>
        </p>
        <ColorPaletteEditor />
      </div>
    </div>
  );
};
