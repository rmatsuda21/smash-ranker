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
import { RenderModeContext } from "@/components/top8/Canvas/RenderModeContext";
import { MobileGraphicLayer } from "@/components/top8/Canvas/MobileCanvas/MobileGraphicLayer";

import styles from "./MobileCanvas.module.scss";

type Props = {
  className?: string;
};

export const MobileCanvas = ({ className }: Props) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [displayScale, setDisplayScale] = useState(1);

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
    loadFamily(selectedFont).then(finish).catch(finish);
    return () => {
      cancelled = true;
    };
  }, [selectedFont, displayedFont, catalogFetching, fontDispatch]);

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
      setDisplayScale(availableWidth / canvasSize.width);
    };

    resize();
    const observer =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
    observer?.observe(el);
    return () => observer?.disconnect();
  }, [canvasSize.width]);

  const setStageRef = useCallback(
    (stage: KonvaStage | null) => {
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
          style={{ "--display-scale": displayScale } as React.CSSProperties}
        >
          <div className={styles.canvasInner}>
            {isFontLoaded && (
              <Stage
                ref={setStageRef}
                width={canvasSize.width}
                height={canvasSize.height}
                pixelRatio={0.5}
                listening={false}
              >
                {/* Inner Provider keeps context inside Konva's subtree;
                    react-konva v19 propagates context but we provide
                    explicitly so the boundary is unambiguous. */}
                <RenderModeContext.Provider value="mobile">
                  <MobileGraphicLayer />
                </RenderModeContext.Provider>
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
