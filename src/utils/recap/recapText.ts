import type { RecapRunSet } from "@/types/recap/Recap";

// Kana, kanji and full-width forms: about twice as wide as Latin letters.
const WIDE_CHAR = /[\u{3000}-\u{9fff}\u{ff00}-\u{ffef}]/u;

// A font size (in `cqw`) at which `text` fits in `width`, never above `max`.
// The display face is condensed: a Latin letter is about half an em wide.
export const fitSize = (text: string, max: number, width: number): number => {
  const ems = [...text].reduce(
    (sum, char) => sum + (WIDE_CHAR.test(char) ? 1 : 0.52),
    0,
  );
  return Math.round(Math.min(max, width / Math.max(1, ems)) * 10) / 10;
};

export const formatScore = (score: RecapRunSet["score"]): string =>
  score ? `${score.mine}–${score.theirs}` : "";

// A stable hue for a tag, for avatars with no picture.
export const hueOf = (name: string): number => {
  let hue = 0;
  for (let i = 0; i < name.length; i++) {
    hue = (hue * 31 + name.charCodeAt(i)) % 360;
  }
  return hue;
};

// start.gg's round names are English; these are their Japanese readings.
export const roundLabel = (round: string, locale: string): string => {
  if (!locale.startsWith("ja")) return round;
  return round
    .replace("Grand Final Reset", "グランドファイナル リセット")
    .replace("Grand Final", "グランドファイナル")
    .replace(/Round (\d+)/, "$1回戦")
    .replace("Quarter-Final", "準々決勝")
    .replace("Semi-Final", "準決勝")
    .replace("Final", "決勝")
    .replace("Winners", "勝者側")
    .replace("Losers", "敗者側");
};

export const countryName = (code: string, locale: string): string => {
  try {
    return new Intl.DisplayNames([locale], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
};

export const monthName = (
  month: number,
  locale: string,
  style: "long" | "short" = "long",
): string =>
  new Intl.DateTimeFormat(locale, { month: style }).format(
    new Date(2026, month, 1),
  );

export const weekdayName = (day: number, locale: string): string =>
  // 4 January 2026 is a Sunday.
  new Intl.DateTimeFormat(locale, { weekday: "long" }).format(
    new Date(2026, 0, 4 + day),
  );
