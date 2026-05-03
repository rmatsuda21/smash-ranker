import { useCallback, useEffect, useRef, useState } from "react";
import { FaGear } from "react-icons/fa6";

import { HamburgerButton } from "./HamburgerButton/HamburgerButton";
import { NavOverlay } from "./NavOverlay/NavOverlay";
import { SettingsModal } from "./SettingsModal/SettingsModal";

import styles from "./Layout.module.scss";
const LOGO_EFFECTS = [
  "smashHit",
  "rgbGlitch",
  "smashBallGlow",
  "spinBounce",
] as const;

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const logoEffectIndex = useRef(0);
  const [logoEffect, setLogoEffect] = useState<string | null>(null);

  const handleLogoHover = useCallback(() => {
    setLogoEffect(LOGO_EFFECTS[logoEffectIndex.current]);
    logoEffectIndex.current =
      (logoEffectIndex.current + 1) % LOGO_EFFECTS.length;
  }, []);

  const handleAnimationEnd = useCallback(() => {
    setLogoEffect(null);
  }, []);

  const closeNav = useCallback(() => setIsNavOpen(false), []);
  const closeSettings = useCallback(() => setIsSettingsOpen(false), []);

  const toggleNav = useCallback(() => {
    setIsNavOpen((prev) => !prev);
    setIsSettingsOpen(false);
  }, []);

  const openSettings = useCallback(() => {
    setIsSettingsOpen(true);
    setIsNavOpen(false);
  }, []);

  // Escape key closes whichever is open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isSettingsOpen) setIsSettingsOpen(false);
        else if (isNavOpen) setIsNavOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isNavOpen, isSettingsOpen]);

  return (
    <div className={styles.root}>
      <nav className={styles.nav}>
        <div className={styles.brand}>
          <img
            src="/favicon.svg"
            alt="Smash Ranker"
            className={logoEffect ? styles[logoEffect] : undefined}
            onMouseEnter={handleLogoHover}
            onAnimationEnd={handleAnimationEnd}
          />
          <span className={styles.betaTag}>beta</span>
        </div>
        <div className={styles.actions}>
          <button
            className={styles.gearButton}
            onClick={openSettings}
            aria-label="Settings"
          >
            <FaGear />
          </button>
          <HamburgerButton isOpen={isNavOpen} onClick={toggleNav} />
        </div>
      </nav>
      <main>{children}</main>
      <NavOverlay isOpen={isNavOpen} onClose={closeNav} />
      <SettingsModal isOpen={isSettingsOpen} onClose={closeSettings} />
    </div>
  );
};
