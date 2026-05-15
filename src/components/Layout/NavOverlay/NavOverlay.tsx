import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "wouter";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import type { MessageDescriptor } from "@lingui/core";
import cn from "classnames";

import { useFeatureFlag } from "@/hooks/useFeatureFlags";
import { SiteFooter } from "@/components/shared/SiteFooter/SiteFooter";

import styles from "./NavOverlay.module.scss";

type NavItem = {
  label: MessageDescriptor;
  href: string;
  flag?: "thumbnail-enabled" | "results-enabled";
};

const NAV_ITEMS: NavItem[] = [
  { label: msg`Home`, href: "/" },
  { label: msg`Tournament Ranker`, href: "/ranker" },
  {
    label: msg`Tournament Recap`,
    href: "/results",
    flag: "results-enabled",
  },
  { label: msg`Tier List Maker`, href: "/tier" },
  {
    label: msg`Thumbnail Maker`,
    href: "/thumbnail",
    flag: "thumbnail-enabled",
  },
  { label: msg`Predictions`, href: "/predict" },
];

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export const NavOverlay = ({ isOpen, onClose }: Props) => {
  const [location] = useLocation();
  const { _ } = useLingui();
  const [renderState, setRenderState] = useState<"closed" | "open" | "closing">(
    "closed",
  );
  const firstLinkRef = useRef<HTMLAnchorElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const thumbnailEnabled = useFeatureFlag("thumbnail-enabled");
  const resultsEnabled = useFeatureFlag("results-enabled");
  const visibleItems = useMemo(
    () =>
      NAV_ITEMS.filter((item) => {
        if (item.flag === "thumbnail-enabled") return thumbnailEnabled;
        if (item.flag === "results-enabled") return resultsEnabled;
        return true;
      }),
    [thumbnailEnabled, resultsEnabled],
  );

  // Handle mount/unmount with close animation
  useEffect(() => {
    if (isOpen) {
      clearTimeout(closeTimerRef.current);
      setRenderState("open");
    } else if (renderState === "open") {
      setRenderState("closing");
      closeTimerRef.current = setTimeout(() => setRenderState("closed"), 200);
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
            {_(item.label)}
          </Link>
        ))}
      </nav>
      <div className={styles.footer}>
        <SiteFooter onNavigate={onClose} />
      </div>
    </div>,
    document.getElementById("root")!.children[0] ||
      document.getElementById("root")!,
  );
};
