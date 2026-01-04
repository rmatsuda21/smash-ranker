import { PropsWithChildren, useEffect, useMemo, useRef } from "react";
import { Group } from "react-konva";
import Konva from "konva";
import { Group as KonvaGroup } from "konva/lib/Group";

import { ElementFilterConfig } from "@/types/top8/Design";

type FilterProps = {
  filters?: any[];
  red?: number;
  green?: number;
  blue?: number;
  blurRadius?: number;
};

const isFilterType =
  <T extends ElementFilterConfig["type"]>(type: T) =>
  (f: ElementFilterConfig): f is Extract<ElementFilterConfig, { type: T }> =>
    f.type === type;

const buildKonvaFilterProps = (
  filtersConfig?: ElementFilterConfig[]
): FilterProps => {
  if (!filtersConfig || filtersConfig.length === 0) return {};

  const filterFns: any[] = [];
  const rgb = filtersConfig.find(isFilterType("RGB"));
  const blur = filtersConfig.find(isFilterType("Blur"));

  for (const f of filtersConfig) {
    if (f.type === "Grayscale") filterFns.push(Konva.Filters.Grayscale);
    if (f.type === "Sepia") filterFns.push(Konva.Filters.Sepia);
    if (f.type === "RGB") filterFns.push(Konva.Filters.RGB);
    if (f.type === "Blur") filterFns.push(Konva.Filters.Blur);
  }

  const props: FilterProps = { filters: filterFns };
  if (rgb) {
    props.red = rgb.r;
    props.green = rgb.g;
    props.blue = rgb.b;
  }
  if (blur) {
    props.blurRadius = blur.radius;
  }

  return props;
};

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
  const filterProps = useMemo(
    () => buildKonvaFilterProps(filtersConfig),
    [filtersConfig]
  );

  useEffect(() => {
    const node = groupRef.current;
    if (!node) return;

    const hasFilters = (filterProps.filters?.length ?? 0) > 0;
    if (!hasFilters) {
      node.clearCache();
      return;
    }

    const raf = requestAnimationFrame(() => {
      node.cache();
    });

    return () => cancelAnimationFrame(raf);
  }, [
    filterProps.filters,
    filterProps.red,
    filterProps.green,
    filterProps.blue,
    filterProps.blurRadius,
    invalidateCacheKey,
  ]);

  return (
    <Group ref={groupRef} {...filterProps} {...rest}>
      {children}
    </Group>
  );
};
