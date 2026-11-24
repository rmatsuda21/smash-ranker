import type { GameId } from "@/types/Game";

export type ThumbnailTemplateId =
  "split" | "slash" | "banner" | "night" | "card";

// One player's half of a thumbnail.
export type ThumbnailSide = {
  name: string;
  sponsor: string;
  // Empty when the character is not known (drawn as a question mark).
  characterId: string;
  alt: number;
  // Mirrors the art. The right side already faces left without it.
  flip: boolean;
  // Where the art sits in its half, as a fraction of the half's size, and
  // how much bigger than the template's own size it is drawn.
  offset: { x: number; y: number };
  zoom: number;
};

export type ThumbnailMatch = {
  sides: [ThumbnailSide, ThumbnailSide];
  round: string;
};

// A set of a loaded event: a match plus what the list needs.
export type ThumbnailSet = ThumbnailMatch & {
  id: string;
  // Whether "Save images" includes it.
  included: boolean;
  onStream: boolean;
  top8: boolean;
};

// Everything that stays the same from one match of an event to the next.
export type ThumbnailLook = {
  templateId: ThumbnailTemplateId;
  left: string;
  right: string;
  font: string;
  // An uploaded logo as a data URL. Without one the event's icon is used.
  logo: string | null;
  eventText: string;
};

export type ThumbnailEvent = {
  slug: string;
  url: string;
  tournamentName: string;
  eventName: string;
  // ISO date, or "" when start.gg has none.
  date: string;
  iconUrl: string;
  totalSets: number;
  // How many pages of sets have been read, newest first.
  loadedPages: number;
};

export type ThumbnailSetFilter = "stream" | "top8" | "all";

export type ThumbnailGame = GameId;
