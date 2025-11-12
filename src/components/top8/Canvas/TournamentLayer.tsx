import { Layer, Text } from "react-konva";

import { useCanvasStore } from "@/store/canvasStore";
import { useTournamentStore } from "@/store/tournamentStore";

export const TournamentLayer = () => {
  const canvasSize = useCanvasStore((state) => state.size);
  const selectedFont = useCanvasStore((state) => state.selectedFont);

  const tournamentName = useTournamentStore((state) => state.name);

  return (
    <Layer width={canvasSize.width} height={canvasSize.height}>
      <Text
        fill="white"
        fontSize={100}
        fontFamily={selectedFont}
        text={tournamentName}
      />
    </Layer>
  );
};
