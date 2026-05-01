import { Text as KonvaTextNode } from "konva/lib/shapes/Text";

import { TextElement } from "@/types/thumbnail/ThumbnailDesign";

const measureNode = new KonvaTextNode({});

export const measureTextSize = (params: {
  text: string;
  fontFamily: string;
  fontStyle?: string;
  fontSize: number;
  width: number;
  align?: string;
  letterSpacing?: number;
  lineHeight?: number;
}): { width: number; height: number } => {
  measureNode.setAttrs({
    text: params.text || " ",
    fontFamily: params.fontFamily,
    fontStyle: params.fontStyle ?? "normal",
    fontSize: params.fontSize,
    width: params.width,
    align: params.align ?? "left",
    letterSpacing: params.letterSpacing ?? 0,
    lineHeight: params.lineHeight ?? 1,
    wrap: "word",
  });
  return {
    width: measureNode.width(),
    height: measureNode.height(),
  };
};

const MIN_FONT_SIZE = 4;

export const computeAutoFitFontSize = (element: TextElement): number => {
  if (!element.text.trim() || element.width <= 0 || element.height <= 0) {
    return Math.max(MIN_FONT_SIZE, element.fontSize);
  }

  let lo = MIN_FONT_SIZE;
  let hi = element.fontSize;

  const fits = (size: number): boolean => {
    const m = measureTextSize({
      text: element.text,
      fontFamily: element.fontFamily,
      fontStyle: element.fontStyle,
      fontSize: size,
      width: element.width,
      align: element.align,
      letterSpacing: element.letterSpacing,
      lineHeight: element.lineHeight,
    });
    return m.height <= element.height;
  };

  if (fits(hi)) return hi;
  if (!fits(lo)) return lo;

  for (let i = 0; i < 14; i++) {
    if (hi - lo <= 0.5) break;
    const mid = (lo + hi) / 2;
    if (fits(mid)) {
      lo = mid;
    } else {
      hi = mid;
    }
  }

  return Math.max(MIN_FONT_SIZE, Math.floor(lo));
};
