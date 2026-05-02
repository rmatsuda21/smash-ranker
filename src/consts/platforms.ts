export type Platform = "startgg" | "challonge" | "tonamel";

export const startggUrlToSlug = (url: string): string | null => {
  const match = url.trim().match(/tournament\/([^/]+)\/event\/([^/]+)/);
  return match ? `tournament/${match[1]}/event/${match[2]}` : null;
};

export const challongeUrlToSlug = (url: string): string | null => {
  const match = url.trim().match(/challonge\.com\/(?:[a-z]{2}\/)?([^/?#]+)/);
  return match ? match[1] : null;
};

export const tonamelUrlToSlug = (url: string): string | null => {
  const match = url.trim().match(/tonamel\.com\/competition\/([^/?#]+)/);
  return match ? match[1] : null;
};

export const detectPlatformAndSlug = (
  url: string,
): { platform: Platform; slug: string } | null => {
  const startggSlug = startggUrlToSlug(url);
  if (startggSlug) return { platform: "startgg", slug: startggSlug };

  const challongeSlug = challongeUrlToSlug(url);
  if (challongeSlug) return { platform: "challonge", slug: challongeSlug };

  const tonamelSlug = tonamelUrlToSlug(url);
  if (tonamelSlug) return { platform: "tonamel", slug: tonamelSlug };

  return null;
};

export const slugToUrl = (platform: Platform, slug: string): string => {
  switch (platform) {
    case "startgg":
      return `https://start.gg/${slug}`;
    case "challonge":
      return `https://challonge.com/${slug}`;
    case "tonamel":
      return `https://tonamel.com/competition/${slug}`;
  }
};
