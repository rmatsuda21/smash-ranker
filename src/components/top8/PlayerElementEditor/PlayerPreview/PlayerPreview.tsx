import { Layer, Stage } from "react-konva";

import { PlayerConfig } from "@/types/top8/Design";

import styles from "./PlayerPreview.module.scss";

const PADDING = 75;
const PREVIEW_WIDTH = 150;
const PREVIEW_HEIGHT = 150;

type Props = {
  basePlayer: PlayerConfig;
  konvaElements: React.ReactNode;
};

export const PlayerPreview = ({ basePlayer, konvaElements }: Props) => {
  return (
    <div
      className={styles.wrapper}
      style={
        {
          "--preview-width": `${PREVIEW_WIDTH}px`,
          "--preview-height": `${PREVIEW_HEIGHT}px`,
          "--player-width": `${basePlayer.size.width}px`,
          "--player-height": `${basePlayer.size.height}px`,
          "--padding": `${PADDING}px`,
        } as React.CSSProperties
      }
    >
      <div className={styles.viewport}>
        <Stage
          width={basePlayer.size.width + PADDING * 2}
          height={basePlayer.size.height + PADDING * 2}
        >
          <Layer offset={{ x: -PADDING, y: -PADDING }}>{konvaElements}</Layer>
        </Stage>
      </div>
    </div>
  );
};
