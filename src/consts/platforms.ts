export type Platform = "startgg" | "challonge";

export const startggUrlToSlug = (url: string): string | null => {
  const match = url.trim().match(/tournament\/([^/]+)\/event\/([^/]+)/);
  return match ? `tournament/${match[1]}/event/${match[2]}` : null;
};

export const challongeUrlToSlug = (url: string): string | null => {
  const match = url.trim().match(/challonge\.com\/(?:[a-z]{2}\/)?([^/?#]+)/);
  return match ? match[1] : null;
};

export const detectPlatformAndSlug = (
  url: string,
): { platform: Platform; slug: string } | null => {
  const startggSlug = startggUrlToSlug(url);
  if (startggSlug) return { platform: "startgg", slug: startggSlug };

  const challongeSlug = challongeUrlToSlug(url);
  if (challongeSlug) return { platform: "challonge", slug: challongeSlug };

  return null;
};
