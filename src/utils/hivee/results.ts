import type { HiveeMatch } from "@/types/hivee/Hivee";
import type {
  CharacterRef,
  PlayerSet,
  PlayerTournamentResults,
} from "@/types/results/PlayerTournamentResults";
import type { ResultsEntrantSummary } from "@/types/results/ResultsEntrantSummary";
import { HIVEE_CHARACTER_IDS } from "@/consts/hivee/characters";
import type { HiveeEventData } from "@/utils/hivee/eventData";
import {
  countHiveeCharacters,
  hiveeMatchTime,
  hiveeRoundText,
  orderStandings,
  pickFirstProgram,
} from "@/utils/hivee/programs";
import {
  MISSING_SEED_FALLBACK,
  sortSetsByPhase,
} from "@/utils/results/parseStartggResults";
import { computeUpsetFactor } from "@/utils/results/upsetFactor";
import { getCharacter } from "@/utils/top8/characterCatalog";

// The programs the standings cover: the bracket and the qualifiers that fed
// it.
const coveredPrograms = (data: HiveeEventData): Set<string> => {
  const ids = new Set(data.standings.phases.map((phase) => phase.program_id));
  ids.add(data.program.id);
  return ids;
};

// participant → program → seed
const seedTable = (data: HiveeEventData): Map<string, Map<string, number>> => {
  const table = new Map<string, Map<string, number>>();
  for (const entrant of data.entrants) {
    const seeds = new Map<string, number>();
    for (const entry of entrant.programs) {
      if (entry.seed !== null) seeds.set(entry.program_id, entry.seed);
    }
    table.set(entrant.id, seeds);
  }
  return table;
};

// A player's seed for the event: the one they entered with, or, when the
// qualifier was not seeded, the one they took into the bracket.
const eventSeed = (
  data: HiveeEventData,
  seeds: Map<string, number> | undefined,
): number | undefined => {
  const first = pickFirstProgram(data.event.programs, data.program);
  return seeds?.get(first.id) ?? seeds?.get(data.program.id);
};

// Everyone in the standings, in placement order.
export const buildHiveeEntrantPool = (
  data: HiveeEventData,
): ResultsEntrantSummary[] => {
  const seeds = seedTable(data);
  return orderStandings(data.standings.rows)
    .filter((row) => row.display_name)
    .map((row) => ({
      id: row.participant_id,
      name: row.display_name ?? "",
      seed:
        eventSeed(data, seeds.get(row.participant_id)) ?? MISSING_SEED_FALLBACK,
    }));
};

const toCharacters = (
  characters: HiveeMatch["slots"][number]["characters"],
): CharacterRef[] => {
  const refs: CharacterRef[] = [];
  for (const { code } of characters) {
    const id = HIVEE_CHARACTER_IDS[code];
    const character = id ? getCharacter(id) : undefined;
    if (!id || !character || refs.some((ref) => ref.id === id)) continue;
    refs.push({ id, name: character.name });
  }
  return refs;
};

// One player's run through the programs the standings cover, oldest set
// first. Null for someone who is not in the standings.
export const buildHiveePlayerResults = (
  data: HiveeEventData,
  participantId: string,
): PlayerTournamentResults | null => {
  const rows = new Map(
    data.standings.rows.map((row) => [row.participant_id, row]),
  );
  const self = rows.get(participantId);
  if (!self) return null;

  const seeds = seedTable(data);
  const covered = coveredPrograms(data);
  const programs = new Map(
    data.event.programs.map((program, index) => [
      program.id,
      { program, index },
    ]),
  );

  const played = data.matches
    .filter(
      (match) =>
        match.program_id !== null &&
        covered.has(match.program_id) &&
        match.slots.some((slot) => slot.participant_id === participantId) &&
        // A bye has nobody on the other side.
        match.slots.every((slot) => slot.participant_id),
    )
    .sort((a, b) => hiveeMatchTime(a) - hiveeMatchTime(b) || a.round - b.round);

  const phaseStart = new Map<string, number>();
  const sets: PlayerSet[] = played.map((match) => {
    const programId = match.program_id ?? "";
    const entry = programs.get(programId);
    const selfSlot =
      match.slots.find((slot) => slot.participant_id === participantId) ??
      match.slots[0];
    const oppSlot =
      match.slots.find((slot) => slot.participant_id !== participantId) ??
      match.slots[1];
    const oppId = oppSlot.participant_id ?? "";

    const didWin = match.winner_id === participantId;
    const isDQ = match.dq.both || match.dq.participant_id !== null;
    // Seeds of the program the match was played in: a bracket is seeded
    // from the qualifier's result, which is what an upset there is against.
    const selfSeed = seeds.get(participantId)?.get(programId);
    const oppSeed = seeds.get(oppId)?.get(programId);
    const upsetFactor =
      isDQ || !match.winner_id || !selfSeed || !oppSeed
        ? 0
        : computeUpsetFactor(
            didWin ? selfSeed : oppSeed,
            didWin ? oppSeed : selfSeed,
          );

    const time = hiveeMatchTime(match);
    if (time && !phaseStart.has(programId)) phaseStart.set(programId, time);

    return {
      id: match.id,
      fullRoundText: hiveeRoundText(match, entry?.program),
      // Losers rounds are negative, as on start.gg.
      round: match.bracket === "losers" ? -match.round : match.round,
      scoreSelf: selfSlot.score ?? 0,
      scoreOpponent: oppSlot.score ?? 0,
      didWin,
      isDQ,
      startAtMs: time || undefined,
      upsetFactor: upsetFactor > 0 ? upsetFactor : undefined,
      phaseId: programId,
      phaseName: entry?.program.title ?? "",
      phaseOrder: entry?.index ?? Number.MAX_SAFE_INTEGER,
      selfCharacters: toCharacters(selfSlot.characters),
      opponent: {
        id: oppId,
        name: oppSlot.display_name ?? rows.get(oppId)?.display_name ?? "",
        // 0 is "no seed" to the set list and the graphic, which leave it out.
        seed: eventSeed(data, seeds.get(oppId)) ?? 0,
        placement: rows.get(oppId)?.placement ?? 0,
        characters: toCharacters(oppSlot.characters),
      },
    };
  });
  sortSetsByPhase(sets, phaseStart);

  const decided = sets.filter((set) => !set.isDQ);
  return {
    entrantId: participantId,
    name: self.display_name ?? "",
    rankings: [],
    seed: eventSeed(data, seeds.get(participantId)) ?? 0,
    placement: self.placement ?? 0,
    wins: decided.filter((set) => set.didWin).length,
    losses: decided.filter(
      (set) => !set.didWin && set.scoreSelf !== set.scoreOpponent,
    ).length,
    sets,
  };
};

// The character each of `participantIds` played most over the whole event,
// for sets where none was entered. Null for someone with none anywhere.
export const hiveeFallbackCharacters = (
  data: HiveeEventData,
  participantIds: Iterable<string>,
): Record<string, string | null> => {
  const characters = countHiveeCharacters(data.matches);
  const fallbacks: Record<string, string | null> = {};
  for (const id of participantIds) {
    fallbacks[id] = characters.get(id)?.[0]?.id ?? null;
  }
  return fallbacks;
};
