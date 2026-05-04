import { useCallback, useRef } from "react";
import { Link } from "wouter";
import { Trans } from "@lingui/react/macro";
import {
  FaTrophy,
  FaLayerGroup,
  FaListOl,
  FaGithub,
  FaPhotoFilm,
} from "react-icons/fa6";
import { SiBuymeacoffee } from "react-icons/si";

import { useFeatureFlag } from "@/hooks/useFeatureFlags";

import styles from "./home.module.scss";

export const Home = () => {
  const orb1Ref = useRef<HTMLDivElement>(null);
  const orb2Ref = useRef<HTMLDivElement>(null);
  const thumbnailEnabled = useFeatureFlag("thumbnail-enabled");

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const { clientWidth, clientHeight } = e.currentTarget;
    const x = (e.clientX / clientWidth - 0.5) * 2;
    const y = (e.clientY / clientHeight - 0.5) * 2;

    if (orb1Ref.current) {
      orb1Ref.current.style.translate = `${x * 30}px ${y * 30}px`;
    }
    if (orb2Ref.current) {
      orb2Ref.current.style.translate = `${x * -20}px ${y * -20}px`;
    }
  }, []);

  return (
    <div className={styles.root} onMouseMove={handleMouseMove}>
      <div ref={orb1Ref} className={styles.orb1} aria-hidden="true" />
      <div ref={orb2Ref} className={styles.orb2} aria-hidden="true" />

      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.logoWrap}>
            <div className={styles.blob} aria-hidden="true" />
            <img src="/favicon.svg" alt="" className={styles.heroLogo} />
          </div>
          <h1 className={styles.title}>
            Smash <span className={styles.accentText}>Ranker</span>
          </h1>
          <p className={styles.tagline}>
            <Trans>Your one-stop site for Smash Bros graphics!</Trans>
          </p>
        </div>
      </section>

      <section className={styles.tools}>
        <h2 className={styles.sectionTitle}>
          <Trans>Tools</Trans>
        </h2>
        <div className={styles.cardGrid}>
          <Link
            to="/ranker"
            className={styles.card}
            style={{ animationDelay: "0.1s" }}
          >
            <div className={styles.cardHeader}>
              <div className={styles.cardIcon}>
                <FaTrophy />
              </div>
              <h3 className={styles.cardTitle}>
                <Trans>Tournament Ranker</Trans>
              </h3>
            </div>
            <p className={styles.cardDescription}>
              <Trans>
                Easily generate your own tournament graphics with full
                customization.
              </Trans>
            </p>
          </Link>

          <Link
            to="/tier"
            className={styles.card}
            style={{ animationDelay: "0.25s" }}
          >
            <div className={styles.cardHeader}>
              <div className={styles.cardIcon}>
                <FaLayerGroup />
              </div>
              <h3 className={styles.cardTitle}>
                <Trans>Tier List Maker</Trans>
              </h3>
            </div>
            <p className={styles.cardDescription}>
              <Trans>
                Create your own fully customizable character tier lists.
              </Trans>
            </p>
          </Link>

          {thumbnailEnabled && (
            <Link
              to="/thumbnail"
              className={styles.card}
              style={{ animationDelay: "0.4s" }}
            >
              <div className={styles.cardHeader}>
                <div className={styles.cardIcon}>
                  <FaPhotoFilm />
                </div>
                <h3 className={styles.cardTitle}>
                  <Trans>Thumbnail Maker</Trans>
                  <span className={styles.cardBadge}>
                    <Trans>New</Trans>
                  </span>
                </h3>
              </div>
              <p className={styles.cardDescription}>
                <Trans>
                  Create custom YouTube thumbnails for your Smash sets!
                </Trans>
              </p>
            </Link>
          )}

          <Link
            to="/predict"
            className={styles.card}
            style={{ animationDelay: "0.55s" }}
          >
            <div className={styles.cardHeader}>
              <div className={styles.cardIcon}>
                <FaListOl />
              </div>
              <h3 className={styles.cardTitle}>
                <Trans>Predictions</Trans>
              </h3>
            </div>
            <p className={styles.cardDescription}>
              <Trans>
                Like making bracket predictions? Why not share yours with your
                friends with a cool graphic!
              </Trans>
            </p>
          </Link>
        </div>
      </section>

      <section className={styles.roadmap}>
        <div className={styles.roadmapContent}>
          <div className={styles.roadmapBadge}>
            <span className={styles.pulseDot} />
            <Trans>In Development</Trans>
          </div>
          <h2 className={styles.roadmapTitle}>
            <Trans>More tools on the way</Trans>
          </h2>
          <p className={styles.roadmapDescription}>
            <Trans>I have many exiciting tools on the way 🔧 Stay tuned!</Trans>
          </p>
        </div>
      </section>

      <footer className={styles.footer}>
        <p className={styles.copyright}>
          &copy; {new Date().getFullYear()} Smash Ranker
        </p>
        <span className={styles.footerDivider}>&middot;</span>
        <a
          href="https://github.com/rmatsuda21/smash-ranker"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.footerLink}
        >
          <FaGithub />
          GitHub
        </a>
        <span className={styles.footerDivider}>&middot;</span>
        <a
          href="https://buymeacoffee.com/chikyunojin"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.footerLink}
        >
          <SiBuymeacoffee />
          <Trans>Buy me a coffee</Trans>
        </a>
      </footer>
    </div>
  );
};
