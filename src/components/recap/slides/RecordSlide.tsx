import type { CSSProperties } from "react";
import cn from "classnames";
import { Trans } from "@lingui/react/macro";
import { useLingui } from "@lingui/react";

import { CountUp } from "@/components/recap/CountUp";
import type { Recap } from "@/types/recap/Recap";
import { fitSize, monthName } from "@/utils/recap/recapText";

import styles from "../recap.module.scss";

// More dots than this stop reading as a count.
const MAX_PIPS = 60;

export const RecordSlide = ({ recap }: { recap: Recap }) => {
  const { i18n } = useLingui();
  const isJa = i18n.locale.startsWith("ja");
  const { bestMonth, deciders } = recap;
  const bestName = bestMonth ? monthName(bestMonth.month, i18n.locale) : "";
  const bestWins = bestMonth?.wins ?? 0;
  const bestLosses = bestMonth?.losses ?? 0;
  const decided = `${deciders.wins}–${deciders.losses}`;

  return (
    <section className={cn(styles.slide, styles.gInk)}>
      <p className={cn(styles.kicker, styles.rise)}>
        <Trans>Your set record</Trans>
      </p>
      <p className={cn(styles.disp, styles.score)}>
        <span className={styles.scoreWin}>
          <CountUp value={recap.wins} />
        </span>
        <small className={styles.scoreWin}>
          <Trans context="recap" comment="Wins, one letter after a number">
            W
          </Trans>
        </small>
        <span className={styles.scoreDash}>–</span>
        <span>
          <CountUp value={recap.losses} />
        </span>
        <small>
          <Trans context="recap" comment="Losses, one letter after a number">
            L
          </Trans>
        </small>
      </p>
      <div className={styles.tug}>
        <b style={{ width: `${recap.winPercent}%` }} />
      </div>
      <div
        className={cn(styles.pct, styles.rise)}
        style={{ "--i": 4 } as CSSProperties}
      >
        <span className={styles.disp}>
          <CountUp value={recap.winPercent} delay={500} duration={1400} hot />
          <small>%</small>
        </span>
        <span>
          <Trans>
            of your sets,
            <br />
            won.
          </Trans>
        </span>
      </div>

      <div className={styles.months} aria-hidden="true">
        {recap.monthRates.map((monthRate, index) => (
          <i
            key={index}
            className={cn(index === bestMonth?.month && styles.monthTop)}
            style={
              { "--w": index, "--h": `${monthRate ?? 0}%` } as CSSProperties
            }
          />
        ))}
      </div>
      <div className={styles.mlab} aria-hidden="true">
        {recap.monthRates.map((_, index) => (
          <span key={index}>
            {isJa ? index + 1 : monthName(index, "en", "short")[0]}
          </span>
        ))}
      </div>
      {bestMonth && (
        <p
          className={styles.rise}
          style={{ "--i": 16, marginTop: "2cqw" } as CSSProperties}
        >
          <Trans>
            <b>{bestName} was your month:</b> {bestWins}–{bestLosses}.
          </Trans>
        </p>
      )}

      <div className={styles.grow} />
      <div className={styles.tiles}>
        <div
          className={cn(styles.tile, styles.rise)}
          style={{ "--i": 9 } as CSSProperties}
        >
          <p className={styles.disp}>{recap.winStreak}</p>
          <p>
            <Trans>sets won in a row, your best streak</Trans>
          </p>
          <div className={styles.pips}>
            {Array.from(
              { length: Math.min(recap.winStreak, MAX_PIPS) },
              (_, i) => (
                <i key={i} style={{ "--w": i } as CSSProperties} />
              ),
            )}
          </div>
        </div>
        <div
          className={cn(styles.tile, styles.rise)}
          style={{ "--i": 10 } as CSSProperties}
        >
          <p
            className={styles.disp}
            style={
              { "--fs": `${fitSize(decided, 13, 33)}cqw` } as CSSProperties
            }
          >
            {decided}
          </p>
          <p>
            <Trans>when the set went to the last game</Trans>
          </p>
        </div>
      </div>
    </section>
  );
};
