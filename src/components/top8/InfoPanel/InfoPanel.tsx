import { FaXTwitter, FaDiscord } from "react-icons/fa6";
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
                href="https://kagaribi.tokyo/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Kagaribi
              </a>
              <span className={styles.creditDesc}>
                <Trans>Template design inspiration</Trans>
              </span>
            </div>
            <div>
              <a
                href="https://x.com/SmashAwesome"
                target="_blank"
                rel="noopener noreferrer"
              >
                Sumaosame
              </a>
              <span className={styles.creditDesc}>
                <Trans>Template design inspiration</Trans>
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
            <div>
              <a
                href="https://github.com/joaorb64/StreamHelperAssets/tree/main/games/ssbm"
                target="_blank"
                rel="noopener noreferrer"
              >
                Melee CSProject
              </a>
              <span className={styles.creditDesc}>
                <Trans>
                  Melee renders & icons, by Efisio, Cjag, Cahalan and Radzo73
                </Trans>
              </span>
            </div>
            <div>
              <a
                href="https://github.com/joaorb64/TournamentStreamHelper"
                target="_blank"
                rel="noopener noreferrer"
              >
                TournamentStreamHelper
              </a>
              <span className={styles.creditDesc}>
                <Trans>Melee asset packs</Trans>
              </span>
            </div>
            <div>
              <a
                href="https://x.com/MuralAltDrive"
                target="_blank"
                rel="noopener noreferrer"
              >
                @MuralAltDrive
              </a>
              <span className={styles.creditDesc}>
                <Trans>Mural alternate costume renders</Trans>
              </span>
            </div>
            <div>
              <a
                href="https://x.com/ElevenZM"
                target="_blank"
                rel="noopener noreferrer"
              >
                @ElevenZM
              </a>
              <span className={styles.creditDesc}>
                <Trans>Original mural isolation</Trans>
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
