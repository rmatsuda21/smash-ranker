import {
  detectPlatformAndSlug,
  type Platform,
  slugToUrl,
} from "@/consts/platforms";
import { encodeInvite } from "@/utils/predict/inviteCode";

// Links that open a tool with an event already loading. `s` is the event
// slug; PostHog strips it from captured URLs.
//
// The browser extension (`extension/`) bundles this module to build the same
// links, so it imports nothing but pure helpers: no analytics, no stores.
// Click logging lives in `utils/analytics/toolLinkClick.ts`.

// A slug says its platform: a start.gg one starts with "tournament/", a Hivee
// one is ids. Challonge and Tonamel slugs say nothing, so a link to one of
// them carries the whole URL instead (the extension's do).
const parseToolLinkSlug = (
  slug: string,
): { platform: Platform; slug: string } | null => {
  if (/^https?:\/\//.test(slug)) return detectPlatformAndSlug(slug);
  return {
    platform: slug.startsWith("tournament/") ? "startgg" : "hivee",
    slug,
  };
};

// The URL a tool loads for a tool link's slug.
export const toolLinkUrl = (slug: string): string => {
  const parsed = parseToolLinkSlug(slug);
  return parsed ? slugToUrl(parsed.platform, parsed.slug) : slug;
};

export const TOOL_LINK_PARAMS = { slug: "s", entrant: "e" } as const;

export const rankerLink = (eventSlug: string): string =>
  `/ranker?${new URLSearchParams({ [TOOL_LINK_PARAMS.slug]: eventSlug })}`;

export const recapLink = (
  eventSlug: string,
  entrantId: string | null,
): string => {
  const params = new URLSearchParams({ [TOOL_LINK_PARAMS.slug]: eventSlug });
  if (entrantId) params.set(TOOL_LINK_PARAMS.entrant, entrantId);
  return `/results?${params}`;
};

export const thumbnailLink = (eventSlug: string): string =>
  `/thumbnail?${new URLSearchParams({ [TOOL_LINK_PARAMS.slug]: eventSlug })}`;

export const predictLink = (eventSlug: string): string => {
  const parsed = parseToolLinkSlug(eventSlug);
  return parsed ? `/predict?d=${encodeInvite(parsed)}` : "/predict";
};

// The site's own page for a tournament (start.gg's tournament id, or a Hivee
// event's id), opened on one of its events when the caller knows which.
// start.gg's tournament slug works in place of the id, with the event's slug
// ("ultimate-singles") in place of its id: the page swaps both for ids.
export const tournamentLink = (
  tournamentId: string,
  eventId?: string | null,
): string =>
  `/tournament/${tournamentId}${eventId ? `?event=${encodeURIComponent(eventId)}` : ""}`;

export type ToolLink = { slug: string; entrantId: string | null };

export const readToolLink = (): ToolLink | null => {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get(TOOL_LINK_PARAMS.slug);
  if (!slug) return null;
  return { slug, entrantId: params.get(TOOL_LINK_PARAMS.entrant) };
};

// Drops the parameters from the address bar once the link has been acted
// on, so a reload does not load the tournament again.
export const clearToolLink = () => {
  const url = new URL(window.location.href);
  url.searchParams.delete(TOOL_LINK_PARAMS.slug);
  url.searchParams.delete(TOOL_LINK_PARAMS.entrant);
  window.history.replaceState(window.history.state, "", url);
};
