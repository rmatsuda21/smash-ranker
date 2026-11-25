import { HIVEE_CHARACTER_IDS } from "@/consts/hivee/characters";
import type {
  HiveeMatch,
  HiveeProgram,
  HiveeStandingRow,
} from "@/types/hivee/Hivee";
import type { CharacerData } from "@/types/top8/Player";
import { isKnownCharacter } from "@/utils/top8/characterCatalog";

export const hasBracket = (program: HiveeProgram) =>
  program.format !== null && program.state !== "canceled";

const hasStarted = (program: HiveeProgram) =>
  program.state === "running" || program.state === "ended";

// The program a link points at, or the event's first one with a bracket.
const startingProgram = (
  programs: HiveeProgram[],
  programId?: string,
): HiveeProgram | undefined => {
  const playable = programs.filter(hasBracket);
  return (
    playable.find((program) => program.id === programId) ??
    playable.find((program) => !program.feeder) ??
    playable[0]
  );
};

// The program that decides the final placements of the one a link points
// at: a qualifier's top finishers move on to another program (`feeder` with
// `rank_from` 1), and that one's standings cover the qualifier as well. A
// side bracket (fed from a lower rank) is final for itself. With
// `startedOnly`, a program that has not begun is not followed into, as it
// has no standings yet.
export const pickFinalProgram = (
  programs: HiveeProgram[],
  programId?: string,
  { startedOnly = false }: { startedOnly?: boolean } = {},
): HiveeProgram | undefined => {
  let current = startingProgram(programs, programId);
  const seen = new Set<string>();
  while (current && !seen.has(current.id)) {
    seen.add(current.id);
    const from = current.id;
    const next = programs.find(
      (program) =>
        hasBracket(program) &&
        program.feeder?.program_id === from &&
        program.feeder.rank_from === 1 &&
        (!startedOnly || hasStarted(program)),
    );
    if (!next) break;
    current = next;
  }
  return current;
};

// The program everyone in `program` started in: its first qualifier, or
// itself.
export const pickFirstProgram = (
  programs: HiveeProgram[],
  program: HiveeProgram,
): HiveeProgram => {
  let current = program;
  const seen = new Set<string>();
  while (current.feeder && !seen.has(current.id)) {
    seen.add(current.id);
    const feederId = current.feeder.program_id;
    const feeder = programs.find((candidate) => candidate.id === feederId);
    if (!feeder) break;
    current = feeder;
  }
  return current;
};

// Standings in graphic order: players still in the bracket (no placement
// yet), then by placement, then the disqualified.
export const orderStandings = (
  rows: HiveeStandingRow[],
): HiveeStandingRow[] => {
  const rank = (row: HiveeStandingRow) => {
    if (row.placement !== null) return row.placement;
    return row.disqualified ? Number.MAX_SAFE_INTEGER : 0;
  };
  return rows
    .map((row, index) => ({ row, index }))
    .sort((a, b) => rank(a.row) - rank(b.row) || a.index - b.index)
    .map(({ row }) => row);
};

// A match's round as the graphics name it. A league has one label for all
// of its rounds, so those are numbered instead.
export const hiveeRoundText = (
  match: HiveeMatch,
  program: HiveeProgram | undefined,
): string =>
  program?.format === "round_robin" || program?.format === "swiss"
    ? `Round ${match.round}`
    : match.round_label;

// The programs whose results `program`'s standings cover, first to last: the
// qualifiers its top finishers came through, then itself. A side bracket
// (fed from a lower rank) is only itself.
export const programChain = (
  programs: HiveeProgram[],
  program: HiveeProgram,
): HiveeProgram[] => {
  const chain = [program];
  const seen = new Set([program.id]);
  let current = program;
  while (current.feeder?.rank_from === 1) {
    const feederId = current.feeder.program_id;
    const feeder = programs.find((candidate) => candidate.id === feederId);
    if (!feeder || seen.has(feeder.id)) break;
    seen.add(feeder.id);
    chain.unshift(feeder);
    current = feeder;
  }
  return chain;
};

// A test for whether a match of `program` belongs to its top 8. Hivee has
// no "placement the loser gets" on a match, so it is read from the final
// placements: a match that knocks its loser out counts when the loser
// placed 8th or better; a winners bracket match counts from the semifinals.
// Nothing counts in a program that is not an elimination bracket.
export const makeTop8Test = (
  program: HiveeProgram,
  matches: HiveeMatch[],
  rows: HiveeStandingRow[],
): ((match: HiveeMatch) => boolean) => {
  if (program.format !== "single_elim" && program.format !== "double_elim") {
    return () => false;
  }
  const placements = new Map<string, number>();
  for (const row of rows) {
    if (row.placement !== null) {
      placements.set(row.participant_id, row.placement);
    }
  }
  const placed = (id: string | null | undefined) =>
    (id && placements.get(id)) || Number.MAX_SAFE_INTEGER;
  const lastWinnersRound = Math.max(
    0,
    ...matches
      .filter(
        (match) =>
          match.program_id === program.id && match.bracket === "winners",
      )
      .map((match) => match.round),
  );

  return (match) => {
    if (match.program_id !== program.id) return false;
    if (match.bracket === "winners") {
      return (
        match.round >= lastWinnersRound - 1 &&
        match.slots.every((slot) => placed(slot.participant_id) <= 8)
      );
    }
    const loser = match.slots.find(
      (slot) => slot.participant_id !== match.winner_id,
    );
    return placed(loser?.participant_id) <= 8;
  };
};

// When a match was played, for ordering. 0 when Hivee has no time for it.
export const hiveeMatchTime = (match: HiveeMatch): number => {
  const time = Date.parse(match.ended_at ?? match.started_at ?? "");
  return Number.isNaN(time) ? 0 : time;
};

const toAlt = (color: number | null): CharacerData["alt"] =>
  color !== null && Number.isInteger(color) && color >= 0 && color <= 7
    ? (color as CharacerData["alt"])
    : 0;

// Each participant's characters over `matches`, most played first, in the
// costume entered last. Codes the site has no art for are left out.
export const countHiveeCharacters = (
  matches: HiveeMatch[],
): Map<string, CharacerData[]> => {
  const tallies = new Map<
    string,
    Map<string, { count: number; alt: CharacerData["alt"] }>
  >();

  for (const match of matches) {
    for (const slot of match.slots) {
      if (!slot.participant_id) continue;
      for (const character of slot.characters) {
        const id = HIVEE_CHARACTER_IDS[character.code];
        if (!id || !isKnownCharacter(id)) continue;

        let tally = tallies.get(slot.participant_id);
        if (!tally) {
          tally = new Map();
          tallies.set(slot.participant_id, tally);
        }
        const entry = tally.get(id) ?? { count: 0, alt: 0 };
        entry.count += 1;
        if (character.color !== null) entry.alt = toAlt(character.color);
        tally.set(id, entry);
      }
    }
  }

  const result = new Map<string, CharacerData[]>();
  for (const [participantId, tally] of tallies) {
    result.set(
      participantId,
      [...tally.entries()]
        .sort((a, b) => b[1].count - a[1].count)
        .map(([id, { alt }]) => ({ id, alt })),
    );
  }
  return result;
};
