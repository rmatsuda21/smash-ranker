import { Trans } from "@lingui/react/macro";

import { FontSelect } from "@/components/top8/DesignEditor/FontSelect/FontSelect";
import { CustomFontManager } from "@/components/top8/DesignEditor/CustomFontManager/CustomFontManager";
import { useCanvasStore } from "@/store/canvasStore";
import { usePlayerStore } from "@/store/playerStore";
import { useTournamentStore } from "@/store/tournamentStore";
import { GAMES } from "@/consts/games";
import { RenderStyleSwitch } from "@/components/shared/RenderStyleSwitch/RenderStyleSwitch";
import { ColorPaletteEditor } from "@/components/top8/DesignEditor/ColorPaletteEditor/ColorPaletteEditor";
import { AssetSelector } from "@/components/top8/AssetSelector/AssetSelector";
import { Slider } from "@/components/shared/Slider/Slider";
import {
  EditorCard,
  EditorPanel,
  FieldGroup,
} from "@/components/top8/EditorForm/EditorForm";

import styles from "./DesignEditor.module.scss";

type Props = {
  className?: string;
};

export const DesignEditor = ({ className }: Props) => {
  const canvasDispatch = useCanvasStore((state) => state.dispatch);
  const bgAssetId = useCanvasStore((state) => state.design.bgAssetId);
  const bgImageDarkness = useCanvasStore(
    (state) => state.design.bgImageDarkness ?? 0,
  );
  const game = useTournamentStore((state) => state.game);
  const renderStyle = usePlayerStore((state) => state.renderStyle);
  const playerDispatch = usePlayerStore((state) => state.dispatch);
  const darknessPercent = Math.round(bgImageDarkness * 100);

  return (
    <EditorPanel className={className}>
      {/* One style for every player; only for a game with more than one. */}
      {GAMES[game].renderStyles.length > 1 && (
        <EditorCard title={<Trans>Character Art</Trans>}>
          <RenderStyleSwitch
            className={styles.renderStyle}
            game={game}
            value={renderStyle}
            onChange={(value) =>
              playerDispatch({ type: "SET_RENDER_STYLE", payload: value })
            }
          />
        </EditorCard>
      )}

      <EditorCard title={<Trans>Font</Trans>}>
        <FontSelect />
        <FieldGroup label={<Trans>Custom Fonts</Trans>}>
          <CustomFontManager />
        </FieldGroup>
      </EditorCard>

      <EditorCard title={<Trans>Background Image</Trans>}>
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
          <div className={styles.darkness}>
            <Slider
              label={
                <span className={styles.sliderLabel}>
                  <Trans>Image darkness</Trans>
                  <span className={styles.sliderValue}>{darknessPercent}%</span>
                </span>
              }
              min={0}
              max={100}
              value={darknessPercent}
              onValueChange={(value) => {
                canvasDispatch({
                  type: "SET_BACKGROUND_IMAGE_DARKNESS",
                  payload: value / 100,
                });
              }}
            />
          </div>
        )}
      </EditorCard>

      <EditorCard title={<Trans>Color Palette</Trans>}>
        <ColorPaletteEditor />
      </EditorCard>
    </EditorPanel>
  );
};
