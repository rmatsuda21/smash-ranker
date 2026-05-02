import type { CSSProperties } from "react";
import { Trans } from "@lingui/react/macro";

import { usePredictionStore } from "@/store/predictionStore";
import { getCharImgUrl } from "@/utils/top8/getCharImgUrl";
import { EMPTY_CHARACTER_ID } from "@/consts/top8/characters";
import type { PredictionPalette } from "@/types/predict/PredictionPalette";

import styles from "./PredictionGraphic.module.scss";

export const PREDICTION_GRAPHIC_ID = "prediction-graphic";

const paletteToStyleVars = (palette: PredictionPalette): CSSProperties =>
  ({
    "--pg-bg-start": palette.bgGradientStart,
    "--pg-bg-end": palette.bgGradientEnd,
    "--pg-accent": palette.accent,
    "--pg-accent-bg": palette.accentRowBg,
    "--pg-text-1": palette.textPrimary,
    "--pg-text-2": palette.textSecondary,
    "--pg-text-muted": palette.textMuted,
    "--pg-text-foot": palette.textFooter,
    "--pg-border": palette.borderSubtle,
  }) as CSSProperties;

export const PredictionGraphic = () => {
  const predictions = usePredictionStore((s) => s.predictions);
  const tournamentName = usePredictionStore((s) => s.tournamentName);
  const eventName = usePredictionStore((s) => s.eventName);
  const tournamentDate = usePredictionStore((s) => s.tournamentDate);
  const tournamentIconUrl = usePredictionStore((s) => s.tournamentIconUrl);
  const palette = usePredictionStore((s) => s.colorPalette);

  const formattedDate = tournamentDate
    ? new Date(tournamentDate).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "";

  const meta = [eventName, formattedDate].filter(Boolean).join(" · ");

  return (
    <div className={styles.wrapper} style={paletteToStyleVars(palette)}>
      <div id={PREDICTION_GRAPHIC_ID} className={styles.graphic}>
        <div className={styles.header}>
          {tournamentIconUrl && (
            <img
              className={styles.icon}
              src={tournamentIconUrl}
              alt=""
              crossOrigin="anonymous"
            />
          )}
          <div className={styles.headerText}>
            <h2 className={styles.tournamentName}>{tournamentName}</h2>
            {meta && <p className={styles.meta}>{meta}</p>}
          </div>
        </div>
        <div className={styles.subtitle}><Trans>Predictions</Trans></div>
        <div className={styles.list}>
          {predictions.map((player, index) => (
            <div key={player.id} className={styles.row} data-rank={index + 1}>
              <div className={styles.rankBg}>
                <span className={styles.rank}>{index + 1}</span>
              </div>
              {player.characterId !== EMPTY_CHARACTER_ID ? (
                <img
                  className={styles.charIcon}
                  src={getCharImgUrl({
                    characterId: player.characterId,
                    alt: 0,
                    type: "stock",
                  })}
                  alt=""
                  crossOrigin="anonymous"
                />
              ) : (
                <span className={styles.charPlaceholder} />
              )}
              <span className={styles.name}>
                {player.prefix && (
                  <span className={styles.prefix}>{player.prefix} | </span>
                )}
                {player.name}
              </span>
            </div>
          ))}
        </div>
        <div className={styles.footer}>
          <span>smash-ranker.app</span>
        </div>
      </div>
    </div>
  );
};
