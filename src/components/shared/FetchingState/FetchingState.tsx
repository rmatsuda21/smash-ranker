import { useEffect, useState, type ReactNode } from "react";
import cn from "classnames";

import { useLingui } from "@lingui/react";
import { type MessageDescriptor } from "@lingui/core";

import { Spinner } from "@/components/shared/Spinner/Spinner";

import styles from "./FetchingState.module.scss";

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

type Props = {
  mode: "inline" | "overlay";
  heading: ReactNode;
  taglines: MessageDescriptor[];
};

export const FetchingState = ({ mode, heading, taglines }: Props) => {
  const { _ } = useLingui();
  const [taglineIdx, setTaglineIdx] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    if (taglines.length <= 1) return;
    const id = setInterval(
      () => setTaglineIdx((i) => (i + 1) % taglines.length),
      1700,
    );
    return () => clearInterval(id);
  }, [taglines.length]);

  const current = taglines[taglineIdx] ?? taglines[0];

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
          <span className={styles.heading}>{heading}</span>
          {current && (
            <span className={styles.tagline}>
              <span key={taglineIdx} className={styles.taglineText}>
                {_(current)}
              </span>
            </span>
          )}
        </div>
        <div className={styles.progressTrack} aria-hidden="true">
          <div className={styles.progressFill} />
        </div>
      </div>
    </div>
  );
};
