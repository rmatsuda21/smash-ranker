import type {
  HiveeEntrant,
  HiveeProgram,
  HiveeStandingRow,
} from "@/types/hivee/Hivee";
import type { LineupSource } from "@/types/top8/Player";
import { orderStandings } from "@/utils/hivee/programs";

type Lineup = {
  rows: HiveeStandingRow[];
  lineup: LineupSource;
  entrantCount: number;
};

const isStillIn = (row: HiveeStandingRow): boolean =>
  row.placement === null && !row.disqualified;

/**
 * The players of a program in graphic order, and what that order is worth: a
 * finished program's placements, the placements so far with everyone still
 * in it in seed order on top, or the seeding when nothing has been played.
 * `entrants` may be empty for a program that has ended.
 */
export const buildHiveeLineup = (
  program: HiveeProgram,
  standings: HiveeStandingRow[],
  entrants: HiveeEntrant[],
): Lineup => {
  const seeds = new Map<string, number>();
  const field: HiveeStandingRow[] = [];
  for (const entrant of entrants) {
    const entry = entrant.programs.find((p) => p.program_id === program.id);
    if (!entry) continue;
    if (entry.seed !== null) seeds.set(entrant.id, entry.seed);
    field.push({
      placement: null,
      participant_id: entrant.id,
      display_name: entrant.display_name,
      disqualified: false,
      pool: null,
      source_program_id: program.id,
    });
  }

  const bySeed = (a: HiveeStandingRow, b: HiveeStandingRow) => {
    const seedA = seeds.get(a.participant_id) ?? Number.MAX_SAFE_INTEGER;
    const seedB = seeds.get(b.participant_id) ?? Number.MAX_SAFE_INTEGER;
    return seedA - seedB;
  };

  const hasResults =
    program.state !== "before" &&
    standings.some((row) => row.placement !== null || row.disqualified);

  if (program.state === "ended" || hasResults) {
    const ordered = orderStandings(standings);
    const stillIn = ordered.filter(isStillIn).sort(bySeed);
    return {
      rows: [...stillIn, ...ordered.filter((row) => !isStillIn(row))],
      lineup: program.state === "ended" ? "final" : "live",
      entrantCount: standings.length,
    };
  }

  // Nothing played: standings list everyone with no placement, or nobody.
  const everyone = field.length > 0 ? field : standings;
  return {
    rows: seeds.size > 0 ? [...everyone].sort(bySeed) : [],
    lineup: seeds.size > 0 ? "seeds" : "none",
    entrantCount: everyone.length,
  };
};
