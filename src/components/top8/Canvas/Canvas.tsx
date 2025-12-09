import { useCallback, useEffect } from "react";
import { Stage } from "react-konva";
import { Stage as KonvaStage } from "konva/lib/Stage";
import cn from "classnames";

import { useCanvasStore } from "@/store/canvasStore";
import { usePlayerStore } from "@/store/playerStore";
import { useTournamentStore } from "@/store/tournamentStore";
import { BackgroundLayer } from "@/components/top8/Canvas/BackgroundLayer";
import { PlayerLayer } from "@/components/top8/Canvas/PlayerLayer";
import { TournamentLayer } from "@/components/top8/Canvas/TournamentLayer";
import { simpleLayout } from "@/layouts/simple";

import styles from "./Canvas.module.scss";

type Props = {
  className?: string;
};

export const Canvas = ({ className }: Props) => {
  const layout = useCanvasStore((state) => state.layout);
  const canvasDispatch = useCanvasStore((state) => state.dispatch);
  const tournamentDispatch = useTournamentStore((state) => state.dispatch);
  const dispatch = usePlayerStore((state) => state.dispatch);

  const setStageRef = useCallback(
    (stage: KonvaStage | null) => {
      canvasDispatch({ type: "SET_STAGE_REF", payload: stage });
    },
    [canvasDispatch]
  );

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
    canvasDispatch({ type: "SET_LAYOUT", payload: simpleLayout });
  }, [canvasDispatch]);

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
          ref={setStageRef}
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
