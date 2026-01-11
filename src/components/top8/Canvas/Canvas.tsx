import { useCallback, useEffect, useRef, useState } from "react";
import { Stage } from "react-konva";
import { Stage as KonvaStage } from "konva/lib/Stage";
import cn from "classnames";

import { useCanvasStore } from "@/store/canvasStore";
import { usePlayerStore } from "@/store/playerStore";
import { useTournamentStore } from "@/store/tournamentStore";
import { BackgroundLayer } from "@/components/top8/Canvas/BackgroundLayer";
import { PlayerLayer } from "@/components/top8/Canvas/PlayerLayer";
import { TournamentLayer } from "@/components/top8/Canvas/TournamentLayer";
import { Spinner } from "@/components/shared/Spinner/Spinner";
import { Slider } from "@/components/shared/Slider/Slider";
import { Button } from "@/components/shared/Button/Button";

import styles from "./Canvas.module.scss";

const CANVAS_PADDING = 40;

type Props = {
  className?: string;
};

export const Canvas = ({ className }: Props) => {
  const [canvasStyle, setCanvasStyle] = useState<React.CSSProperties>({});
  const [canvasMounted, setCanvasMounted] = useState(false);
  const [isDrawingReady, setIsDrawingReady] = useState(false);
  const [isBackgroundReady, setIsBackgroundReady] = useState(false);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [isTournamentReady, setIsTournamentReady] = useState(false);

  const [displayScale, setDisplayScale] = useState(1);

  const stageRef = useRef<KonvaStage>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const canvasSize = useCanvasStore((state) => state.design.canvasSize);
  const canvasDispatch = useCanvasStore((state) => state.dispatch);
  const tournamentDispatch = useTournamentStore((state) => state.dispatch);
  const playerDispatch = usePlayerStore((state) => state.dispatch);

  const clearSelections = useCallback(() => {
    playerDispatch({ type: "CLEAR_SELECTED_PLAYER" });
    tournamentDispatch({ type: "CLEAR_SELECTED_ELEMENT" });
  }, [playerDispatch, tournamentDispatch]);

  const handleStageClick = useCallback(() => {
    clearSelections();
  }, [clearSelections]);

  const handleFitToWindow = useCallback(() => {
    if (scrollAreaRef.current) {
      const availableWidth =
        scrollAreaRef.current.clientWidth - CANVAS_PADDING * 2;
      const availableHeight =
        scrollAreaRef.current.clientHeight - CANVAS_PADDING * 2;

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
          "--canvas-padding": `${CANVAS_PADDING}px`,
        } as React.CSSProperties);
        setCanvasMounted(true);
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
  }, [canvasSize?.width, canvasSize?.height, canvasMounted, handleFitToWindow]);

  useEffect(() => {
    if (stageRef.current) {
      canvasDispatch({ type: "SET_STAGE_REF", payload: stageRef.current });
    }
  }, [canvasDispatch, stageRef]);

  useEffect(() => {
    if (isBackgroundReady && isPlayerReady && isTournamentReady) {
      setIsDrawingReady(true);
    }
  }, [isBackgroundReady, isPlayerReady, isTournamentReady]);

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

  if (!canvasSize?.width || !canvasSize?.height) {
    return null;
  }

  return (
    <div
      ref={wrapperRef}
      className={cn(className, styles.canvasContainer, {
        [styles.hidden]: !canvasMounted,
      })}
      style={canvasStyle}
    >
      {!isDrawingReady ? (
        <div className={styles.loader}>
          <Spinner size={100} />
        </div>
      ) : null}
      <div ref={scrollAreaRef} className={styles.scrollArea}>
        <div
          className={styles.canvasWrapper}
          style={{ "--display-scale": displayScale } as React.CSSProperties}
        >
          <div className={styles.canvasInner}>
            <Stage
              ref={stageRef}
              width={canvasSize.width}
              height={canvasSize.height}
              onClick={handleStageClick}
            >
              <BackgroundLayer
                onClick={handleStageClick}
                onReady={handleBackgroundReady}
              />
              <PlayerLayer onReady={handlePlayerReady} />
              <TournamentLayer onReady={handleTournamentReady} />
            </Stage>
          </div>
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
