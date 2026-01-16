import cn from "classnames";
import { Trans } from "@lingui/react/macro";

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
  const bgAssetId = useCanvasStore((state) => state.design.bgAssetId);

  return (
    <div className={cn(className, styles.wrapper)}>
      <div>
        <p className={styles.label}>
          <Trans>Font</Trans>
        </p>
        <FontSelect />
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
