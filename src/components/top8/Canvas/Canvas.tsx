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

import styles from "./Canvas.module.scss";
import { Spinner } from "@/components/shared/Spinner/Spinner";

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

  const stageRef = useRef<KonvaStage>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

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
      if (wrapperRef.current && canvasSize?.width) {
        const displayScale = wrapperRef.current.clientWidth / canvasSize.width;
        const wrapperRect = wrapperRef.current.getBoundingClientRect();
        setCanvasStyle({
          "--display-scale": `${displayScale}`,
          top: `${wrapperRect.top}px`,
          left: `${wrapperRect.left}px`,
        } as React.CSSProperties);
        setCanvasMounted(true);
      }
    };

    handleResize();

    const wrapperEl = wrapperRef.current;
    const observer =
      typeof ResizeObserver !== "undefined" && wrapperEl
        ? new ResizeObserver(() => {
            window.requestAnimationFrame(handleResize);
          })
        : null;

    if (observer && wrapperEl) {
      observer.observe(wrapperEl);
    }

    return () => {
      observer?.disconnect();
    };
  }, [canvasSize?.width, canvasMounted]);

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

  if (!canvasSize?.width || !canvasSize?.height) {
    return null;
  }

  return (
    <div
      ref={wrapperRef}
      className={cn(className, styles.canvasContainer, {
        [styles.hidden]: !canvasMounted,
      })}
    >
      <div className={styles.canvasWrapper} style={canvasStyle}>
        {!isDrawingReady ? (
          <div className={styles.loader}>
            <Spinner size={150} />
          </div>
        ) : null}
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
  );
};
