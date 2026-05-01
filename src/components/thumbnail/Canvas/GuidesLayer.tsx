import { Layer, Line } from "react-konva";

import { SnapGuide } from "@/utils/thumbnail/snapping";
import { ThumbnailDesign } from "@/types/thumbnail/ThumbnailDesign";

type Props = {
  guides: SnapGuide[];
  canvasSize: ThumbnailDesign["canvasSize"];
  showGrid: boolean;
  gridSize: number;
};

export const GuidesLayer = ({
  guides,
  canvasSize,
  showGrid,
  gridSize,
}: Props) => {
  const gridLines: { x1: number; y1: number; x2: number; y2: number }[] = [];
  if (showGrid && gridSize > 0) {
    for (let x = gridSize; x < canvasSize.width; x += gridSize) {
      gridLines.push({ x1: x, y1: 0, x2: x, y2: canvasSize.height });
    }
    for (let y = gridSize; y < canvasSize.height; y += gridSize) {
      gridLines.push({ x1: 0, y1: y, x2: canvasSize.width, y2: y });
    }
  }

  return (
    <Layer listening={false}>
      {gridLines.map((l, i) => (
        <Line
          key={`grid-${i}`}
          points={[l.x1, l.y1, l.x2, l.y2]}
          stroke="rgba(120, 180, 255, 0.18)"
          strokeWidth={1}
        />
      ))}
      {guides.map((g, i) =>
        g.axis === "x" ? (
          <Line
            key={`guide-x-${i}`}
            points={[g.position, g.start, g.position, g.end]}
            stroke="#ff3ec9"
            strokeWidth={1}
            dash={[6, 4]}
          />
        ) : (
          <Line
            key={`guide-y-${i}`}
            points={[g.start, g.position, g.end, g.position]}
            stroke="#ff3ec9"
            strokeWidth={1}
            dash={[6, 4]}
          />
        ),
      )}
    </Layer>
  );
};
