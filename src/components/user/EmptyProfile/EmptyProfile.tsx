import { Link } from "wouter";
import { Trans } from "@lingui/react/macro";
import {
  FaArrowUpRightFromSquare,
  FaChartSimple,
  FaFlagCheckered,
  FaTrophy,
  FaUserGroup,
  FaWandMagicSparkles,
} from "react-icons/fa6";

import styles from "./EmptyProfile.module.scss";

// The profile of an account that has not entered a tournament yet: say so,
// show what will appear here, and point at things that work today.
export const EmptyProfile = () => (
  <section className={styles.root}>
    <div className={styles.icon} aria-hidden="true">
      <FaFlagCheckered />
    </div>
    <h2 className={styles.title}>
      <Trans>Your first bracket is still ahead of you</Trans>
    </h2>
    <p className={styles.text}>
      <Trans>
        There are no tournaments on your start.gg account yet. Enter one and it
        shows up here, ready to turn into a graphic.
      </Trans>
    </p>

    <ul className={styles.preview}>
      <li>
        <FaChartSimple aria-hidden="true" />
        <Trans>Your record, trophies and streaks</Trans>
      </li>
      <li>
        <FaUserGroup aria-hidden="true" />
        <Trans>Rivals and the characters you play most</Trans>
      </li>
      <li>
        <FaWandMagicSparkles aria-hidden="true" />
        <Trans>One-click graphics for every tournament</Trans>
      </li>
    </ul>

    <div className={styles.actions}>
      <a
        className={styles.primary}
        href="https://www.start.gg/"
        target="_blank"
        rel="noreferrer"
      >
        <Trans>Find a tournament on start.gg</Trans>
        <FaArrowUpRightFromSquare aria-hidden="true" />
      </a>
      <Link className={styles.secondary} href="/ranker">
        <FaTrophy aria-hidden="true" />
        <Trans>Make a Top 8 from any link</Trans>
      </Link>
    </div>
  </section>
);
