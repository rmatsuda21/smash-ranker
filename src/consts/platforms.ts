export type Platform = "startgg" | "challonge" | "tonamel" | "hivee";

// Each platform's name as it is written. Not translated.
export const PLATFORM_LABELS: Record<Platform, string> = {
  startgg: "start.gg",
  challonge: "Challonge",
  tonamel: "Tonamel",
  hivee: "Hivee",
};

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

// "<event>" or "<event>/<program id>": the event is its id or the name in a
// short URL, the program is the `?p=` of a program link.
export const hiveeUrlToSlug = (url: string): string | null => {
  const trimmed = url.trim();
  const event = trimmed.match(/hivee\.jp\/events\/([A-Za-z0-9-]+)/);
  if (!event) return null;
  const program = trimmed.match(/[?&]p=([0-9a-fA-F-]{36})(?:[&#]|$)/);
  return program ? `${event[1]}/${program[1]}` : event[1];
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

  const hiveeSlug = hiveeUrlToSlug(url);
  if (hiveeSlug) return { platform: "hivee", slug: hiveeSlug };

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
    case "hivee": {
      const [event, program] = slug.split("/");
      return program
        ? `https://hivee.jp/events/${event}/program?p=${program}`
        : `https://hivee.jp/events/${event}`;
    }
  }
};
