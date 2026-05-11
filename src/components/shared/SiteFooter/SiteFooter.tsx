import { Link } from "wouter";
import { Trans } from "@lingui/react/macro";
import { FaGithub, FaFileLines } from "react-icons/fa6";
import { SiBuymeacoffee } from "react-icons/si";

import { LastUpdateTracker } from "@/components/home/LastUpdateTracker";

import styles from "./SiteFooter.module.scss";

type Props = {
  onNavigate?: () => void;
};

export const SiteFooter = ({ onNavigate }: Props) => {
  return (
    <footer className={styles.footer}>
      <p className={styles.copyright}>
        &copy; {new Date().getFullYear()} Smash Ranker
      </p>
      <span className={styles.divider}>&middot;</span>
      <a
        href="https://github.com/rmatsuda21/smash-ranker"
        target="_blank"
        rel="noopener noreferrer"
        className={styles.link}
      >
        <FaGithub />
        GitHub
      </a>
      <span className={styles.divider}>&middot;</span>
      <LastUpdateTracker />
      <span className={styles.divider}>&middot;</span>
      <Link href="/tos" className={styles.link} onClick={onNavigate}>
        <FaFileLines />
        <Trans>Terms of Service</Trans>
      </Link>
      <span className={styles.divider}>&middot;</span>
      <a
        href="https://buymeacoffee.com/chikyunojin"
        target="_blank"
        rel="noopener noreferrer"
        className={styles.link}
      >
        <SiBuymeacoffee />
        <Trans>Buy me a coffee</Trans>
      </a>
    </footer>
  );
};
