import type {
  EventPhase,
  EventSet,
  Pool,
  ProgressionSeed,
} from "@/types/tournament/Tournament";

// A label beside a match naming another phase's pool: where a player came
// in from, or where they are sent on to.
export type ProgressionPill = {
  label: string;
  // The pool it names, which the pill links to.
  groupId: string;
  // The slot (0 top, 1 bottom) the pill sits level with, or null for the
  // middle of the match.
  slot: 0 | 1 | null;
};

export type SetPills = {
  // Where players came into the pool from, on the first set each played in
  // it.
  from: ProgressionPill[];
  // Where the set sends its players.
  to: ProgressionPill[];
};

// What start.gg calls a pool in pills: the phase's name, and the pool's when
// the phase has more than one ("[DAY 1] TOP 1536 A100").
const groupNames = (phases: EventPhase[]): Map<string, string> => {
  const names = new Map<string, string>();
  for (const phase of phases) {
    for (const round of phase.rounds ?? []) {
      names.set(round.groupId, round.name);
    }
    for (const group of phase.groups) {
      if (names.has(group.id)) continue;
      names.set(
        group.id,
        phase.groups.length > 1 && group.label
          ? `${phase.name} ${group.label}`
          : phase.name,
      );
    }
  }
  return names;
};

// The set where each player entered the pool: their first in winners, or in
// losers for someone seeded straight into it. Sets after a bye count, since
// byes are not drawn.
const firstSets = (sets: EventSet[]): Map<string, EventSet> => {
  const order = (set: EventSet) => {
    const round = set.round ?? 0;
    // Every winners round before every losers round.
    return round >= 0 ? round : 10_000 - round;
  };
  const first = new Map<string, EventSet>();
  for (const set of sets) {
    for (const side of [set.winner, set.loser]) {
      const known = first.get(side.entrantId);
      if (!known || order(set) < order(known)) first.set(side.entrantId, set);
    }
  }
  return first;
};

// The pills of each set of a pool that has any, by set id. Players who came
// from another phase's pool get one on their first set here; a set that sends
// players on gets one for each different place it sends them, level with the
// player it is for. One pill for the whole set sits in its middle: both
// players go to the same place, or only the winner leaves (and has no line
// to a next match in the way).
export const progressionPills = (
  pool: Pool,
  phases: EventPhase[],
): Map<string, SetPills> => {
  const pills = new Map<string, SetPills>();
  const progression = pool.progression;
  if (!progression) return pills;

  const names = groupNames(phases);
  const destination = (seed: ProgressionSeed | null) => {
    const name = seed ? names.get(seed.groupId) : undefined;
    if (!seed || !name) return null;
    // A pool that seeds players into its losers bracket: say which side.
    const winners = progression.winnersSeeds[seed.groupId];
    const label =
      winners === undefined || seed.seedNum === null
        ? name
        : `${name} ${seed.seedNum <= winners ? "[W]" : "[L]"}`;
    return { label, groupId: seed.groupId };
  };
  const entry = (set: EventSet) => {
    const known = pills.get(set.id);
    if (known) return known;
    const created: SetPills = { from: [], to: [] };
    pills.set(set.id, created);
    return created;
  };
  const slotOf = (set: EventSet, entrantId: string): 0 | 1 =>
    (set.winner.entrantId === entrantId) === (set.winnerSlot === 0) ? 0 : 1;

  for (const [entrantId, set] of firstSets(pool.sets)) {
    const origin = progression.arrivals[entrantId];
    const label = origin ? names.get(origin) : undefined;
    if (label) {
      entry(set).from.push({
        label,
        groupId: origin,
        slot: slotOf(set, entrantId),
      });
    }
  }

  for (const set of pool.sets) {
    const departure = progression.departures[set.id];
    if (!departure) continue;
    const winner = destination(departure.winner);
    const loser = destination(departure.loser);
    const winnerSlot = set.winnerSlot;
    const loserSlot = winnerSlot === 0 ? 1 : 0;
    const to: ProgressionPill[] =
      winner && loser
        ? winner.label === loser.label
          ? [{ ...winner, slot: null }]
          : [
              { ...winner, slot: winnerSlot },
              { ...loser, slot: loserSlot },
            ]
        : winner
          ? [{ ...winner, slot: null }]
          : loser
            ? [{ ...loser, slot: loserSlot }]
            : [];
    if (to.length > 0) entry(set).to = to;
  }

  return pills;
};
