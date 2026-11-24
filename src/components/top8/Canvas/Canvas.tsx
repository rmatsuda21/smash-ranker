import { useCallback, useEffect, useRef, useState } from "react";
import { Stage } from "react-konva";
import { Trans } from "@lingui/react/macro";
import { Stage as KonvaStage } from "konva/lib/Stage";
import cn from "classnames";

import { useCanvasStore } from "@/store/canvasStore";
import { usePlayerStore } from "@/store/playerStore";
import { useTournamentStore } from "@/store/tournamentStore";
import { EditableContentLayers } from "@/components/top8/Canvas/EditableContentLayers";
import { TournamentLayer } from "@/components/top8/Canvas/TournamentLayer";
import { BracketLoader } from "@/components/shared/BracketLoader/BracketLoader";
import { Slider } from "@/components/shared/Slider/Slider";
import { Button } from "@/components/shared/Button/Button";
import { useEffectiveCanvasSize } from "@/hooks/top8/useEffectiveCanvasSize";
import { useFontSwap } from "@/hooks/top8/useFontSwap";
import { useStageBackingRatio } from "@/hooks/top8/useStageBackingRatio";
import { perfMark, perfMeasureSince } from "@/utils/top8/renderPerf";

import styles from "./Canvas.module.scss";

const CANVAS_PADDING = 40;
const NARROW_CANVAS_PADDING = 8;
const NARROW_QUERY = "(max-width: 768px)";

const getCanvasPadding = () =>
  window.matchMedia(NARROW_QUERY).matches
    ? NARROW_CANVAS_PADDING
    : CANVAS_PADDING;

type Props = {
  className?: string;
};

export const Canvas = ({ className }: Props) => {
  const [canvasStyle, setCanvasStyle] = useState<React.CSSProperties>({});
  const [isDrawingReady, setIsDrawingReady] = useState(false);
  const [isBackgroundReady, setIsBackgroundReady] = useState(false);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [isTournamentReady, setIsTournamentReady] = useState(false);

  // null until the container has been measured. The Stage is not mounted
  // before then, so its canvases are created at the right backing ratio.
  const [displayScale, setDisplayScale] = useState<number | null>(null);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const canvasSize = useEffectiveCanvasSize();
  const canvasDispatch = useCanvasStore((state) => state.dispatch);
  const tournamentDispatch = useTournamentStore((state) => state.dispatch);
  const playerDispatch = usePlayerStore((state) => state.dispatch);
  const { selectedFont, isFontLoaded, isFontSwapping } = useFontSwap();
  const bindStageBackingRatio = useStageBackingRatio(displayScale);

  useEffect(() => {
    perfMark("canvasMount");
  }, []);

  const clearSelections = useCallback(() => {
    playerDispatch({ type: "CLEAR_SELECTED_PLAYER" });
    tournamentDispatch({ type: "CLEAR_SELECTED_ELEMENT" });
  }, [playerDispatch, tournamentDispatch]);

  const handleStageClick = useCallback(() => {
    clearSelections();
  }, [clearSelections]);

  const handleFitToWindow = useCallback(() => {
    if (scrollAreaRef.current) {
      const padding = getCanvasPadding();
      const availableWidth = scrollAreaRef.current.clientWidth - padding * 2;
      const availableHeight = scrollAreaRef.current.clientHeight - padding * 2;

      const scaleByWidth = availableWidth / canvasSize.width;
      const scaleByHeight = availableHeight / canvasSize.height;

      setDisplayScale(Math.min(scaleByWidth, scaleByHeight));
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
          "--canvas-padding": `${getCanvasPadding()}px`,
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
      bindStageBackingRatio(stage);
      canvasDispatch({ type: "SET_STAGE_REF", payload: stage });
    },
    [canvasDispatch, bindStageBackingRatio],
  );

  useEffect(() => {
    if (
      isBackgroundReady &&
      isPlayerReady &&
      isTournamentReady &&
      isFontLoaded
    ) {
      perfMeasureSince("canvasReady", "canvasMount");
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
                onClick={handleStageClick}
              >
                <EditableContentLayers
                  onBackgroundReady={handleBackgroundReady}
                  onPlayersReady={handlePlayerReady}
                />
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
        <span>{`${((displayScale ?? 1) * 100).toFixed(0)}%`}</span>
        <Slider
          value={displayScale ?? 1}
          onValueChange={handleDisplayScaleChange}
          min={0.1}
          max={2}
          step={0.1}
        />
        <Button variant="outline" size="sm" onClick={handleFitToWindow}>
          <Trans>Fit to window</Trans>
        </Button>
      </div>
    </div>
  );
};
