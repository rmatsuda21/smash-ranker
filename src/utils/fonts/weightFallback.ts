// W3C font-weight matching algorithm — given a list of available weights
// for a family and a requested weight, return the closest available weight.
//
// https://www.w3.org/TR/css-fonts-4/#font-style-matching

export const pickClosestWeight = (
  target: number,
  available: number[]
): number => {
  if (available.length === 0) return target;
  if (available.includes(target)) return target;

  const sorted = [...available].sort((a, b) => a - b);

  if (target >= 400 && target <= 500) {
    const upToFiveHundred = sorted.find((w) => w > target && w <= 500);
    if (upToFiveHundred !== undefined) return upToFiveHundred;
    const below = [...sorted].reverse().find((w) => w < target);
    if (below !== undefined) return below;
    const aboveFiveHundred = sorted.find((w) => w > 500);
    if (aboveFiveHundred !== undefined) return aboveFiveHundred;
    return sorted[0];
  }

  if (target < 400) {
    const below = [...sorted].reverse().find((w) => w < target);
    if (below !== undefined) return below;
    const above = sorted.find((w) => w > target);
    if (above !== undefined) return above;
    return sorted[0];
  }

  const above = sorted.find((w) => w > target);
  if (above !== undefined) return above;
  const below = [...sorted].reverse().find((w) => w < target);
  if (below !== undefined) return below;
  return sorted[sorted.length - 1];
};
