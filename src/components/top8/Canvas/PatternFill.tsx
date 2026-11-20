import { memo, useMemo } from "react";
import { Group, Rect, Shape } from "react-konva";
import type { Context } from "konva/lib/Context";

import type { PatternElementConfig, Point } from "@/types/top8/Design";

type Props = {
  x: number;
  y: number;
  width: number;
  height: number;
  pattern: PatternElementConfig["pattern"];
  color: string;
  opacity?: number;
  spacing?: number;
  weight?: number;
  angle?: number;
  center?: Point;
  rays?: number;
};

// Tiles are drawn larger than design size and scaled down when used, so the
// pattern stays crisp at export pixel ratios.
const TILE_SCALE = 4;

const tileCache = new Map<string, HTMLCanvasElement>();

/** One repeat of a dot grid or of a set of horizontal lines. */
const getTile = (
  pattern: "dots" | "lines",
  color: string,
  spacing: number,
  weight: number,
): HTMLCanvasElement => {
  const key = `${pattern}|${color}|${spacing}|${weight}`;
  const cached = tileCache.get(key);
  if (cached) return cached;

  const size = Math.max(1, Math.round(spacing * TILE_SCALE));
  const tile = document.createElement("canvas");
  tile.width = size;
  tile.height = size;
  const ctx = tile.getContext("2d");
  if (ctx) {
    ctx.fillStyle = color;
    if (pattern === "dots") {
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, weight * TILE_SCALE, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillRect(0, 0, size, weight * TILE_SCALE);
    }
  }

  tileCache.set(key, tile);
  return tile;
};

const PATTERN_SCALE = { x: 1 / TILE_SCALE, y: 1 / TILE_SCALE };

/** A screentone filling a box: see `PatternElementConfig`. */
const PatternFillComponent = ({
  x,
  y,
  width,
  height,
  pattern,
  color,
  opacity = 1,
  spacing = 8,
  weight,
  angle = 0,
  center,
  rays = 48,
}: Props) => {
  const tile = useMemo(
    () =>
      pattern === "burst"
        ? undefined
        : getTile(pattern, color, spacing, weight ?? spacing / 4),
    [pattern, color, spacing, weight],
  );

  if (pattern !== "burst") {
    return (
      <Rect
        x={x}
        y={y}
        width={width}
        height={height}
        opacity={opacity}
        fillPatternImage={tile as unknown as HTMLImageElement}
        fillPatternScale={PATTERN_SCALE}
        fillPatternRotation={angle}
        listening={false}
      />
    );
  }

  const centerX = (center?.x ?? 0.5) * width;
  const centerY = (center?.y ?? 0.5) * height;
  // Long enough to reach the farthest corner from any centre in the box.
  const reach = Math.hypot(width, height);
  const coverage = Math.max(0, Math.min(1, weight ?? 0.3));

  const drawRays = (ctx: Context) => {
    const step = (Math.PI * 2) / rays;
    ctx.beginPath();
    for (let i = 0; i < rays; i++) {
      // Alternating widths, so the burst doesn't read as a neat wheel.
      const half = (step * coverage * (i % 3 === 0 ? 1.5 : 0.8)) / 2;
      const direction = (angle * Math.PI) / 180 + i * step;
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(
        centerX + Math.cos(direction - half) * reach,
        centerY + Math.sin(direction - half) * reach,
      );
      ctx.lineTo(
        centerX + Math.cos(direction + half) * reach,
        centerY + Math.sin(direction + half) * reach,
      );
      ctx.closePath();
    }
    ctx.fillStyle = color;
    ctx.fill();
  };

  return (
    <Group
      x={x}
      y={y}
      opacity={opacity}
      clipX={0}
      clipY={0}
      clipWidth={width}
      clipHeight={height}
      listening={false}
    >
      <Shape sceneFunc={drawRays} listening={false} />
    </Group>
  );
};

export const PatternFill = memo(PatternFillComponent);
