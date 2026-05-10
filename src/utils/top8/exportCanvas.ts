import { Stage } from "konva/lib/Stage";
import { flushSync } from "react-dom";

import { usePlayerStore } from "@/store/playerStore";
import { useTournamentStore } from "@/store/tournamentStore";

type ExportOptions = {
  stageRef: Stage;
  pixelRatio?: number;
  mimeType?: string;
  quality?: number;
};

export const exportCanvasToPngBlob = async ({
  stageRef,
  pixelRatio = 2,
  mimeType = "image/png",
  quality = 1,
}: ExportOptions): Promise<Blob | null> => {
  flushSync(() => {
    usePlayerStore.getState().dispatch({ type: "CLEAR_SELECTED_PLAYER" });
    useTournamentStore.getState().dispatch({ type: "CLEAR_SELECTED_ELEMENT" });
  });

  const canvas = stageRef.toCanvas({ pixelRatio });

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), mimeType, quality),
  );

  canvas.width = 0;
  canvas.height = 0;

  return blob;
};
