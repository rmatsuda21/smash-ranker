import { useMemo } from "react";
import { Group, Layer, Text } from "react-konva";

import { useCanvasStore } from "@/store/canvasStore";
import { useTournamentStore } from "@/store/tournamentStore";
import { TextElementConfig } from "@/types/top8/Layout";
import { getTournamentElements } from "@/utils/layoutHelpers";

export const TournamentLayer = () => {
  const selectedFont = useCanvasStore((state) => state.selectedFont);
  const info = useTournamentStore((state) => state.info);
  const layout = useCanvasStore((state) => state.layout);

  const elements = useMemo(
    () => getTournamentElements(layout.tournament, info),
    [layout?.tournament, info]
  );

  return (
    <Layer>
      <Group
        width={layout?.canvas.size.width}
        height={layout?.canvas.size.height}
      >
        {elements
          .filter(
            (element): element is TextElementConfig =>
              element && "type" in element && element.type === "text"
          )
          .map((element, index) => (
            <Text
              key={`text-${index}`}
              x={element.x}
              y={element.y}
              fill={element.fill || "white"}
              fontSize={element.fontSize || 20}
              fontStyle={
                element.fontStyle || String(element.fontWeight || "normal")
              }
              fontFamily={selectedFont}
              text={element.text}
              align={element.align || "left"}
              width={element.width}
            />
          ))}
      </Group>
    </Layer>
  );
};
