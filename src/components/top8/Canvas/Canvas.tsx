import { useCallback, useEffect, useRef } from "react";
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
  const layout = useCanvasStore((state) => state.layout);
  const canvasDispatch = useCanvasStore((state) => state.dispatch);
  const tournamentDispatch = useTournamentStore((state) => state.dispatch);
  const dispatch = usePlayerStore((state) => state.dispatch);
  const stageRef = useRef<KonvaStage>(null);

  const handleStageClick = useCallback(() => {
    dispatch({ type: "CLEAR_SELECTED_PLAYER" });
    tournamentDispatch({ type: "CLEAR_SELECTED_ELEMENT" });
  }, [dispatch, tournamentDispatch]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        dispatch({ type: "CLEAR_SELECTED_PLAYER" });
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [dispatch]);

  useEffect(() => {
    if (stageRef.current) {
      canvasDispatch({ type: "SET_STAGE_REF", payload: stageRef.current });
    }
  }, [canvasDispatch, stageRef]);

  return (
    <div
      style={
        {
          "--canvas-width": `${layout?.canvas.size.width}px`,
          "--canvas-height": `${layout?.canvas.size.height}px`,
          "--display-scale": `${layout?.canvas.displayScale ?? 0.5}`,
        } as React.CSSProperties
      }
      className={cn(className, styles.canvasContainer)}
    >
      <div className={styles.canvasWrapper}>
        <Stage
          ref={stageRef}
          width={layout?.canvas.size.width}
          height={layout?.canvas.size.height}
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
