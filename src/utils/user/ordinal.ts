// 1 → "1st", 22 → "22nd". Japanese has one counter for every rank.
export const formatOrdinal = (n: number, locale: string): string => {
  if (locale.startsWith("ja")) return `${n}位`;
  const suffix =
    { one: "st", two: "nd", few: "rd", other: "th" }[
      new Intl.PluralRules("en", { type: "ordinal" }).select(n) as
        "one" | "two" | "few" | "other"
    ] ?? "th";
  return `${n}${suffix}`;
};
