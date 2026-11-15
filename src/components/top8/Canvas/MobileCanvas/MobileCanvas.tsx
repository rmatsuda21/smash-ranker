import { useCallback, useEffect, useRef, useState } from "react";
import { Stage } from "react-konva";
import { Stage as KonvaStage } from "konva/lib/Stage";
import cn from "classnames";

import { useCanvasStore } from "@/store/canvasStore";
import { useFontStore } from "@/store/fontStore";
import { usePlayerStore } from "@/store/playerStore";
import { BracketLoader } from "@/components/shared/BracketLoader/BracketLoader";
import { useEffectiveCanvasSize } from "@/hooks/top8/useEffectiveCanvasSize";
import { loadFamily } from "@/utils/fonts/fontLoader";
import { collectDesignFontWeights } from "@/utils/fonts/designWeights";
import { RenderModeContext } from "@/components/top8/Canvas/RenderModeContext";
import { MobileGraphicLayer } from "@/components/top8/Canvas/MobileCanvas/MobileGraphicLayer";
import {
  applyBackingRatio,
  computeBackingRatio,
  setGlobalBackingRatio,
} from "@/utils/top8/mobileBackingRatio";

import styles from "./MobileCanvas.module.scss";

type Props = {
  className?: string;
};

export const MobileCanvas = ({ className }: Props) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<KonvaStage | null>(null);
  // null until the container has been measured. The Stage is not mounted
  // before then, so its canvases are created at the right backing ratio
  // instead of Konva's default (full devicePixelRatio at design size).
  const [displayScale, setDisplayScale] = useState<number | null>(null);

  const canvasSize = useEffectiveCanvasSize();
  const canvasDispatch = useCanvasStore((state) => state.dispatch);

  const selectedFont = useFontStore((state) => state.selectedFont);
  const displayedFont = useFontStore((state) => state.displayedFont);
  const fontDispatch = useFontStore((state) => state.dispatch);
  const catalogFetching = useFontStore((state) => state.fetching);

  // Loader is gated on the tournament-fetch lifecycle, not on per-Konva-node
  // ready callbacks. The shared PlayerLayer/MobileGraphicLayer ready counter
  // checks `playersReadyCount === playerStore.players.length` (32 sample
  // players by default), but only `design.players.length` (8 in most
  // templates) Player components actually mount — so the counter never
  // reaches the threshold and `isPlayerReady` would never flip true.
  const isFetching = usePlayerStore((state) => state.fetching);
  const isFontLoaded = displayedFont !== "";
  const isFontSwapping = isFontLoaded && selectedFont !== displayedFont;
  const showLoader = isFetching || !isFontLoaded;

  useEffect(() => {
    if (!selectedFont) return;
    if (selectedFont === displayedFont) return;
    let cancelled = false;
    const finish = () => {
      if (cancelled) return;
      fontDispatch({ type: "SET_DISPLAYED_FONT", payload: selectedFont });
    };
    // Only the weights the current design draws with — not every weight
    // the family ships.
    const weights = collectDesignFontWeights(useCanvasStore.getState().design);
    loadFamily(selectedFont, weights).then(finish).catch(finish);
    return () => {
      cancelled = true;
    };
  }, [selectedFont, displayedFont, catalogFetching, fontDispatch]);

  // Konva's pixel ratio is a global; put it back when the mobile canvas
  // unmounts so other Konva surfaces (e.g. /thumbnail) get the default.
  useEffect(() => {
    const initial = setGlobalBackingRatio(window.devicePixelRatio || 1);
    return () => {
      setGlobalBackingRatio(initial);
    };
  }, []);

  // Fit canvas width to container; mirrors the mobile branch of the desktop
  // Canvas's fit-to-window logic without the slider/padding controls.
  useEffect(() => {
    if (!canvasSize.width) return;
    const el = wrapperRef.current;
    if (!el) return;

    const resize = () => {
      if (!wrapperRef.current) return;
      const availableWidth = wrapperRef.current.clientWidth;
      if (availableWidth <= 0) return;
      const scale = availableWidth / canvasSize.width;
      const ratio = computeBackingRatio(scale);
      setGlobalBackingRatio(ratio);
      if (stageRef.current) applyBackingRatio(stageRef.current, ratio);
      setDisplayScale(scale);
    };

    resize();
    const observer =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
    observer?.observe(el);
    return () => observer?.disconnect();
  }, [canvasSize.width]);

  const displayScaleRef = useRef(1);
  if (displayScale !== null) displayScaleRef.current = displayScale;

  const setStageRef = useCallback(
    (stage: KonvaStage | null) => {
      stageRef.current = stage;
      if (stage) {
        applyBackingRatio(stage, computeBackingRatio(displayScaleRef.current));
      }
      canvasDispatch({ type: "SET_STAGE_REF", payload: stage });
    },
    [canvasDispatch],
  );

  const canvasReady = Boolean(canvasSize?.width && canvasSize?.height);

  if (!canvasReady) {
    return (
      <div className={cn(className, styles.mobileCanvasContainer)}>
        <div className={styles.loader}>
          <BracketLoader />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(className, styles.mobileCanvasContainer)}
      style={
        {
          "--canvas-width": `${canvasSize.width}px`,
          "--canvas-height": `${canvasSize.height}px`,
        } as React.CSSProperties
      }
    >
      {showLoader ? (
        <div className={styles.loader}>
          <BracketLoader />
        </div>
      ) : null}
      <div ref={wrapperRef} className={styles.scrollArea}>
        <div
          className={styles.canvasWrapper}
          style={
            { "--display-scale": displayScale ?? 1 } as React.CSSProperties
          }
        >
          <div className={styles.canvasInner}>
            {isFontLoaded && displayScale !== null && (
              <Stage
                ref={setStageRef}
                width={canvasSize.width}
                height={canvasSize.height}
                listening={false}
              >
                {/* Inner Provider keeps context inside Konva's subtree;
                    react-konva v19 propagates context but we provide
                    explicitly so the boundary is unambiguous. */}
                <RenderModeContext value="mobile">
                  <MobileGraphicLayer />
                </RenderModeContext>
              </Stage>
            )}
          </div>
          {isFontSwapping ? (
            <div className={styles.fontSwapOverlay} aria-live="polite">
              <BracketLoader size={120} label={`Loading ${selectedFont}`} />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default MobileCanvas;
