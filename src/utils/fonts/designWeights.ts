import { resolveRequestedWeight } from "./fontLoader";

const DEFAULT_WEIGHT = 400;

/**
 * Collects every font weight a design can ask for, so the loader can fetch
 * just those instead of every weight the family ships (Fontsource's static
 * japanese files are ~1 MB per weight).
 *
 * Walks the whole design rather than known element types: weights live on
 * text/smartText elements, but those nest inside groups, flex containers
 * and element templates. Any object carrying `fontWeight` or `fontStyle`
 * counts, resolved the same way `composeFontStyle` resolves it at render
 * time. 400 is always included because elements without a weight get it.
 *
 * The result is requested weights; the loader snaps them to what the
 * family actually has.
 */
export const collectDesignFontWeights = (design: unknown): number[] => {
  const weights = new Set<number>([DEFAULT_WEIGHT]);

  const visit = (node: unknown) => {
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    if (!node || typeof node !== "object") return;

    const record = node as Record<string, unknown>;
    if ("fontWeight" in record || "fontStyle" in record) {
      weights.add(
        resolveRequestedWeight(
          record.fontWeight as number | string | undefined,
          record.fontStyle as string | undefined,
        ),
      );
    }
    Object.values(record).forEach(visit);
  };

  visit(design);
  return [...weights].sort((a, b) => a - b);
};
