import { PropsWithChildren, useEffect, useMemo, useRef } from "react";
import { Group } from "react-konva";
import Konva from "konva";
import { Group as KonvaGroup } from "konva/lib/Group";

import { ElementFilterConfig } from "@/types/top8/Design";
import {
  useBitmapScale,
  useRenderProfile,
} from "@/components/top8/Canvas/RenderProfileContext";
import type { RenderProfile } from "@/utils/top8/renderProfile";

type KonvaFilter = string | (typeof Konva.Filters)[keyof typeof Konva.Filters];

type FilterProps = {
  filters?: KonvaFilter[];
  brightness?: number;
  red?: number;
  green?: number;
  blue?: number;
  blurRadius?: number;
  /** True when applying the filters reads the cache back with
   *  `getImageData` instead of staying on the GPU-backed `ctx.filter` path. */
  usesImageData: boolean;
};

const NO_FILTERS: FilterProps = { usesImageData: false };

/** Without `ctx.filter` (Safari before 18) Konva converts CSS filter strings
 *  back into pixel filters, so the "native" path costs the same as the
 *  function path there. */
const SUPPORTS_CANVAS_FILTER =
  typeof CanvasRenderingContext2D !== "undefined" &&
  "filter" in CanvasRenderingContext2D.prototype;

const isFilterType =
  <T extends ElementFilterConfig["type"]>(type: T) =>
  (f: ElementFilterConfig): f is Extract<ElementFilterConfig, { type: T }> =>
    f.type === type;

/** Konva's pixel filters, configured through node attributes. */
const buildFunctionFilterProps = (
  filtersConfig: ElementFilterConfig[],
): FilterProps => {
  const filters: KonvaFilter[] = [];
  for (const f of filtersConfig) {
    if (f.type === "Grayscale") filters.push(Konva.Filters.Grayscale);
    if (f.type === "Sepia") filters.push(Konva.Filters.Sepia);
    if (f.type === "RGB") filters.push(Konva.Filters.RGB);
    if (f.type === "Blur") filters.push(Konva.Filters.Blur);
    if (f.type === "Brightness") filters.push(Konva.Filters.Brightness);
  }

  const rgb = filtersConfig.find(isFilterType("RGB"));
  return {
    filters,
    red: rgb?.r,
    green: rgb?.g,
    blue: rgb?.b,
    blurRadius: filtersConfig.find(isFilterType("Blur"))?.radius,
    brightness: filtersConfig.find(isFilterType("Brightness"))?.brightness,
    usesImageData: true,
  };
};

/** One CSS filter string for everything CSS can express, plus Konva's RGB
 *  pixel filter, which has no CSS equivalent. */
const buildCssFilterProps = (
  filtersConfig: ElementFilterConfig[],
): FilterProps => {
  const parts: string[] = [];
  for (const f of filtersConfig) {
    switch (f.type) {
      case "Brightness":
        // Konva: −1 (black) … 0 (no change) … 1 (white)
        // CSS:    0 (black) … 1 (no change) … 2 (white)
        parts.push(`brightness(${(f.brightness + 1).toFixed(3)})`);
        break;
      case "Blur":
        parts.push(`blur(${f.radius}px)`);
        break;
      case "Sepia":
        parts.push("sepia(1)");
        break;
      case "Grayscale":
        parts.push("grayscale(1)");
        break;
    }
  }

  const rgb = filtersConfig.find(isFilterType("RGB"));
  const filters: KonvaFilter[] = [];
  if (parts.length) filters.push(parts.join(" "));
  if (rgb) filters.push(Konva.Filters.RGB);
  if (filters.length === 0) return NO_FILTERS;

  return {
    filters,
    red: rgb?.r,
    green: rgb?.g,
    blue: rgb?.b,
    usesImageData: Boolean(rgb) || !SUPPORTS_CANVAS_FILTER,
  };
};

const buildFilterProps = (
  filtersConfig: ElementFilterConfig[] | undefined,
  strategy: RenderProfile["filters"]["strategy"],
): FilterProps => {
  if (!filtersConfig || filtersConfig.length === 0) return NO_FILTERS;
  return strategy === "css"
    ? buildCssFilterProps(filtersConfig)
    : buildFunctionFilterProps(filtersConfig);
};

/**
 * A group whose content is drawn through Konva filters. Konva can only filter
 * a cached node, so the group is rasterized after each content change
 * (`invalidateCacheKey`) and the filters run on that bitmap.
 */
export const FilteredGroup = ({
  filtersConfig,
  invalidateCacheKey,
  children,
  ...rest
}: PropsWithChildren<
  React.ComponentProps<typeof Group> & {
    filtersConfig?: ElementFilterConfig[];
    invalidateCacheKey?: unknown;
  }
>) => {
  const groupRef = useRef<KonvaGroup>(null);
  const profile = useRenderProfile();
  const bitmapScale = useBitmapScale();

  const { usesImageData, ...filterProps } = useMemo(
    () => buildFilterProps(filtersConfig, profile.filters.strategy),
    [filtersConfig, profile.filters.strategy],
  );
  const maxArea = usesImageData
    ? profile.filters.maxImageDataArea
    : profile.filters.maxNativeArea;

  useEffect(() => {
    const node = groupRef.current;
    if (!node) return;

    if (!filterProps.filters) {
      node.clearCache();
      return;
    }

    const raf = requestAnimationFrame(() => {
      const n = groupRef.current;
      if (!n) return;

      // Nothing to rasterize yet (e.g. the image inside is still loading),
      // or too large to cache within this profile's memory budget. Either
      // way the element renders unfiltered rather than risking an OOM.
      const { width, height } = n.getClientRect({ skipTransform: true });
      const area = width * height;
      if (area <= 0 || area > maxArea) {
        n.clearCache();
        return;
      }

      // Explicit ratio so the cache is as dense as the export needs, not
      // whatever backing ratio the on-screen stage happens to use.
      n.cache({ offset: 4, pixelRatio: bitmapScale });
    });

    return () => cancelAnimationFrame(raf);
  }, [
    filterProps.filters,
    filterProps.brightness,
    filterProps.red,
    filterProps.green,
    filterProps.blue,
    filterProps.blurRadius,
    invalidateCacheKey,
    maxArea,
    bitmapScale,
  ]);

  return (
    <Group ref={groupRef} {...filterProps} {...rest}>
      {children}
    </Group>
  );
};
