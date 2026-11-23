import type { CSSProperties } from "react";
import cn from "classnames";
import { Trans } from "@lingui/react/macro";

import type { Recap } from "@/types/recap/Recap";

import styles from "../recap.module.scss";

const DIGITS = Array.from({ length: 20 }, (_, i) => i % 10);

// One wheel of the odometer: rolls through the digits and stops on its own.
const Wheel = ({ digit, index }: { digit: number; index: number }) => (
  <span
    className={styles.odo}
    style={{ "--d": digit, "--i": index } as CSSProperties}
  >
    <span>
      {DIGITS.map((d, i) => (
        <em key={i}>{d}</em>
      ))}
    </span>
  </span>
);

export const IntroSlide = ({ recap }: { recap: Recap }) => {
  const digits = String(recap.year).split("").map(Number);
  const tag = recap.player.tag;

  return (
    <section className={cn(styles.slide, styles.gInk, styles.intro)}>
      <div className={styles.stripes} />
      <p className={cn(styles.kicker, styles.rise)}>
        <Trans>Smash Ranker Recap</Trans>
      </p>
      <div
        className={cn(styles.disp, styles.year)}
        aria-label={`${recap.year}`}
      >
        <div>
          {digits.slice(0, 2).map((digit, i) => (
            <Wheel key={i} digit={digit} index={i} />
          ))}
        </div>
        <div>
          {digits.slice(2).map((digit, i) => (
            <Wheel key={i} digit={digit} index={i + 2} />
          ))}
        </div>
      </div>
      <div>
        <h1 className={styles.rise} style={{ "--i": 12 } as CSSProperties}>
          <Trans>{tag}, your year in bracket is ready.</Trans>
        </h1>
        <p
          className={cn(styles.hint, styles.rise)}
          style={{ "--i": 15 } as CSSProperties}
        >
          <Trans>Tap to go on · hold to pause</Trans>
        </p>
      </div>
    </section>
  );
};
