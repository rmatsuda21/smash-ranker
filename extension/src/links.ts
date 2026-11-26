import type { Platform } from "@/consts/platforms";
import {
  predictLink,
  rankerLink,
  recapLink,
  thumbnailLink,
  tournamentLink,
} from "@/utils/user/toolLinks";

import type { TournamentPage } from "./pages";

// Set by `build.ts`: the production site, or a dev server for testing.
declare const __SITE_URL__: string;
export const SITE_URL = __SITE_URL__;

export type ToolId =
  | "tournament"
  | "ranker"
  | "results"
  | "predict"
  | "thumbnail"
  | "tier"
  | "profile";

// The platforms each tool can load an event from (see the site's CLAUDE.md:
// the tournament page, results and thumbnails read start.gg and Hivee only).
const PLATFORMS: Record<
  Exclude<ToolId, "tier" | "profile">,
  readonly Platform[]
> = {
  tournament: ["startgg", "hivee"],
  ranker: ["startgg", "hivee", "challonge", "tonamel"],
  results: ["startgg", "hivee"],
  predict: ["startgg", "hivee", "challonge", "tonamel"],
  thumbnail: ["startgg", "hivee"],
};

// The tools that work on one event, in the order they are offered.
export const EVENT_TOOLS = [
  "ranker",
  "results",
  "predict",
  "thumbnail",
] as const;
export type EventTool = (typeof EVENT_TOOLS)[number];

// Every tool, empty: what the popup offers when no tournament is open.
const EMPTY_PATHS: Record<ToolId, string> = {
  tournament: "/",
  ranker: "/ranker",
  results: "/results",
  predict: "/predict",
  thumbnail: "/thumbnail",
  tier: "/tier",
  profile: "/me",
};

export const siteUrl = (path: string): string => `${SITE_URL}${path}`;

export const emptyToolUrl = (tool: ToolId): string =>
  siteUrl(EMPTY_PATHS[tool]);

// The site's page for the tournament, or null where there is none.
export const tournamentUrl = (page: TournamentPage): string | null =>
  page.tournament && PLATFORMS.tournament.includes(page.platform)
    ? siteUrl(tournamentLink(page.tournament.id, page.tournament.event))
    : null;

export type EventToolLink =
  | { tool: EventTool; status: "ready"; url: string }
  // The tool cannot read this platform.
  | { tool: EventTool; status: "unsupported" }
  // A start.gg tournament page with no event open.
  | { tool: EventTool; status: "needsEvent" };

const EVENT_LINKS: Record<EventTool, (slug: string) => string> = {
  ranker: rankerLink,
  results: (slug) => recapLink(slug, null),
  predict: predictLink,
  thumbnail: thumbnailLink,
};

export const eventToolLink = (
  page: TournamentPage,
  tool: EventTool,
): EventToolLink => {
  if (!PLATFORMS[tool].includes(page.platform)) {
    return { tool, status: "unsupported" };
  }
  if (!page.eventSlug) return { tool, status: "needsEvent" };
  return {
    tool,
    status: "ready",
    url: siteUrl(EVENT_LINKS[tool](page.eventSlug)),
  };
};
