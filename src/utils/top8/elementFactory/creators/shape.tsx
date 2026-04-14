import { Rect } from "react-konva";

import { ConicGradientRect } from "@/components/top8/Canvas/ConicGradientRect";
import type { RectElementConfig } from "@/types/top8/Design";
import type { ElementCreator } from "@/types/top8/ElementFactory";
import { resolveColor } from "@/utils/top8/resolveColor";
import {
  resolveLinearGradientProps,
  resolveRadialGradientProps,
} from "@/utils/top8/resolveGradient";

export const createRectElement: ElementCreator<RectElementConfig> = ({
  element,
  index,
  context,
}) => {
  const { design } = context;
  const { fill } = element;
  const key = element.id ?? `rect-${index}`;
  const stroke = resolveColor(
    element.stroke as string | undefined,
    design?.colorPalette
  );

  // Gradient fill
  if (fill != null && typeof fill === "object") {
    // Edge case: empty or single-stop → fall back to solid
    if (fill.colorStops.length === 0) {
      return (
        <Rect
          key={key}
          x={element.position.x}
          y={element.position.y}
          width={element.size?.width}
          height={element.size?.height}
          fill="black"
          cornerRadius={element.cornerRadius}
          perfectDrawEnabled={context.perfectDraw}
          stroke={stroke}
          strokeWidth={element.strokeWidth}
        />
      );
    }

    if (fill.colorStops.length === 1) {
      const solidColor =
        resolveColor(fill.colorStops[0].color, design?.colorPalette) ??
        fill.colorStops[0].color;
      return (
        <Rect
          key={key}
          x={element.position.x}
          y={element.position.y}
          width={element.size?.width}
          height={element.size?.height}
          fill={solidColor}
          cornerRadius={element.cornerRadius}
          perfectDrawEnabled={context.perfectDraw}
          stroke={stroke}
          strokeWidth={element.strokeWidth}
        />
      );
    }

    const w = element.size?.width ?? 0;
    const h = element.size?.height ?? 0;

    if (fill.type === "linear") {
      const gradientProps = resolveLinearGradientProps(
        fill,
        w,
        h,
        design?.colorPalette
      );
      return (
        <Rect
          key={key}
          x={element.position.x}
          y={element.position.y}
          width={w}
          height={h}
          {...gradientProps}
          cornerRadius={element.cornerRadius}
          perfectDrawEnabled={context.perfectDraw}
          stroke={stroke}
          strokeWidth={element.strokeWidth}
        />
      );
    }

    if (fill.type === "radial") {
      const gradientProps = resolveRadialGradientProps(
        fill,
        w,
        h,
        design?.colorPalette
      );
      return (
        <Rect
          key={key}
          x={element.position.x}
          y={element.position.y}
          width={w}
          height={h}
          {...gradientProps}
          cornerRadius={element.cornerRadius}
          perfectDrawEnabled={context.perfectDraw}
          stroke={stroke}
          strokeWidth={element.strokeWidth}
        />
      );
    }

    if (fill.type === "angular") {
      return (
        <ConicGradientRect
          key={key}
          x={element.position.x}
          y={element.position.y}
          width={w}
          height={h}
          gradient={fill}
          palette={design?.colorPalette}
          cornerRadius={element.cornerRadius}
          perfectDrawEnabled={context.perfectDraw}
          stroke={stroke}
          strokeWidth={element.strokeWidth}
        />
      );
    }
  }

  // Solid fill (string or undefined) — existing path
  return (
    <Rect
      key={key}
      x={element.position.x}
      y={element.position.y}
      width={element.size?.width}
      height={element.size?.height}
      fill={resolveColor(fill, design?.colorPalette) ?? "black"}
      cornerRadius={element.cornerRadius}
      perfectDrawEnabled={context.perfectDraw}
      stroke={stroke}
      strokeWidth={element.strokeWidth}
    />
  );
};
