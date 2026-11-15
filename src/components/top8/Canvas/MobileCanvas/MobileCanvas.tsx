import { useCallback, useEffect, useRef, useState } from "react";
import { Layer, Stage } from "react-konva";
import { Stage as KonvaStage } from "konva/lib/Stage";
import cn from "classnames";

import { useCanvasStore } from "@/store/canvasStore";
import { usePlayerStore } from "@/store/playerStore";
import { BracketLoader } from "@/components/shared/BracketLoader/BracketLoader";
import { useEffectiveCanvasSize } from "@/hooks/top8/useEffectiveCanvasSize";
import { useFontSwap } from "@/hooks/top8/useFontSwap";
import { useStageBackingRatio } from "@/hooks/top8/useStageBackingRatio";
import { useTournamentStore } from "@/store/tournamentStore";
import { StaticScene } from "@/components/top8/Canvas/scene/StaticScene";
import { RenderProfileContext } from "@/components/top8/Canvas/RenderProfileContext";
import { MOBILE_PROFILE } from "@/utils/top8/renderProfile";

import styles from "./MobileCanvas.module.scss";

type Props = {
  className?: string;
};

export const MobileCanvas = ({ className }: Props) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  // null until the container has been measured. The Stage is not mounted
  // before then, so its canvases are created at the right backing ratio
  // instead of Konva's default (full devicePixelRatio at design size).
  const [displayScale, setDisplayScale] = useState<number | null>(null);

  const canvasSize = useEffectiveCanvasSize();
  const canvasDispatch = useCanvasStore((state) => state.dispatch);
  const design = useCanvasStore((state) => state.design);
  const players = usePlayerStore((state) => state.players);
  const tournament = useTournamentStore((state) => state.info);

  const { selectedFont, displayedFont, isFontLoaded, isFontSwapping } =
    useFontSwap();

  // The loader follows the tournament fetch rather than per-image ready
  // callbacks: the graphic is usable as soon as it paints, and images fill in
  // as they decode.
  const isFetching = usePlayerStore((state) => state.fetching);
  const showLoader = isFetching || !isFontLoaded;

  // Fit the whole canvas inside the container, like the desktop Canvas's
  // fit-to-window without the slider/padding controls.
  useEffect(() => {
    if (!canvasSize.width || !canvasSize.height) return;
    const el = wrapperRef.current;
    if (!el) return;

    const resize = () => {
      if (!wrapperRef.current) return;
      const { clientWidth, clientHeight } = wrapperRef.current;
      if (clientWidth <= 0 || clientHeight <= 0) return;
      setDisplayScale(
        Math.min(
          clientWidth / canvasSize.width,
          clientHeight / canvasSize.height,
        ),
      );
    };

    resize();
    const observer =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
    observer?.observe(el);
    return () => observer?.disconnect();
  }, [canvasSize.width, canvasSize.height]);

  const bindStageBackingRatio = useStageBackingRatio(displayScale, {
    shrinkHitCanvases: true,
  });
  const setStageRef = useCallback(
    (stage: KonvaStage | null) => {
      bindStageBackingRatio(stage);
      canvasDispatch({ type: "SET_STAGE_REF", payload: stage });
    },
    [canvasDispatch, bindStageBackingRatio],
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
                <RenderProfileContext value={MOBILE_PROFILE}>
                  {/* One layer for everything: each Konva layer owns a
                      stage-sized canvas, and a read-only stage gains nothing
                      from separate redraw regions. */}
                  <Layer listening={false}>
                    <StaticScene
                      design={design}
                      players={players}
                      tournament={tournament}
                      fontFamily={displayedFont}
                    />
                  </Layer>
                </RenderProfileContext>
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
