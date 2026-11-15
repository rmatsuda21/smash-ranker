import { DesignPlaceholder } from "@/consts/top8/placeholders";

// The value of a RichTextInput as a list of units: a unit is one UTF-16 code
// unit of text or one whole placeholder token. Caret positions are offsets
// into that list. Nothing here touches the DOM.

const TOKEN_REGEX = /<[^<>]+>/g;
const KNOWN_TOKENS = new Set<string>(Object.values(DesignPlaceholder));

export const isToken = (unit: string | undefined): unit is string =>
  unit !== undefined && KNOWN_TOKENS.has(unit);

// Only known placeholders become units of their own; any other `<...>`
// stays as text.
export const toUnits = (value: string): string[] => {
  const units: string[] = [];
  let lastIndex = 0;
  for (const match of value.matchAll(TOKEN_REGEX)) {
    const token = match[0];
    const index = match.index ?? 0;
    if (!KNOWN_TOKENS.has(token)) continue;
    for (let i = lastIndex; i < index; i++) units.push(value[i]);
    units.push(token);
    lastIndex = index + token.length;
  }
  for (let i = lastIndex; i < value.length; i++) units.push(value[i]);
  return units;
};

export const unitsToValue = (units: string[], start = 0, end = units.length) =>
  units.slice(start, end).join("");

const segmenter =
  typeof Intl !== "undefined" && "Segmenter" in Intl
    ? new Intl.Segmenter(undefined, { granularity: "grapheme" })
    : null;

// Length of the character (grapheme cluster) at the start or end of `text`,
// so deleting an emoji or a combined character removes all of it.
const graphemeLength = (text: string, at: "start" | "end") => {
  if (!text) return 0;
  if (segmenter) {
    const parts = Array.from(segmenter.segment(text), (part) => part.segment);
    const part = at === "start" ? parts[0] : parts[parts.length - 1];
    return part.length;
  }
  const chars = Array.from(text);
  return (at === "start" ? chars[0] : chars[chars.length - 1]).length;
};

// The text run directly before or after an offset, up to the nearest token.
const textRun = (units: string[], offset: number, backward: boolean) => {
  let i = offset;
  if (backward) {
    while (i > 0 && !isToken(units[i - 1])) i--;
    return unitsToValue(units, i, offset);
  }
  while (i < units.length && !isToken(units[i])) i++;
  return unitsToValue(units, offset, i);
};

// Where a one-character move or delete from `offset` ends up.
export const charBoundary = (
  units: string[],
  offset: number,
  backward: boolean,
) => {
  if (backward) {
    if (offset <= 0) return 0;
    if (isToken(units[offset - 1])) return offset - 1;
    return offset - graphemeLength(textRun(units, offset, true), "end");
  }
  if (offset >= units.length) return units.length;
  if (isToken(units[offset])) return offset + 1;
  return offset + graphemeLength(textRun(units, offset, false), "start");
};

const isSpace = (unit: string | undefined) =>
  unit !== undefined && /\s/.test(unit);

// Where a word delete from `offset` ends up: past any spaces, then past one
// token or one run of non-space text.
export const wordBoundary = (
  units: string[],
  offset: number,
  backward: boolean,
) => {
  const step = backward ? -1 : 1;
  const at = (i: number) => units[backward ? i - 1 : i];
  let i = offset;
  while (isSpace(at(i))) i += step;
  if (isToken(at(i))) return i + step;
  while (at(i) !== undefined && !isSpace(at(i)) && !isToken(at(i))) i += step;
  return i;
};
