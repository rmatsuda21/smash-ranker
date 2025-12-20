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

type Props = {
  className?: string;
};

export const Canvas = ({ className }: Props) => {
  const [displayScale, setDisplayScale] = useState(0.5);

  const stageRef = useRef<KonvaStage>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const canvasSize = useCanvasStore((state) => state.layout.canvas.size);
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
      if (wrapperRef.current) {
        setDisplayScale(wrapperRef.current.clientWidth / canvasSize.width);
      }
    };

    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [canvasSize.width]);

  useEffect(() => {
    if (stageRef.current) {
      canvasDispatch({ type: "SET_STAGE_REF", payload: stageRef.current });
    }
  }, [canvasDispatch, stageRef]);

  return (
    <div
      ref={wrapperRef}
      className={cn(className, styles.canvasContainer)}
      style={
        {
          "--display-scale": `${displayScale}`,
        } as React.CSSProperties
      }
    >
      <div className={styles.canvasWrapper}>
        <Stage
          ref={stageRef}
          width={canvasSize.width}
          height={canvasSize.height}
          onClick={handleStageClick}
          className={styles.canvas}
        >
          <BackgroundLayer onClick={handleStageClick} />

          <PlayerLayer />

          <TournamentLayer />
        </Stage>
      </div>
    </div>
  );
};
