import type { ReactNode } from "react";
import { Link } from "wouter";
import cn from "classnames";
import { Trans } from "@lingui/react/macro";
import { FaArrowRight } from "react-icons/fa6";

import { RECENT_LIST_LENGTH } from "@/consts/home";
import { readTournamentsHeight } from "@/utils/home/tournamentsHeight";

import styles from "./RecentTournaments.module.scss";

// The section around the user's tournaments: its heading and the space under
// it. Kept out of the lazy `RecentTournaments` chunk so the placeholder can
// stand in while that chunk loads.
export const RecentTournamentsShell = ({
  busy,
  showAllLink,
  children,
}: {
  busy: boolean;
  showAllLink: boolean;
  children: ReactNode;
}) => (
  <section className={styles.root} aria-busy={busy}>
    <div className={styles.heading}>
      <h2 className={styles.sectionTitle}>
        <Trans>Your tournaments</Trans>
      </h2>
      {showAllLink && (
        <Link className={styles.allLink} href="/me">
          <Trans>All tournaments & stats</Trans>
          <FaArrowRight aria-hidden="true" />
        </Link>
      )}
    </div>
    {children}
  </section>
);

// Stands in for the tournaments while the chunk and then the list load, laid
// out like them (latest one, list beside or under it) and as tall, so the
// tools below do not move when they arrive: as tall as they were last time
// at this window width, or else as tall as they usually are.
export const RecentTournamentsSkeleton = () => {
  const height = readTournamentsHeight();

  return (
    <RecentTournamentsShell busy showAllLink>
      <div
        className={cn(
          styles.body,
          styles.bodySplit,
          height !== undefined && styles.skeletonSized,
        )}
        style={height !== undefined ? { height } : undefined}
        aria-hidden="true"
      >
        <div className={styles.skeletonFeatured} />
        <div className={styles.list}>
          {[...Array(RECENT_LIST_LENGTH).keys()].map((i) => (
            <div key={i} className={styles.skeletonRow} />
          ))}
        </div>
      </div>
    </RecentTournamentsShell>
  );
};
