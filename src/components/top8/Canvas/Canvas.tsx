import { useCallback, useEffect, useRef, useState } from "react";
import { Stage } from "react-konva";
import { Stage as KonvaStage } from "konva/lib/Stage";
import cn from "classnames";

import { useCanvasStore } from "@/store/canvasStore";
import { usePlayerStore } from "@/store/playerStore";
import { useTournamentStore } from "@/store/tournamentStore";
import { useFontStore } from "@/store/fontStore";
import { BackgroundLayer } from "@/components/top8/Canvas/BackgroundLayer";
import { PlayerLayer } from "@/components/top8/Canvas/PlayerLayer";
import { TournamentLayer } from "@/components/top8/Canvas/TournamentLayer";
import { BracketLoader } from "@/components/shared/BracketLoader/BracketLoader";
import { Slider } from "@/components/shared/Slider/Slider";
import { Button } from "@/components/shared/Button/Button";
import { isMobile } from "@/utils/isMobile";
import { useEffectiveCanvasSize } from "@/hooks/top8/useEffectiveCanvasSize";
import { loadFamily } from "@/utils/fonts/fontLoader";

import styles from "./Canvas.module.scss";

const CANVAS_PADDING = 40;

type Props = {
  className?: string;
};

export const Canvas = ({ className }: Props) => {
  const [canvasStyle, setCanvasStyle] = useState<React.CSSProperties>({});
  const [isDrawingReady, setIsDrawingReady] = useState(false);
  const [isBackgroundReady, setIsBackgroundReady] = useState(false);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [isTournamentReady, setIsTournamentReady] = useState(false);

  const [displayScale, setDisplayScale] = useState(1);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const canvasSize = useEffectiveCanvasSize();
  const canvasDispatch = useCanvasStore((state) => state.dispatch);
  const tournamentDispatch = useTournamentStore((state) => state.dispatch);
  const playerDispatch = usePlayerStore((state) => state.dispatch);
  const selectedFont = useFontStore((state) => state.selectedFont);
  const displayedFont = useFontStore((state) => state.displayedFont);
  const fontDispatch = useFontStore((state) => state.dispatch);
  const catalogFetching = useFontStore((state) => state.fetching);

  const isFontLoaded = displayedFont !== "";
  const isFontSwapping = isFontLoaded && selectedFont !== displayedFont;

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

  const clearSelections = useCallback(() => {
    playerDispatch({ type: "CLEAR_SELECTED_PLAYER" });
    tournamentDispatch({ type: "CLEAR_SELECTED_ELEMENT" });
  }, [playerDispatch, tournamentDispatch]);

  const handleStageClick = useCallback(() => {
    clearSelections();
  }, [clearSelections]);

  const handleFitToWindow = useCallback(() => {
    if (scrollAreaRef.current) {
      const padding = isMobile() ? 0 : CANVAS_PADDING;
      const availableWidth =
        scrollAreaRef.current.clientWidth - padding * 2;
      const availableHeight =
        scrollAreaRef.current.clientHeight - padding * 2;

      const scaleByWidth = availableWidth / canvasSize.width;
      const scaleByHeight = availableHeight / canvasSize.height;

      setDisplayScale(
        isMobile() ? scaleByWidth : Math.min(scaleByWidth, scaleByHeight),
      );
    }
  }, [canvasSize.width, canvasSize.height]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        clearSelections();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [clearSelections]);

  useEffect(() => {
    const handleResize = () => {
      if (scrollAreaRef.current && canvasSize?.width && canvasSize?.height) {
        handleFitToWindow();

        setCanvasStyle({
          "--aspect-ratio": `${canvasSize.width / canvasSize.height}`,
          "--canvas-width": `${canvasSize.width}px`,
          "--canvas-height": `${canvasSize.height}px`,
          "--canvas-padding": `${isMobile() ? 0 : CANVAS_PADDING}px`,
        } as React.CSSProperties);
      }
    };

    handleResize();

    const scrollAreaEl = scrollAreaRef.current;
    const observer =
      typeof ResizeObserver !== "undefined" && scrollAreaEl
        ? new ResizeObserver(() => {
            window.requestAnimationFrame(handleResize);
          })
        : null;

    if (observer && scrollAreaEl) {
      observer.observe(scrollAreaEl);
    }

    return () => {
      observer?.disconnect();
    };
  }, [canvasSize?.width, canvasSize?.height, handleFitToWindow]);

  const setStageRef = useCallback(
    (stage: KonvaStage | null) => {
      canvasDispatch({ type: "SET_STAGE_REF", payload: stage });
    },
    [canvasDispatch],
  );

  useEffect(() => {
    if (
      isBackgroundReady &&
      isPlayerReady &&
      isTournamentReady &&
      isFontLoaded
    ) {
      setIsDrawingReady(true);
    }
  }, [isBackgroundReady, isPlayerReady, isTournamentReady, isFontLoaded]);

  const handleBackgroundReady = useCallback(() => {
    setIsBackgroundReady(true);
  }, []);

  const handlePlayerReady = useCallback(() => {
    setIsPlayerReady(true);
  }, []);

  const handleTournamentReady = useCallback(() => {
    setIsTournamentReady(true);
  }, []);

  const handleDisplayScaleChange = useCallback((value: number) => {
    setDisplayScale(value);
  }, []);

  const canvasReady = Boolean(canvasSize?.width && canvasSize?.height);

  if (!canvasReady) {
    return (
      <div className={cn(className, styles.canvasContainer)}>
        <div className={styles.loader}>
          <BracketLoader />
        </div>
      </div>
    );
  }

  return (
    <div
      ref={wrapperRef}
      className={cn(className, styles.canvasContainer)}
      style={canvasStyle}
    >
      {!isDrawingReady ? (
        <div className={styles.loader}>
          <BracketLoader />
        </div>
      ) : null}
      <div ref={scrollAreaRef} className={styles.scrollArea}>
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
                pixelRatio={isMobile() ? 0.5 : undefined}
                onClick={handleStageClick}
              >
                <BackgroundLayer
                  onClick={handleStageClick}
                  onReady={handleBackgroundReady}
                />
                <PlayerLayer onReady={handlePlayerReady} />
                <TournamentLayer onReady={handleTournamentReady} />
              </Stage>
            )}
          </div>
          {isFontSwapping ? (
            <div className={styles.fontSwapOverlay} aria-live="polite">
              <BracketLoader size={180} label={`Loading ${selectedFont}`} />
            </div>
          ) : null}
        </div>
      </div>

      <div className={styles.controls}>
        <span>{`${(displayScale * 100).toFixed(0)}%`}</span>
        <Slider
          value={displayScale}
          onValueChange={handleDisplayScaleChange}
          min={0.1}
          max={2}
          step={0.1}
        />
        <Button variant="outline" size="sm" onClick={handleFitToWindow}>
          Fit to window
        </Button>
      </div>
    </div>
  );
};
