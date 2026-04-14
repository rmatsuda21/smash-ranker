import type { Design } from "@/types/top8/Design";
import type {
  GradientColorStop,
  LinearGradientConfig,
  RadialGradientConfig,
} from "@/types/top8/Gradient";
import { resolveColor } from "@/utils/top8/resolveColor";

/** Resolve palette key references in gradient stops */
export const resolveGradientStops = (
  stops: GradientColorStop[],
  palette?: Design["colorPalette"]
): GradientColorStop[] =>
  stops.map((s) => ({
    position: Math.max(0, Math.min(1, s.position)),
    color: resolveColor(s.color, palette) ?? s.color,
  }));

/** Flatten resolved stops to Konva's [pos, color, pos, color, ...] format */
export const toKonvaColorStops = (
  stops: GradientColorStop[]
): (number | string)[] => stops.flatMap((s) => [s.position, s.color]);

/**
 * Convert a CSS-convention angle to Konva start/end points.
 * CSS: 0° = bottom→top, 90° = left→right, clockwise.
 * We project the gradient line through the rect center so it covers the full rect.
 */
export const linearAngleToPoints = (
  angleDeg: number,
  width: number,
  height: number
): { start: { x: number; y: number }; end: { x: number; y: number } } => {
  // Convert CSS angle to math angle (radians)
  // CSS 0° = up (negative y), clockwise. Math 0° = right, counter-clockwise.
  const rad = ((angleDeg + 180) * Math.PI) / 180;

  const cx = width / 2;
  const cy = height / 2;

  // Direction vector
  const dx = Math.sin(rad);
  const dy = -Math.cos(rad);

  // Project to find how far the gradient line extends through the center
  // to cover the entire rect (half-diagonal projection)
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);
  const halfLength =
    absDx < 1e-10 && absDy < 1e-10
      ? 0
      : (absDx * width + absDy * height) / (2 * (absDx * absDx + absDy * absDy));

  return {
    start: { x: cx - dx * halfLength, y: cy + dy * halfLength },
    end: { x: cx + dx * halfLength, y: cy - dy * halfLength },
  };
};

/** Returns Konva linear gradient props for a rect of given size */
export const resolveLinearGradientProps = (
  config: LinearGradientConfig,
  width: number,
  height: number,
  palette?: Design["colorPalette"]
) => {
  const resolved = resolveGradientStops(config.colorStops, palette);
  const { start, end } = linearAngleToPoints(config.angle, width, height);
  return {
    fillLinearGradientStartPoint: start,
    fillLinearGradientEndPoint: end,
    fillLinearGradientColorStops: toKonvaColorStops(resolved),
  };
};

/** Returns Konva radial gradient props for a rect of given size */
export const resolveRadialGradientProps = (
  config: RadialGradientConfig,
  width: number,
  height: number,
  palette?: Design["colorPalette"]
) => {
  const resolved = resolveGradientStops(config.colorStops, palette);
  const cx = (config.center?.x ?? 0.5) * width;
  const cy = (config.center?.y ?? 0.5) * height;
  const radius = Math.max(width, height) / 2;
  return {
    fillRadialGradientStartPoint: { x: cx, y: cy },
    fillRadialGradientEndPoint: { x: cx, y: cy },
    fillRadialGradientStartRadius: 0,
    fillRadialGradientEndRadius: radius,
    fillRadialGradientColorStops: toKonvaColorStops(resolved),
  };
};
