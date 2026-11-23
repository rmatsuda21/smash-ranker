import type { CSSProperties } from "react";
import cn from "classnames";
import { Trans } from "@lingui/react/macro";
import { useLingui } from "@lingui/react";

import { RecapAvatar } from "@/components/recap/RecapAvatar";
import type { Recap, RecapRunSet } from "@/types/recap/Recap";
import { formatScore, roundLabel } from "@/utils/recap/recapText";
import { formatOrdinal } from "@/utils/user/ordinal";

import styles from "../recap.module.scss";

// A long run shows its last sets, with the early rounds as one row.
const MAX_ROWS = 9;
const SHARD_COLORS = ["#fff", "var(--rc-yellow)", "var(--rc-ink)"];

const Result = ({ won }: { won: boolean }) => (
  <span className={styles.res}>
    {won ? (
      <Trans context="recap" comment="Wins, one letter after a number">
        W
      </Trans>
    ) : (
      <Trans context="recap" comment="Losses, one letter after a number">
        L
      </Trans>
    )}
  </span>
);

export const BestRunSlide = ({ recap }: { recap: Recap }) => {
  const { i18n } = useLingui();
  const run = recap.bestRun!;
  const ordinal = formatOrdinal(run.placement, i18n.locale);
  const number = String(run.placement);
  const name = run.name;
  const entrants = run.entrants;
  const seed = run.seed ? formatOrdinal(run.seed, i18n.locale) : null;

  const early: RecapRunSet[] =
    run.sets.length > MAX_ROWS ? run.sets.slice(0, 1 - MAX_ROWS) : [];
  const shown = run.sets.slice(early.length);
  const earlyCount = early.length;
  const earlyWins = early.filter((set) => set.won).length;

  return (
    <section
      className={cn(styles.slide, styles.gPink, styles.best, styles.shake)}
    >
      <div className={styles.shards} aria-hidden="true">
        {Array.from({ length: 16 }, (_, i) => (
          <i
            key={i}
            style={
              {
                "--a": `${i * 22.5}deg`,
                "--r": 46 + (i % 3) * 14,
                "--c": SHARD_COLORS[i % 3],
              } as CSSProperties
            }
          />
        ))}
      </div>
      <p className={cn(styles.kicker, styles.rise)}>
        <Trans>Best run</Trans>
      </p>
      <div className={styles.bestTop}>
        <p className={cn(styles.disp, styles.place)}>
          {number}
          <sup>{ordinal.slice(number.length)}</sup>
        </p>
        <p
          className={cn(styles.where, styles.rise)}
          style={{ "--i": 9 } as CSSProperties}
        >
          {seed ? (
            <Trans>
              {name}
              <br />
              of {entrants} · seeded {seed}
            </Trans>
          ) : (
            <Trans>
              {name}
              <br />
              of {entrants}
            </Trans>
          )}
        </p>
      </div>

      <div className={styles.runList}>
        {earlyCount > 0 && (
          <div className={styles.rw} style={{ "--w": 0 } as CSSProperties}>
            <Result won={earlyWins * 2 >= earlyCount} />
            <span>
              <Trans>{earlyCount} earlier sets</Trans>
            </span>
            <span />
            <span className={styles.sc}>
              {earlyWins}–{earlyCount - earlyWins}
            </span>
          </div>
        )}
        {shown.map((set, index) => (
          <div
            key={index}
            className={cn(styles.rw, !set.won && styles.rwLoss)}
            style={{ "--w": index + (earlyCount ? 1 : 0) } as CSSProperties}
          >
            <Result won={set.won} />
            <span>{roundLabel(set.round, i18n.locale)}</span>
            <span className={styles.who}>
              <RecapAvatar name={set.opponent} url={set.avatarUrl} />
              {set.opponent}
            </span>
            <span className={styles.sc}>{formatScore(set.score)}</span>
          </div>
        ))}
      </div>

      <div className={styles.grow} />
      <div
        className={cn(styles.tally, styles.rise)}
        style={{ "--i": 18 } as CSSProperties}
      >
        <div>
          <p className={styles.disp}>{recap.bracketWins}</p>
          <p>
            <Trans>brackets won</Trans>
          </p>
        </div>
        <div>
          <p className={styles.disp}>{recap.top3}</p>
          <p>
            <Trans>top 3</Trans>
          </p>
        </div>
        <div>
          <p className={styles.disp}>{recap.top8}</p>
          <p>
            <Trans>top 8</Trans>
          </p>
        </div>
      </div>
    </section>
  );
};
