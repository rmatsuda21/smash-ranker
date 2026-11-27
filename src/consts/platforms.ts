export type Platform = "startgg" | "challonge" | "tonamel" | "hivee";

// Each platform's name as it is written. Not translated.
export const PLATFORM_LABELS: Record<Platform, string> = {
  startgg: "start.gg",
  challonge: "Challonge",
  tonamel: "Tonamel",
  hivee: "Hivee",
};

// A slug ends at a query, a fragment or a space, so a link copied with
// "?utm=…" or with words after it still names its event.
export const startggUrlToSlug = (url: string): string | null => {
  const match = url.trim().match(/tournament\/([^/?#\s]+)\/event\/([^/?#\s]+)/);
  return match ? `tournament/${match[1]}/event/${match[2]}` : null;
};

// The tournament's slug when the link is a start.gg tournament and names no
// event ("start.gg/tournament/genesis-9", ".../details"): the tools load an
// event, so such a link is sent to the tournament's page to pick one.
export const startggTournamentOnlySlug = (url: string): string | null => {
  if (startggUrlToSlug(url)) return null;
  const match = url.trim().match(/start\.gg\/tournament\/([^/?#\s]+)/);
  return match ? match[1] : null;
};

// A community's tournaments live on its own subdomain
// ("https://<community>.challonge.com/<slug>"), and Challonge's API names
// them "<community>-<slug>". A tournament's own slug never has a hyphen
// (letters, numbers and underscores only), so the last hyphen of such a slug
// is where the community ends.
const CHALLONGE_SITE_HOSTS = ["www", "api"];

export const challongeUrlToSlug = (url: string): string | null => {
  const match = url
    .trim()
    .match(
      /(?:^|[/.@\s])(?:([a-z0-9-]+)\.)?challonge\.com\/(?:[a-z]{2}\/)?([^/?#\s]+)/i,
    );
  if (!match) return null;
  const community = match[1]?.toLowerCase();
  return community && !CHALLONGE_SITE_HOSTS.includes(community)
    ? `${community}-${match[2]}`
    : match[2];
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
    case "challonge": {
      const split = slug.lastIndexOf("-");
      return split > 0
        ? `https://${slug.slice(0, split)}.challonge.com/${slug.slice(split + 1)}`
        : `https://challonge.com/${slug}`;
    }
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
