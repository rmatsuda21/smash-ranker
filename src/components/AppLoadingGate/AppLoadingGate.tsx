import { useEffect, useRef, useState, type ReactNode } from "react";
import cn from "classnames";

import { BracketLoader } from "@/components/shared/BracketLoader/BracketLoader";
import { useFeatureFlagsLoading } from "@/hooks/useFeatureFlags";

import styles from "./AppLoadingGate.module.scss";

const FADE_OUT_MS = 300;
const MIN_LOADER_VISIBLE_MS = 600;

type Props = { children: ReactNode };

export const AppLoadingGate = ({ children }: Props) => {
  const loading = useFeatureFlagsLoading();
  const initialLoadingRef = useRef(loading);
  const mountTimeRef = useRef(
    typeof performance !== "undefined" ? performance.now() : Date.now(),
  );
  const [showOverlay, setShowOverlay] = useState(initialLoadingRef.current);
  const [minVisibleElapsed, setMinVisibleElapsed] = useState(
    !initialLoadingRef.current,
  );

  useEffect(() => {
    if (minVisibleElapsed) return;
    const now =
      typeof performance !== "undefined" ? performance.now() : Date.now();
    const remaining = Math.max(
      0,
      MIN_LOADER_VISIBLE_MS - (now - mountTimeRef.current),
    );
    const id = window.setTimeout(() => setMinVisibleElapsed(true), remaining);
    return () => window.clearTimeout(id);
  }, [minVisibleElapsed]);

  const ready = !loading && minVisibleElapsed;

  useEffect(() => {
    if (!ready || !showOverlay) return;
    const id = window.setTimeout(() => setShowOverlay(false), FADE_OUT_MS);
    return () => window.clearTimeout(id);
  }, [ready, showOverlay]);

  return (
    <>
      {ready && children}
      {showOverlay && (
        <div
          className={cn(styles.gate, ready && styles.leaving)}
          style={
            { "--fade-duration": `${FADE_OUT_MS}ms` } as React.CSSProperties
          }
          aria-busy={!ready}
          role="status"
        >
          <BracketLoader label="Loading" />
        </div>
      )}
    </>
  );
};
