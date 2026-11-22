import { useLayoutEffect, useRef } from "react";

import { useCardTilt } from "@/hooks/user/useCardTilt";
import {
  CARD_HEIGHT,
  CARD_WIDTH,
  drawPlayerCard,
  type PlayerCardAssets,
  type PlayerCardData,
} from "@/utils/user/playerCard";

import styles from "./PlayerCard.module.scss";

type Props = {
  data: PlayerCardData;
  assets: PlayerCardAssets;
  // What a screen reader says in place of the picture.
  label: string;
};

// The player's foil card: turns with the mouse or the phone, and the foil
// catches the light as it does. The face is one canvas (the same painter
// makes the image that gets shared); the foil, glitter and glare are CSS
// layers over it, driven by the variables `useCardTilt` sets.
export const PlayerCard = ({ data, assets, label }: Props) => {
  const tiltRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useCardTilt(tiltRef);

  useLayoutEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
    drawPlayerCard(ctx, data, assets);
  }, [data, assets]);

  return (
    <div className={styles.tilt} ref={tiltRef}>
      <div className={styles.card}>
        <canvas
          ref={canvasRef}
          className={styles.face}
          width={CARD_WIDTH}
          height={CARD_HEIGHT}
          role="img"
          aria-label={label}
        />
        <span className={styles.rainbow} />
        <span className={styles.sparkle} />
        <span className={styles.glare} />
      </div>
    </div>
  );
};
