import { encodeInvite } from "@/utils/predict/inviteCode";

// Links that open a tool with a start.gg event already loading.
// `s` is the event slug; PostHog strips it from captured URLs.

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
  `/predict?d=${encodeInvite({ platform: "startgg", slug: eventSlug })}`;

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
