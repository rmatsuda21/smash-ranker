import type { CSSProperties } from "react";
import cn from "classnames";
import { Trans } from "@lingui/react/macro";
import { useLingui } from "@lingui/react";

import { CountUp } from "@/components/recap/CountUp";
import type { Recap } from "@/types/recap/Recap";
import { fitSize, monthName } from "@/utils/recap/recapText";

import styles from "../recap.module.scss";

const initials = (label: string) =>
  (label.match(/[\p{L}\p{N}]+/gu) ?? [])
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

const Icon = ({
  label,
  url,
  index,
}: {
  label: string;
  url: string | null;
  index?: number;
}) => (
  <span
    className={styles.ti}
    style={
      { "--h": ((index ?? 0) * 47 + 265) % 360, "--w": index } as CSSProperties
    }
  >
    {url ? <img src={url} alt="" /> : <b>{initials(label)}</b>}
  </span>
);

export const GrindSlide = ({ recap }: { recap: Recap }) => {
  const { i18n } = useLingui();
  const { streak, busiestMonth, series } = recap;
  const streakWeeks = streak.length;
  const busiest = busiestMonth
    ? monthName(busiestMonth.month, i18n.locale)
    : "";
  const busiestCount = busiestMonth?.count ?? 0;
  const seriesTitle = series?.name ?? "";
  const seriesCount = series?.count ?? 0;
  const more = recap.tournaments - recap.icons.length;
  const totals = [
    { value: recap.setCount, label: <Trans>sets played</Trans>, delay: 1500 },
    { value: recap.games, label: <Trans>games played</Trans>, delay: 1600 },
    {
      value: recap.entrantsFaced,
      label: <Trans>players in your brackets</Trans>,
      delay: 1700,
    },
  ];

  return (
    <section className={cn(styles.slide, styles.gBlue)}>
      <p className={cn(styles.kicker, styles.rise)}>
        <Trans>You showed up.</Trans>
      </p>
      <div className={styles.numRow}>
        <p
          className={cn(styles.disp, styles.grindNum, styles.rise)}
          style={{ "--i": 1 } as CSSProperties}
        >
          <CountUp value={recap.tournaments} />
        </p>
        <p
          className={cn(styles.unit, styles.rise)}
          style={{ "--i": 2 } as CSSProperties}
        >
          <Trans>
            tournaments
            <br />
            entered
          </Trans>
        </p>
      </div>

      <div className={styles.weeks} aria-hidden="true">
        {recap.weeks.map((entered, week) => {
          const inRun =
            week >= streak.start && week < streak.start + streak.length;
          return (
            <i
              key={week}
              className={cn(
                entered && styles.weekHit,
                entered && inRun && styles.weekRun,
              )}
              style={{ "--w": week } as CSSProperties}
            />
          );
        })}
      </div>
      {busiestMonth && (
        <p className={styles.rise} style={{ "--i": 14 } as CSSProperties}>
          <Trans>
            Yellow is your longest run: <b>{streakWeeks} weeks</b> without
            missing one. {busiest} was the busiest, with {busiestCount}.
          </Trans>
        </p>
      )}

      {series && series.count > 1 && (
        <div
          className={cn(styles.series, styles.rise)}
          style={{ "--i": 15 } as CSSProperties}
        >
          <Icon label={series.name} url={series.iconUrl} />
          <p>
            <Trans>
              <b>{seriesTitle}</b>, {seriesCount} times. The series you entered
              most.
            </Trans>
          </p>
        </div>
      )}
      <div className={styles.icons} aria-hidden="true">
        {recap.icons.map((icon, index) => (
          <Icon key={index} label={icon.label} url={icon.url} index={index} />
        ))}
        {more > 0 && <span className={styles.more}>+{more}</span>}
      </div>

      <div className={styles.grow} />
      <div
        className={cn(styles.trio, styles.rise)}
        style={{ "--i": 17 } as CSSProperties}
      >
        {totals.map((total, index) => (
          <div key={index}>
            <p
              className={styles.disp}
              style={
                {
                  "--fs": `${fitSize(total.value.toLocaleString("en-US"), 12, 25)}cqw`,
                } as CSSProperties
              }
            >
              <CountUp value={total.value} delay={total.delay} />
            </p>
            <p>{total.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
};
