import { Line, Rect } from "react-konva";

import { ConicGradientRect } from "@/components/top8/Canvas/ConicGradientRect";
import { PatternFill } from "@/components/top8/Canvas/PatternFill";
import type {
  PatternElementConfig,
  PolygonElementConfig,
  RectElementConfig,
} from "@/types/top8/Design";
import type { ElementCreator } from "@/types/top8/ElementFactory";
import { resolveColor } from "@/utils/top8/resolveColor";
import {
  resolveLinearGradientProps,
  resolveRadialGradientProps,
} from "@/utils/top8/resolveGradient";
import { getElementKey } from "../elementKey";

export const createRectElement: ElementCreator<RectElementConfig> = ({
  element,
  index,
  context,
}) => {
  const palette = context.design?.colorPalette;
  const { fill } = element;
  const key = getElementKey(element, index);

  const shared = {
    x: element.position.x,
    y: element.position.y,
    cornerRadius: element.cornerRadius,
    perfectDrawEnabled: context.perfectDraw,
    stroke: resolveColor(element.stroke as string | undefined, palette),
    strokeWidth: element.strokeWidth,
  };

  const gradient = fill != null && typeof fill === "object" ? fill : undefined;

  // A real gradient needs at least two stops.
  if (gradient && gradient.colorStops.length >= 2) {
    const width = element.size?.width ?? 0;
    const height = element.size?.height ?? 0;

    if (gradient.type === "angular") {
      // Konva has no conic gradient fill, so this one paints itself.
      return (
        <ConicGradientRect
          key={key}
          {...shared}
          width={width}
          height={height}
          gradient={gradient}
          palette={palette}
        />
      );
    }

    const gradientProps =
      gradient.type === "linear"
        ? resolveLinearGradientProps(gradient, width, height, palette)
        : resolveRadialGradientProps(gradient, width, height, palette);

    return (
      <Rect
        key={key}
        {...shared}
        width={width}
        height={height}
        {...gradientProps}
      />
    );
  }

  // Solid fill: a plain color, or a degenerate gradient with one stop (its
  // color) or none (black).
  let solidFill: string;
  if (!gradient) {
    solidFill = resolveColor(fill as string | undefined, palette) ?? "black";
  } else if (gradient.colorStops.length === 1) {
    const { color } = gradient.colorStops[0];
    solidFill = resolveColor(color, palette) ?? color;
  } else {
    solidFill = "black";
  }

  return (
    <Rect
      key={key}
      {...shared}
      width={element.size?.width}
      height={element.size?.height}
      fill={solidFill}
    />
  );
};

export const createPolygonElement: ElementCreator<PolygonElementConfig> = ({
  element,
  index,
  context,
}) => {
  const palette = context.design?.colorPalette;

  return (
    <Line
      key={getElementKey(element, index)}
      x={element.position.x}
      y={element.position.y}
      points={element.points.flatMap((point) => [point.x, point.y])}
      closed
      fill={resolveColor(element.fill, palette)}
      stroke={resolveColor(element.stroke, palette)}
      strokeWidth={element.strokeWidth}
      lineJoin={element.lineJoin ?? "miter"}
      perfectDrawEnabled={context.perfectDraw}
    />
  );
};

export const createPatternElement: ElementCreator<PatternElementConfig> = ({
  element,
  index,
  context,
}) => (
  <PatternFill
    key={getElementKey(element, index)}
    x={element.position.x}
    y={element.position.y}
    width={element.size?.width ?? context.containerSize?.width ?? 100}
    height={element.size?.height ?? context.containerSize?.height ?? 100}
    pattern={element.pattern}
    color={
      resolveColor(element.color, context.design?.colorPalette) ?? "#000000"
    }
    opacity={element.opacity}
    spacing={element.spacing}
    weight={element.weight}
    angle={element.angle}
    center={element.center}
    rays={element.rays}
  />
);
