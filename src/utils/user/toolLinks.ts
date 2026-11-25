import { type Platform, slugToUrl } from "@/consts/platforms";
import { encodeInvite } from "@/utils/predict/inviteCode";

// Links that open a tool with a start.gg or Hivee event already loading.
// `s` is the event slug; PostHog strips it from captured URLs.

// The tournament page hands out slugs of two platforms: a start.gg one
// starts with "tournament/", a Hivee one is ids.
const platformOfSlug = (slug: string): Platform =>
  slug.startsWith("tournament/") ? "startgg" : "hivee";

// The URL a tool loads for a tool link's slug.
export const toolLinkUrl = (slug: string): string =>
  slugToUrl(platformOfSlug(slug), slug);

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

export const predictLink = (eventSlug: string): string =>
  `/predict?d=${encodeInvite({ platform: platformOfSlug(eventSlug), slug: eventSlug })}`;

// The site's own page for a tournament (start.gg's tournament id, or a Hivee
// event's id), opened on one of its events
// when the caller knows which.
export const tournamentLink = (
  tournamentId: string,
  eventId?: string | null,
): string => `/tournament/${tournamentId}${eventId ? `?event=${eventId}` : ""}`;

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
