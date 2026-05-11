import { useCallback, useRef, useState } from "react";
import { FaGear } from "react-icons/fa6";

import { useDismissOnEscape } from "@/hooks/useDismiss";

import { HamburgerButton } from "./HamburgerButton/HamburgerButton";
import { NavOverlay } from "./NavOverlay/NavOverlay";
import { SettingsModal } from "./SettingsModal/SettingsModal";
import { StockConfetti } from "./StockConfetti/StockConfetti";
import { useDateBasedEgg } from "./StockConfetti/useDateBasedEgg";

import styles from "./Layout.module.scss";
const LOGO_EFFECTS = [
  "smashHit",
  "rgbGlitch",
  "smashBallGlow",
  "spinBounce",
  "screenKO",
] as const;

const BURST_WINDOW_MS = 3000;
const BURST_THRESHOLD = 10;
const BURST_COOLDOWN_MS = 8000;

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const logoEffectIndex = useRef(0);
  const [logoEffect, setLogoEffect] = useState<string | null>(null);

  const hoverTimestampsRef = useRef<number[]>([]);
  const burstCooldownUntilRef = useRef(0);
  const [confettiFlight, setConfettiFlight] = useState<number | null>(null);

  const triggerConfetti = useCallback(() => {
    setConfettiFlight(Date.now());
  }, []);

  const handleConfettiComplete = useCallback(() => {
    setConfettiFlight(null);
  }, []);

  useDateBasedEgg(triggerConfetti);

  const handleLogoHover = useCallback(() => {
    setLogoEffect(LOGO_EFFECTS[logoEffectIndex.current]);
    logoEffectIndex.current =
      (logoEffectIndex.current + 1) % LOGO_EFFECTS.length;

    const now = Date.now();
    if (now < burstCooldownUntilRef.current) return;

    const recent = hoverTimestampsRef.current.filter(
      (t) => now - t < BURST_WINDOW_MS,
    );
    recent.push(now);
    hoverTimestampsRef.current = recent;

    if (recent.length >= BURST_THRESHOLD) {
      hoverTimestampsRef.current = [];
      burstCooldownUntilRef.current = now + BURST_COOLDOWN_MS;
      triggerConfetti();
    }
  }, [triggerConfetti]);

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

  useDismissOnEscape({ enabled: isNavOpen, onDismiss: closeNav });

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
      <StockConfetti
        flightId={confettiFlight}
        onComplete={handleConfettiComplete}
      />
    </div>
  );
};
