import type {
  EventSet,
  Pool,
  PoolStanding,
  SetSide,
} from "@/types/tournament/Tournament";

export type Round = { name: string; sets: EventSet[] };

export type RoundPlayer = {
  entrantId: string;
  name: string;
  seed: number | null;
  // The pool's own placement, when start.gg has one.
  placement: number | null;
  wins: number;
  losses: number;
};

export type RoundCell = {
  set: EventSet;
  won: boolean;
  // "2-0" from the row player's side, "W"/"L" without scores, "DQ".
  label: string;
  opponent: string;
};

// Everyone against everyone: `cells[row player][column player]`.
export type CrossTable = {
  // In seed order, the order the pool was drawn up in.
  players: RoundPlayer[];
  cells: Record<string, Record<string, RoundCell>>;
};

// Everyone against one opponent a round: `cells[player][round index]`.
export type RoundTable = {
  // By placement, best first.
  players: RoundPlayer[];
  cells: Record<string, (RoundCell | undefined)[]>;
};

const cellOf = (set: EventSet, own: SetSide, other: SetSide): RoundCell => {
  const won = own === set.winner;
  const label = set.isDQ
    ? won
      ? "W"
      : "DQ"
    : own.score === null || other.score === null
      ? won
        ? "W"
        : "L"
      : `${own.score}-${other.score}`;
  return { set, won, label, opponent: other.name };
};

// The sets of one pool by start.gg's round number, first round first.
export const groupRounds = (sets: EventSet[]): Round[] => {
  const rounds = new Map<number, Round>();
  for (const set of sets) {
    const round = set.round ?? 0;
    const entry = rounds.get(round) ?? { name: set.roundName, sets: [] };
    entry.sets.push(set);
    rounds.set(round, entry);
  }
  return [...rounds.entries()].sort((a, b) => a[0] - b[0]).map(([, r]) => r);
};

// The rounds of a stage. `names` are for a Swiss stage held as a pool per
// round: each pool is then one round, named after its phase ("Swiss Round
// 3"), where its sets all say "Round 1".
export const stageRounds = (pools: Pool[], names?: string[]): Round[] =>
  pools.flatMap((pool, index) => {
    const rounds = groupRounds(pool.sets);
    return names && rounds.length === 1
      ? [{ name: names[index], sets: rounds[0].sets }]
      : rounds;
  });

// Everyone in the rounds or the standings, with their record.
// Disqualifications show in a table but do not count in a record, as
// elsewhere on the site.
const collectPlayers = (
  rounds: Round[],
  standings: PoolStanding[],
): Map<string, RoundPlayer> => {
  const players = new Map<string, RoundPlayer>();
  const placements = new Map(
    standings.map((standing) => [standing.entrantId, standing.placement]),
  );
  const add = (side: {
    entrantId: string;
    name: string;
    seed?: number | null;
  }) => {
    if (players.has(side.entrantId)) return;
    players.set(side.entrantId, {
      entrantId: side.entrantId,
      name: side.name,
      seed: side.seed ?? null,
      placement: placements.get(side.entrantId) ?? null,
      wins: 0,
      losses: 0,
    });
  };
  for (const set of rounds.flatMap((round) => round.sets)) {
    add(set.winner);
    add(set.loser);
    if (set.isDQ) continue;
    players.get(set.winner.entrantId)!.wins++;
    players.get(set.loser.entrantId)!.losses++;
  }
  // Someone in the standings who has not played a set yet still has a row.
  for (const standing of standings) add(standing);
  return players;
};

// A pool where everyone plays everyone, as a cross table.
export const buildCrossTable = (
  rounds: Round[],
  standings: PoolStanding[],
): CrossTable => {
  const cells: CrossTable["cells"] = {};
  for (const set of rounds.flatMap((round) => round.sets)) {
    (cells[set.winner.entrantId] ??= {})[set.loser.entrantId] = cellOf(
      set,
      set.winner,
      set.loser,
    );
    (cells[set.loser.entrantId] ??= {})[set.winner.entrantId] = cellOf(
      set,
      set.loser,
      set.winner,
    );
  }
  return {
    players: [...collectPlayers(rounds, standings).values()].sort(
      (a, b) =>
        (a.seed ?? Infinity) - (b.seed ?? Infinity) ||
        (a.placement ?? Infinity) - (b.placement ?? Infinity) ||
        a.name.localeCompare(b.name),
    ),
    cells,
  };
};

// A stage where each player meets one opponent a round (Swiss), as a table
// of players against rounds.
export const buildRoundTable = (
  rounds: Round[],
  standings: PoolStanding[],
): RoundTable => {
  const cells: RoundTable["cells"] = {};
  rounds.forEach((round, index) => {
    for (const set of round.sets) {
      (cells[set.winner.entrantId] ??= [])[index] = cellOf(
        set,
        set.winner,
        set.loser,
      );
      (cells[set.loser.entrantId] ??= [])[index] = cellOf(
        set,
        set.loser,
        set.winner,
      );
    }
  });
  return {
    players: [...collectPlayers(rounds, standings).values()].sort(
      (a, b) =>
        (a.placement ?? Infinity) - (b.placement ?? Infinity) ||
        b.wins - a.wins ||
        a.losses - b.losses ||
        (a.seed ?? Infinity) - (b.seed ?? Infinity),
    ),
    cells,
  };
};
