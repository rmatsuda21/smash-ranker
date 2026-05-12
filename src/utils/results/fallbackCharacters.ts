// Helpers around the `fallbackCharacters: Record<string, string | null>`
// map in the results store. Three states matter:
//
//   • Missing key   — fetch hasn't fired yet (or is still in flight).
//   • Present + null — fetch resolved but the player has no recorded
//                     character usage; render the dashed empty placeholder.
//   • Present + string — start.gg character id to render as a grayscale
//                       fallback icon.
//
// Both the picker (gating the Generate button) and SetRow (deciding which
// of shimmer/empty/icon to show) need to distinguish "still fetching"
// from "fetched but empty", so the difference between the absence of a
// key and `null` is load-bearing.
import type { PlayerTournamentResults } from "@/types/results/PlayerTournamentResults";

export type FallbackCharacterMap = Record<string, string | null>;

export const hasFallbackEntry = (
  map: FallbackCharacterMap,
  entrantId: string,
): boolean => Object.prototype.hasOwnProperty.call(map, entrantId);

// `undefined` = not fetched yet, `null` = fetched no-data, string = id.
export const lookupFallbackCharacterId = (
  map: FallbackCharacterMap,
  entrantId: string,
): string | null | undefined =>
  hasFallbackEntry(map, entrantId) ? map[entrantId] : undefined;

// True when every entrant we care about (the selected player + every
// unique opponent they faced) has a resolved entry. Used to keep the
// Generate Graphic button in its loading state until the rendered PNG
// won't miss fallback icons. Short-circuits when there's no player or
// no videogameId — the fan-out effect doesn't fire in those cases, so
// blocking forever would be wrong.
export const allFallbacksLoaded = (
  player: PlayerTournamentResults | null,
  map: FallbackCharacterMap,
  videogameId: string | null,
): boolean => {
  if (!player) return true;
  if (!videogameId) return true;
  if (!hasFallbackEntry(map, player.entrantId)) return false;
  const seen = new Set<string>([player.entrantId]);
  for (const set of player.sets) {
    const id = set.opponent.id;
    if (!id || seen.has(id)) continue;
    seen.add(id);
    if (!hasFallbackEntry(map, id)) return false;
  }
  return true;
};
