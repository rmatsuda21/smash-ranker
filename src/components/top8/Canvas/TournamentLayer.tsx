import { useMemo } from "react";
import { Group, Layer } from "react-konva";

import { useCanvasStore } from "@/store/canvasStore";
import { useTournamentStore } from "@/store/tournamentStore";
import { createKonvaElements } from "@/utils/top8/elementFactory";

export const TournamentLayer = () => {
  const selectedFont = useCanvasStore((state) => state.selectedFont);
  const tournament = useTournamentStore((state) => state.info);
  const layout = useCanvasStore((state) => state.layout);

  const konvaElements = useMemo(
    () =>
      createKonvaElements(layout.tournament?.elements ?? [], {
        fontFamily: selectedFont,
        tournament,
        containerSize: layout?.canvas.size,
      }),
    [layout.tournament?.elements, selectedFont, tournament, layout?.canvas.size]
  );

  return (
    <Layer>
      <Group
        width={layout?.canvas.size.width}
        height={layout?.canvas.size.height}
      >
        {konvaElements}
      </Group>
    </Layer>
  );
};
