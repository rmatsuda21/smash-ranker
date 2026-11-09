// Shortens start.gg `fullRoundText` to the labels the community uses:
// "Winners Semi-Final" → "WSF", "Losers Round 3" → "LR3", "Grand Final
// Reset" → "GFR". Anything unrecognised is returned unchanged.
const STAGE: ReadonlyArray<readonly [RegExp, string]> = [
  [/^grand\s*finals?\s*reset$/, "GFR"],
  [/^grand\s*finals?$/, "GF"],
  [/^quarter-?\s*finals?$/, "QF"],
  [/^semi-?\s*finals?$/, "SF"],
  [/^finals?$/, "F"],
  [/^round\s*(\d+)$/, "R$1"],
];

export const abbreviateRound = (fullRoundText: string): string => {
  const text = fullRoundText.trim();
  const m = text.match(/^(winners?|losers?)?\s*(.*)$/i);
  if (!m) return fullRoundText;
  const side = m[1] ? m[1][0].toUpperCase() : "";
  const rest = m[2].toLowerCase();
  for (const [re, out] of STAGE) {
    if (re.test(rest)) return side + rest.replace(re, out);
  }
  return fullRoundText;
};
