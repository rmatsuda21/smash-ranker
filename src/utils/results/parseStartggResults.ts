// Pure parsers for the start.gg PlayerTournamentResults shape. Lifted out
// of useFetchPlayerResults so the hook stays thin and these helpers can be
// unit-tested or reused if we ever surface tournament data outside the
// `/results` page. None of these reach for hooks, the store, or the urql
// client — they're all input → output.
import * as countryList from "country-list";

import type {
  CharacterRef,
  PlayerRanking,
  PlayerSet,
} from "@/types/results/PlayerTournamentResults";
import {
  filterAndSortRankings,
  getPlayerRankingOverrides,
  mergePlayerRankings,
} from "@/utils/results/playerRankings";

// Sentinel used when an entrant has no recorded seed. Sorts to the very
// bottom of any "lowest-seed-first" view without poisoning numeric stats.
export const MISSING_SEED_FALLBACK = 9999;

type SetRecord = { wins?: number; losses?: number } | null | undefined;

export const parseSetRecord = (
  raw: unknown,
): { wins: number; losses: number } => {
  const record = raw as SetRecord;
  return {
    wins: typeof record?.wins === "number" ? record.wins : 0,
    losses: typeof record?.losses === "number" ? record.losses : 0,
  };
};

// `displayScore` arrives as a string like "3 - 1" or "DQ". When start.gg
// can't render a score (e.g. a forfeited pool set) the field is null and
// we leave the numeric score 0-0 — `didWin` from `winnerId` still tells
// us the outcome.
export const parseDisplayScore = (
  raw: string | null | undefined,
): { scoreSelf: number; scoreOpponent: number; isDQ: boolean } => {
  if (!raw) return { scoreSelf: 0, scoreOpponent: 0, isDQ: false };
  if (/dq/i.test(raw)) return { scoreSelf: 0, scoreOpponent: 0, isDQ: true };
  const match = raw.match(/(-?\d+)\s*-\s*(-?\d+)/);
  if (!match) return { scoreSelf: 0, scoreOpponent: 0, isDQ: false };
  return {
    scoreSelf: parseInt(match[1], 10),
    scoreOpponent: parseInt(match[2], 10),
    isDQ: false,
  };
};

// start.gg returns full country names ("Japan"); the rest of the app
// keys flag assets and palettes off ISO-3166 alpha-2 codes.
export const resolveCountry = (
  raw: string | null | undefined,
): string | undefined => {
  if (!raw) return undefined;
  const code = countryList.getCode(raw);
  return code || undefined;
};

const isValidRanking = (r: unknown): r is { rank: number; title: string } => {
  if (!r || typeof r !== "object") return false;
  const o = r as Record<string, unknown>;
  return (
    typeof o.rank === "number" &&
    typeof o.title === "string" &&
    o.title.length > 0
  );
};

// Filters malformed rows, merges per-player config overrides, then runs
// the level + recency sort. The resulting list is what feeds the on-pill
// "<league> #<rank>" display and the server-rendered graphic.
export const parseRankings = (
  rawRankings: ReadonlyArray<unknown> | null | undefined,
  playerId: string | undefined,
): PlayerRanking[] => {
  const list: PlayerRanking[] = (rawRankings ?? [])
    .filter(isValidRanking)
    .map((r) => ({ rank: r.rank, title: r.title }));
  const merged = mergePlayerRankings(list, getPlayerRankingOverrides(playerId));
  return filterAndSortRankings(merged);
};

type GameSelection = {
  entrant?: { id?: number | string | null } | null;
  character?: { id?: number | string | null; name?: string | null } | null;
};

type GameNode = { selections?: ReadonlyArray<GameSelection | null> | null };

// Walks `games[].selections[]` once and partitions distinct characters by
// side. Insertion-ordered so icons render in pick-order across the set.
export const parseCharacterSelections = (
  games: ReadonlyArray<GameNode | null> | null | undefined,
  selfEntrantId: string,
  oppEntrantId: string,
): { selfCharacters: CharacterRef[]; oppCharacters: CharacterRef[] } => {
  const selfCharacters: CharacterRef[] = [];
  const oppCharacters: CharacterRef[] = [];
  const seenSelf = new Set<string>();
  const seenOpp = new Set<string>();

  for (const game of games ?? []) {
    for (const selection of game?.selections ?? []) {
      const character = selection?.character;
      if (!character?.id) continue;
      const charId = String(character.id);
      const charName = character.name || charId;
      const selectionEntrantId =
        selection?.entrant?.id != null ? String(selection.entrant.id) : null;
      if (selectionEntrantId === selfEntrantId) {
        if (seenSelf.has(charId)) continue;
        seenSelf.add(charId);
        selfCharacters.push({ id: charId, name: charName });
      } else if (selectionEntrantId === oppEntrantId) {
        if (seenOpp.has(charId)) continue;
        seenOpp.add(charId);
        oppCharacters.push({ id: charId, name: charName });
      }
    }
  }
  return { selfCharacters, oppCharacters };
};

// Stable sort that uses per-phase earliest-completedAt as the primary
// cross-phase key, falling back to phaseOrder when timestamps are missing.
// Some organizers misconfigure phaseOrder so it doesn't reflect the
// temporal flow (e.g. TOP8 created before TOP96 in the UI but played
// after it) — completedAt is authoritative. Within a phase the input
// order is preserved (callers reverse start.gg's sortType:RECENT so it's
// already chronological-oldest-first).
export const sortSetsByPhase = (
  sets: PlayerSet[],
  phaseTemporalKey: ReadonlyMap<string, number>,
): void => {
  sets.sort((a, b) => {
    if (a.phaseId === b.phaseId) return 0;
    const aKey = phaseTemporalKey.get(a.phaseId);
    const bKey = phaseTemporalKey.get(b.phaseId);
    if (aKey != null && bKey != null) return aKey - bKey;
    return a.phaseOrder - b.phaseOrder;
  });
};
