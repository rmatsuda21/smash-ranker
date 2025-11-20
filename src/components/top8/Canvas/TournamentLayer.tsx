import { Group, Layer, Text } from "react-konva";

import { useCanvasStore } from "@/store/canvasStore";
import { useTournamentStore } from "@/store/tournamentStore";

export const TournamentLayer = () => {
  const canvasSize = useCanvasStore((state) => state.size);
  const selectedFont = useCanvasStore((state) => state.selectedFont);

  const info = useTournamentStore((state) => state.info);

  return (
    <Layer>
      <Group width={canvasSize.width} height={canvasSize.height}>
        <Text
          x={0}
          y={0}
          fill="white"
          fontSize={50}
          fontStyle="bold"
          fontFamily={selectedFont}
          text={info.tournamentName}
        />
        <Text
          x={0}
          y={50}
          fill="white"
          fontSize={50}
          fontStyle="bold"
          fontFamily={selectedFont}
          text={info.eventName}
        />
        <Text
          x={0}
          y={100}
          fill="white"
          fontSize={50}
          fontStyle="bold"
          fontFamily={selectedFont}
          text={info.date.toLocaleDateString()}
        />
      </Group>
    </Layer>
  );
};
