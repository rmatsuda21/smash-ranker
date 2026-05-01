import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "wouter";
import cn from "classnames";

import { useFeatureFlag } from "@/hooks/useFeatureFlags";

import styles from "./NavOverlay.module.scss";

type NavItem = { label: string; href: string; flag?: "thumbnail-enabled" };

const NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Ranker", href: "/ranker" },
  { label: "Tier List", href: "/tier" },
  { label: "Thumbnail", href: "/thumbnail", flag: "thumbnail-enabled" },
  { label: "Predictions", href: "/predict" },
];

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export const NavOverlay = ({ isOpen, onClose }: Props) => {
  const [location] = useLocation();
  const [renderState, setRenderState] = useState<
    "closed" | "open" | "closing"
  >("closed");
  const firstLinkRef = useRef<HTMLAnchorElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const thumbnailEnabled = useFeatureFlag("thumbnail-enabled");
  const visibleItems = useMemo(
    () =>
      NAV_ITEMS.filter((item) => {
        if (item.flag === "thumbnail-enabled") return thumbnailEnabled;
        return true;
      }),
    [thumbnailEnabled],
  );

  // Handle mount/unmount with close animation
  useEffect(() => {
    if (isOpen) {
      clearTimeout(closeTimerRef.current);
      setRenderState("open");
    } else if (renderState === "open") {
      setRenderState("closing");
      closeTimerRef.current = setTimeout(
        () => setRenderState("closed"),
        200,
      );
    }
  }, [isOpen, renderState]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => clearTimeout(closeTimerRef.current);
  }, []);

  // Body scroll lock
  useEffect(() => {
    if (renderState !== "closed") {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [renderState]);

  // Focus first link on open
  useEffect(() => {
    if (isOpen && firstLinkRef.current) {
      firstLinkRef.current.focus();
    }
  }, [isOpen]);

  if (renderState === "closed") return null;

  return createPortal(
    <div
      className={cn(styles.overlay, {
        [styles.entering]: renderState === "open",
        [styles.exiting]: renderState === "closing",
      })}
    >
      <nav className={styles.nav}>
        {visibleItems.map((item, i) => (
          <Link
            key={item.href}
            ref={i === 0 ? firstLinkRef : undefined}
            className={cn(styles.link, {
              [styles.active]: location === item.href,
            })}
            href={item.href}
            onClick={onClose}
            style={{ "--stagger": i } as React.CSSProperties}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </div>,
    document.getElementById("root")!.children[0] ||
      document.getElementById("root")!,
  );
};
