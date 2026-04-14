import Konva from "konva";
import { memo, useMemo } from "react";
import { Shape } from "react-konva";

import type { Design } from "@/types/top8/Design";
import type { AngularGradientConfig } from "@/types/top8/Gradient";
import { resolveGradientStops } from "@/utils/top8/resolveGradient";

interface ConicGradientRectProps {
  x: number;
  y: number;
  width: number;
  height: number;
  gradient: AngularGradientConfig;
  palette?: Design["colorPalette"];
  cornerRadius?: number | number[];
  perfectDrawEnabled?: boolean;
  stroke?: string;
  strokeWidth?: number;
}

export const ConicGradientRect = memo(function ConicGradientRect({
  x,
  y,
  width,
  height,
  gradient,
  palette,
  cornerRadius,
  perfectDrawEnabled,
  stroke,
  strokeWidth,
}: ConicGradientRectProps) {
  const resolvedStops = useMemo(
    () => resolveGradientStops(gradient.colorStops, palette),
    [gradient.colorStops, palette]
  );

  const sceneFunc = useMemo(() => {
    const cx = (gradient.center?.x ?? 0.5) * width;
    const cy = (gradient.center?.y ?? 0.5) * height;
    // Convert CSS angle (0° = top, clockwise) to canvas angle (radians, 0 = right)
    const startAngle = ((gradient.angle ?? 0) - 90) * (Math.PI / 180);

    return (ctx: Konva.Context) => {
      const nativeCtx = ctx._context;

      // Draw rect path
      if (cornerRadius) {
        Konva.Util.drawRoundedRectPath(ctx, width, height, cornerRadius);
      } else {
        ctx.rect(0, 0, width, height);
      }

      // Create and apply conic gradient
      const conicGrad = nativeCtx.createConicGradient(startAngle, cx, cy);
      for (const stop of resolvedStops) {
        conicGrad.addColorStop(stop.position, stop.color);
      }
      nativeCtx.fillStyle = conicGrad;
      nativeCtx.fill();

      // Stroke separately if needed
      if (stroke && strokeWidth) {
        nativeCtx.strokeStyle = stroke;
        nativeCtx.lineWidth = strokeWidth;
        nativeCtx.stroke();
      }
    };
  }, [
    width,
    height,
    gradient.center?.x,
    gradient.center?.y,
    gradient.angle,
    cornerRadius,
    resolvedStops,
    stroke,
    strokeWidth,
  ]);

  return (
    <Shape
      x={x}
      y={y}
      width={width}
      height={height}
      sceneFunc={sceneFunc}
      perfectDrawEnabled={perfectDrawEnabled}
    />
  );
});
