import { FaGithub, FaXTwitter, FaDiscord } from "react-icons/fa6";
import { FaCoffee } from "react-icons/fa";
import { Trans } from "@lingui/react/macro";

import styles from "./InfoPanel.module.scss";

type Props = {
  className?: string;
};

export const InfoPanel = ({ className }: Props) => {
  return (
    <div className={className}>
      <div className={styles.info}>
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>
            <Trans>Created by</Trans>
          </h3>
          <div className={styles.author}>
            <span className={styles.authorName}>Reo Matsuda</span>
            <div className={styles.socials}>
              <a
                href="https://github.com/rmatsuda21"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
              >
                <FaGithub />
              </a>
              <a
                href="https://x.com/chikyunojin"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="X"
              >
                <FaXTwitter />
              </a>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Discord</h3>
          <p className={styles.supportText}>
            <Trans>
              Join the official server for help, feedback, and updates!
            </Trans>
          </p>
          <a
            href="https://discord.gg/ZR5KxeysTH"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.discordButton}
          >
            <FaDiscord />
            <span>
              <Trans>Join Discord</Trans>
            </span>
          </a>
        </section>

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>
            <Trans>Support</Trans>
          </h3>
          <p className={styles.supportText}>
            <Trans>Love Smash Ranker? Support the project!</Trans>
          </p>
          <p className={styles.supportText}>
            <Trans>
              Many cups of coffee were consumed during development 👀
            </Trans>
          </p>
          <a
            href="https://buymeacoffee.com/chikyunojin"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.coffeeButton}
          >
            <FaCoffee />
            <span>
              <Trans>Buy me a coffee</Trans>
            </span>
          </a>
        </section>

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>
            <Trans>Credits & Inspiration</Trans>
          </h3>
          <div className={styles.credits}>
            <div>
              <a
                href="https://top8er.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                top8er.com
              </a>
              <span className={styles.creditDesc}>
                <Trans>Original concept & inspiration</Trans>
              </span>
            </div>
            <div>
              <a
                href="https://www.ssbwiki.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                SmashWiki
              </a>
              <span className={styles.creditDesc}>
                <Trans>Stock icons</Trans>
              </span>
            </div>
            <div>
              <a
                href="https://www.start.gg"
                target="_blank"
                rel="noopener noreferrer"
              >
                Start.gg
              </a>
              <span className={styles.creditDesc}>
                <Trans>Tournament & Player data</Trans>
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
