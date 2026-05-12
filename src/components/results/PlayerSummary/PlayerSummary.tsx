import cn from "classnames";
import { Trans } from "@lingui/react/macro";

import { useResultsStore } from "@/store/resultsStore";
import { computeSeedDelta } from "@/utils/results/upsetFactor";

import styles from "./PlayerSummary.module.scss";

const ordinal = (n: number): string => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
};

type DeltaInfo = {
  text: string;
  variant: "positive" | "negative" | "even" | "none";
};

// Tier-based delta (same placement buckets as Upset Factor). Positive when
// the player placed higher than their seed projected, negative when lower.
const computeDelta = (seed: number, placement: number): DeltaInfo => {
  const delta = computeSeedDelta(seed, placement);
  if (delta == null) return { text: "", variant: "none" };
  if (delta === 0) return { text: "(=)", variant: "even" };
  if (delta > 0) return { text: `(+${delta})`, variant: "positive" };
  return { text: `(${delta})`, variant: "negative" };
};

const DELTA_CLASS = {
  positive: styles.deltaPositive,
  negative: styles.deltaNegative,
  even: styles.deltaEven,
  none: "",
};

export const PlayerSummary = () => {
  const playerResults = useResultsStore((s) => s.playerResults);
  const numEntrants = useResultsStore((s) => s.numEntrants);

  if (!playerResults) return null;

  const {
    name,
    prefix,
    country,
    iconUrl,
    // Older persisted state from before rankings landed lacks this field.
    rankings = [],
    seed,
    placement,
    wins,
    losses,
  } = playerResults;
  const delta = computeDelta(seed, placement);
  const showPrefixRow = Boolean(prefix || country);
  // `rankings` is already sorted by (level priority, rank value) in the
  // fetch hook, so the first entry is the most impactful one to highlight.
  const topRanking = rankings[0];

  return (
    <div className={styles.root}>
      {/* Avatar on the far left — falls back to no element if the player has
          no profile image on start.gg. */}
      {iconUrl && (
        <img
          className={styles.avatar}
          src={iconUrl}
          alt=""
          aria-hidden="true"
        />
      )}

      {/* Tag column: small (flag + prefix) row above the big name. */}
      <div className={styles.tag}>
        {showPrefixRow && (
          <div className={styles.tagMeta}>
            {country && (
              <img
                className={styles.flag}
                src={`/assets/flags/${country.toLowerCase()}.svg`}
                alt=""
                aria-hidden="true"
              />
            )}
            {prefix && <span className={styles.prefix}>{prefix}</span>}
          </div>
        )}
        <h3 className={styles.name}>{name}</h3>
        {topRanking && (
          <div
            className={styles.rankings}
            title={`${topRanking.title} #${topRanking.rank}`}
          >
            {topRanking.displayTitle ?? topRanking.title} #{topRanking.rank}
          </div>
        )}
      </div>

      {/* Right: stats column (placement on top, record · seed · delta below) */}
      <div className={styles.stats}>
        <div className={styles.placementRow}>
          {placement ? (
            <>
              <span className={styles.placementValue}>
                {placement}
                {ordinal(placement)}
              </span>
              {numEntrants > 0 && (
                <span className={styles.placementSub}>/ {numEntrants}</span>
              )}
            </>
          ) : (
            <span className={styles.placementValue}>—</span>
          )}
        </div>
        <div className={styles.statsRow}>
          <span className={styles.statItem}>
            <span className={styles.statStrong}>
              {wins}-{losses}
            </span>
          </span>
          {seed > 0 && (
            <>
              <span className={styles.statSep}>·</span>
              <span className={styles.statItem}>
                <Trans>seed</Trans>{" "}
                <span className={styles.statStrong}>{seed}</span>
                {delta.variant !== "none" && (
                  <span
                    className={cn(styles.delta, DELTA_CLASS[delta.variant])}
                  >
                    {delta.text}
                  </span>
                )}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
