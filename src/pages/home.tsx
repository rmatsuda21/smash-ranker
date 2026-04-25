import { useCallback, useRef } from "react";
import { Link } from "wouter";
import { FaTrophy, FaLayerGroup, FaListOl, FaGithub } from "react-icons/fa6";
import { SiBuymeacoffee } from "react-icons/si";

import styles from "./home.module.scss";

export const Home = () => {
  const orb1Ref = useRef<HTMLDivElement>(null);
  const orb2Ref = useRef<HTMLDivElement>(null);

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
            Your one-stop site for Smash Bros graphics!
          </p>
        </div>
      </section>

      <section className={styles.tools}>
        <h2 className={styles.sectionTitle}>Tools</h2>
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
              <h3 className={styles.cardTitle}>Tournament Ranker</h3>
            </div>
            <p className={styles.cardDescription}>
              Generate tournament bracket graphics with custom templates, player
              data, and character art.
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
              <h3 className={styles.cardTitle}>Tier List Maker</h3>
            </div>
            <p className={styles.cardDescription}>
              Drag and drop characters to create and export shareable tier lists.
            </p>
          </Link>

          <Link
            to="/predict"
            className={styles.card}
            style={{ animationDelay: "0.4s" }}
          >
            <div className={styles.cardHeader}>
              <div className={styles.cardIcon}>
                <FaListOl />
              </div>
              <h3 className={styles.cardTitle}>Predictions</h3>
            </div>
            <p className={styles.cardDescription}>
              Predict tournament placements and share your bracket picks as a
              graphic.
            </p>
          </Link>
        </div>
      </section>

      <section className={styles.roadmap}>
        <div className={styles.roadmapContent}>
          <div className={styles.roadmapBadge}>
            <span className={styles.pulseDot} />
            In Development
          </div>
          <h2 className={styles.roadmapTitle}>More tools on the way</h2>
          <p className={styles.roadmapDescription}>
            More exciting tools are being built 🔧 Stay
            tuned!
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
          Buy me a coffee
        </a>
      </footer>
    </div>
  );
};
