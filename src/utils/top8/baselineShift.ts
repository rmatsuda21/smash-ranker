/** Cap height as a fraction of the font size in most sans-serifs (Noto Sans
 *  JP 0.73, Dela Gothic One 0.73). */
const CAP_HEIGHT_RATIO = 0.73;

/**
 * Vertical offset that puts middle-aligned text of `fontSize` on the baseline
 * of middle-aligned text of `referenceFontSize` in a box centred on the same
 * line.
 *
 * Middle alignment centres each text's capitals, so two sizes side by side
 * share a centre line but not a baseline: the smaller one floats above it by
 * half the difference in cap height. Add the result to the element's
 * `position.y` (positive moves down).
 */
export const baselineShift = (fontSize: number, referenceFontSize: number) =>
  ((referenceFontSize - fontSize) * CAP_HEIGHT_RATIO) / 2;
