import { PropsWithChildren, useEffect, useMemo, useRef } from "react";
import { Group } from "react-konva";
import Konva from "konva";
import { Group as KonvaGroup } from "konva/lib/Group";

import { ElementFilterConfig } from "@/types/top8/Design";

/** Konva's filter system requires a cached scene canvas regardless of filter
 *  type. We cap the cache area so a single filtered element can't blow the
 *  mobile memory budget. CSS-string filters keep us on Konva's native path
 *  (uses `ctx.filter` attr, skips the `getImageData` round-trip). */
const MAX_CACHE_AREA = 30_000;

/** RGB has no CSS equivalent and only works through the function-filter path.
 *  Tighter cap because this path also pays the imageData allocation. */
const RGB_MAX_CACHE_AREA = 20_000;

const cssFilterStringFor = (
  filtersConfig: ElementFilterConfig[],
): string | undefined => {
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
  return parts.length ? parts.join(" ") : undefined;
};

type MobileFilteredGroupProps = PropsWithChildren<
  React.ComponentProps<typeof Group> & {
    filtersConfig?: ElementFilterConfig[];
    invalidateCacheKey?: unknown;
  }
>;

export const MobileFilteredGroup = ({
  filtersConfig,
  // invalidateCacheKey is accepted for API symmetry with FilteredGroup but
  // not used: the mobile path runs cache() once on mount via the filters
  // dependency and never reacts to live content edits.
  invalidateCacheKey,
  children,
  ...rest
}: MobileFilteredGroupProps) => {
  void invalidateCacheKey;
  const groupRef = useRef<KonvaGroup>(null);

  const rgb = useMemo(
    () =>
      filtersConfig?.find(
        (f): f is Extract<ElementFilterConfig, { type: "RGB" }> =>
          f.type === "RGB",
      ),
    [filtersConfig],
  );

  const cssFilter = useMemo(
    () =>
      filtersConfig?.length ? cssFilterStringFor(filtersConfig) : undefined,
    [filtersConfig],
  );

  // Konva's `filters` prop accepts strings (CSS filter syntax) for its native
  // path, plus function filters for cases like RGB.
  const filters = useMemo(() => {
    const result: (string | typeof Konva.Filters.RGB)[] = [];
    if (cssFilter) result.push(cssFilter);
    if (rgb) result.push(Konva.Filters.RGB);
    return result.length ? result : undefined;
  }, [cssFilter, rgb]);

  useEffect(() => {
    const node = groupRef.current;
    if (!node) return;
    if (!filters) {
      node.clearCache();
      return;
    }

    const raf = requestAnimationFrame(() => {
      const n = groupRef.current;
      if (!n) return;
      const { width, height } = n.getClientRect();
      const area = width * height;
      const cap = rgb ? RGB_MAX_CACHE_AREA : MAX_CACHE_AREA;
      if (area <= 0 || area > cap) {
        // Filtered element is too large to cache safely — drop the filter
        // rather than risk OOM. Element still renders, just unfiltered.
        n.clearCache();
        return;
      }
      n.cache({ offset: 2 });
    });

    return () => cancelAnimationFrame(raf);
  }, [filters, rgb]);

  return (
    <Group
      ref={groupRef}
      filters={filters}
      red={rgb?.r}
      green={rgb?.g}
      blue={rgb?.b}
      {...rest}
    >
      {children}
    </Group>
  );
};
