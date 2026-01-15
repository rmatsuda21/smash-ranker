import { FaGithub, FaXTwitter, FaDiscord } from "react-icons/fa6";
import { FaCoffee } from "react-icons/fa";
import styles from "./InfoPanel.module.scss";

type Props = {
  className?: string;
};

export const InfoPanel = ({ className }: Props) => {
  return (
    <div className={className}>
      <div className={styles.info}>
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Created by</h3>
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
            Join the official server for help, feedback, and updates!
          </p>
          <a
            href="https://discord.gg/ZR5KxeysTH"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.discordButton}
          >
            <FaDiscord />
            <span>Join Discord</span>
          </a>
        </section>

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Support</h3>
          <p className={styles.supportText}>
            Love Smash Ranker? Support the project!
          </p>
          <p className={styles.supportText}>
            Many cups of coffee were consumed during development 👀
          </p>
          <a
            href="https://buymeacoffee.com/chikyunojin"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.coffeeButton}
          >
            <FaCoffee />
            <span>Buy me a coffee</span>
          </a>
        </section>

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Credits & Inspiration</h3>
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
                Original concept & inspiration
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
              <span className={styles.creditDesc}>Stock icons</span>
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
                Tournament & Player data
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
