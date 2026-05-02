import { useEffect, useState } from "react";
import cn from "classnames";

import { Trans } from "@lingui/react/macro";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { type MessageDescriptor } from "@lingui/core";

import { Spinner } from "@/components/shared/Spinner/Spinner";

import styles from "./FetchingState.module.scss";

const TAGLINES: MessageDescriptor[] = [
  msg`Talking to the bracket gods...`,
  msg`Pulling entrants...`,
  msg`Sharpening the seeds...`,
  msg`Hyping up the bracket...`,
  msg`Rounding up the squad...`,
  msg`Counting the contenders...`,
];

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

type Props = {
  mode: "inline" | "overlay";
};

export const FetchingState = ({ mode }: Props) => {
  const { _ } = useLingui();
  const [taglineIdx, setTaglineIdx] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const id = setInterval(
      () => setTaglineIdx((i) => (i + 1) % TAGLINES.length),
      1700,
    );
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className={cn(styles.root, mode === "overlay" && styles.overlay)}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className={styles.card}>
        <Spinner className={styles.spinner} size={22} />
        <div className={styles.text}>
          <span className={styles.heading}>
            <Trans>Loading tournament</Trans>
          </span>
          <span className={styles.tagline}>
            <span key={taglineIdx} className={styles.taglineText}>
              {_(TAGLINES[taglineIdx])}
            </span>
          </span>
        </div>
        <div className={styles.progressTrack} aria-hidden="true">
          <div className={styles.progressFill} />
        </div>
      </div>
    </div>
  );
};
