import { memo, useEffect, useMemo } from "react";

import ultCharacters from "@/consts/top8/ultCharacters.json";
import { getCharImgUrl } from "@/utils/top8/getCharImgUrl";

import styles from "./StockConfetti.module.scss";

const CHARACTER_IDS: readonly string[] = ultCharacters.characters.map(
  (c) => c.id,
);

const PIECE_COUNT = 35;
const MIN_DURATION_MS = 2200;
const MAX_DURATION_MS = 3400;
const MAX_DELAY_MS = 600;

type PieceConfig = {
  id: number;
  characterId: string;
  leftPct: number;
  durationMs: number;
  delayMs: number;
  spinDeg: number;
};

const buildPieces = (seed: number): PieceConfig[] => {
  const pieces: PieceConfig[] = [];
  for (let i = 0; i < PIECE_COUNT; i++) {
    pieces.push({
      id: seed + i,
      characterId:
        CHARACTER_IDS[Math.floor(Math.random() * CHARACTER_IDS.length)],
      leftPct: Math.random() * 100,
      durationMs:
        MIN_DURATION_MS + Math.random() * (MAX_DURATION_MS - MIN_DURATION_MS),
      delayMs: Math.random() * MAX_DELAY_MS,
      spinDeg: 360 + Math.random() * 720 * (Math.random() < 0.5 ? -1 : 1),
    });
  }
  return pieces;
};

type StockConfettiPieceProps = {
  config: PieceConfig;
};

const StockConfettiPiece = memo(function StockConfettiPiece({
  config,
}: StockConfettiPieceProps) {
  return (
    <div
      className={styles.piece}
      style={{
        left: `${config.leftPct}%`,
        animationDuration: `${config.durationMs}ms`,
        animationDelay: `${config.delayMs}ms`,
        ["--spin" as string]: `${config.spinDeg}deg`,
      }}
    >
      <img
        src={getCharImgUrl({ characterId: config.characterId, type: "stock" })}
        alt=""
        aria-hidden="true"
        draggable={false}
      />
    </div>
  );
});

type StockConfettiProps = {
  flightId: number | null;
  onComplete: () => void;
};

export const StockConfetti = ({ flightId, onComplete }: StockConfettiProps) => {
  const pieces = useMemo(
    () => (flightId === null ? [] : buildPieces(flightId)),
    [flightId],
  );

  useEffect(() => {
    if (flightId === null) return;
    const longestMs = pieces.reduce(
      (max, p) => Math.max(max, p.delayMs + p.durationMs),
      0,
    );
    const timer = window.setTimeout(onComplete, longestMs + 200);
    return () => window.clearTimeout(timer);
  }, [flightId, pieces, onComplete]);

  if (flightId === null) return null;

  return (
    <div className={styles.overlay} aria-hidden="true">
      {pieces.map((piece) => (
        <StockConfettiPiece key={piece.id} config={piece} />
      ))}
    </div>
  );
};
