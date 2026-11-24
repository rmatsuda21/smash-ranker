import { GAMES } from "@/consts/games";
import type { GameId } from "@/types/Game";
import type {
  ThumbnailMatch,
  ThumbnailSet,
  ThumbnailSetFilter,
  ThumbnailSide,
} from "@/types/thumbnail/Thumbnail";

export const makeSide = (side: Partial<ThumbnailSide> = {}): ThumbnailSide => ({
  name: "",
  sponsor: "",
  characterId: "",
  alt: 0,
  flip: false,
  offset: { x: 0, y: 0 },
  zoom: 1,
  ...side,
});

// What the editor opens on before anything is typed or loaded.
export const makeSampleMatch = (game: GameId): ThumbnailMatch => {
  const characterId = GAMES[game].defaultCharacterId;
  return {
    sides: [
      makeSide({ name: "Player 1", characterId }),
      makeSide({ name: "Player 2", characterId, alt: 1 }),
    ],
    round: "Grand Final",
  };
};

export const filterSets = (
  sets: ThumbnailSet[],
  filter: ThumbnailSetFilter,
): ThumbnailSet[] =>
  filter === "all"
    ? sets
    : sets.filter((set) => (filter === "stream" ? set.onStream : set.top8));

// The filter a freshly loaded event opens on: the narrowest one with sets.
export const pickSetFilter = (sets: ThumbnailSet[]): ThumbnailSetFilter =>
  sets.some((set) => set.onStream)
    ? "stream"
    : sets.some((set) => set.top8)
      ? "top8"
      : "all";

const sideLabel = (side: ThumbnailSide, characterName: string | null) =>
  characterName ? `${side.name} (${characterName})` : side.name;

// A title for the video the thumbnail goes on.
export const videoTitle = (
  match: ThumbnailMatch,
  eventText: string,
  characterNames: [string | null, string | null],
): string =>
  [
    eventText,
    match.round,
    `${sideLabel(match.sides[0], characterNames[0])} vs ${sideLabel(match.sides[1], characterNames[1])}`,
  ]
    .filter((part) => part.trim())
    .join(" - ");
