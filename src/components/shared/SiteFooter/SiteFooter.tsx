import { Link } from "wouter";
import { Trans } from "@lingui/react/macro";
import { FaDiscord, FaFileLines } from "react-icons/fa6";
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
        &copy; {new Date().getFullYear()} <Trans>Smash Ranker</Trans>
      </p>
      <span className={styles.divider}>&middot;</span>
      <LastUpdateTracker />
      <span className={styles.divider}>&middot;</span>
      <Link href="/tos" className={styles.link} onClick={onNavigate}>
        <FaFileLines />
        <Trans>Terms of Service</Trans>
      </Link>
      <span className={styles.divider}>&middot;</span>
      <a
        href="https://discord.gg/ZR5KxeysTH"
        target="_blank"
        rel="noopener noreferrer"
        className={styles.link}
      >
        <FaDiscord />
        <Trans>Help & feedback</Trans>
      </a>
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
      <p className={styles.disclaimer}>
        <Trans>
          A fan-made site, not affiliated with Nintendo or any tournament
          platform.
        </Trans>
      </p>
    </footer>
  );
};
