import type { EventSet } from "@/types/tournament/Tournament";

export type BracketNode = {
  set: EventSet;
  column: number;
  // Vertical position in slots: 0 is the top, 1 one match further down.
  row: number;
  // Sets of the same lane whose winners met in this one.
  feeders: string[];
};

export type BracketLane = {
  id: "winners" | "losers";
  // Round names, left to right.
  columns: string[];
  nodes: BracketNode[];
  // Height in slots.
  rows: number;
};

const slotOrder = (set: EventSet): [string, string] =>
  set.winnerSlot === 0
    ? [set.winner.entrantId, set.loser.entrantId]
    : [set.loser.entrantId, set.winner.entrantId];

// One side of a double elimination bracket as a tree: a column per round, and
// each set placed level with the middle of the sets that fed it. Only sets
// in the lane feed each other; a player dropping from winners into losers is
// not a connection anyone draws.
const layoutLane = (
  id: BracketLane["id"],
  sets: EventSet[],
): BracketLane | null => {
  if (sets.length === 0) return null;

  // A column is a round, by start.gg's round number. The grand final and its
  // reset share a number, so the name is part of the key and the earlier of
  // the two comes first.
  const firstPlayed = new Map<string, number>();
  const keyOf = (set: EventSet) =>
    `${Math.abs(set.round ?? 0)}|${set.roundName}`;
  for (const set of sets) {
    const key = keyOf(set);
    const at = set.completedAt ?? Infinity;
    firstPlayed.set(key, Math.min(firstPlayed.get(key) ?? Infinity, at));
  }
  const keys = [...firstPlayed.keys()].sort(
    (a, b) =>
      Number(a.split("|")[0]) - Number(b.split("|")[0]) ||
      firstPlayed.get(a)! - firstPlayed.get(b)!,
  );
  const columns = new Map(
    sets.map((set) => [set.id, keys.indexOf(keyOf(set))]),
  );
  const columnOf = (set: EventSet) => columns.get(set.id)!;

  // Each player's sets in the lane, so a pool of a few hundred sets is not
  // searched whole for every connection.
  const playedBy = new Map<string, EventSet[]>();
  for (const set of sets) {
    for (const entrantId of slotOrder(set)) {
      playedBy.set(entrantId, [...(playedBy.get(entrantId) ?? []), set]);
    }
  }

  const feeders = new Map<string, EventSet[]>();
  const fed = new Set<string>();
  for (const set of sets) {
    const column = columnOf(set);
    const found = slotOrder(set).flatMap((entrantId) => {
      // The set this player won last on their way here.
      const previous = (playedBy.get(entrantId) ?? [])
        .filter(
          (other) =>
            other.winner.entrantId === entrantId && columnOf(other) < column,
        )
        .sort((a, b) => columnOf(b) - columnOf(a))[0];
      return previous ? [previous] : [];
    });
    // A set leads to one place: the next one its winner played.
    const own = found.filter((feeder) => {
      const next = (playedBy.get(feeder.winner.entrantId) ?? [])
        .filter((other) => columnOf(other) > columnOf(feeder))
        .sort((a, b) => columnOf(a) - columnOf(b))[0];
      return next === set;
    });
    feeders.set(set.id, own);
    for (const feeder of own) fed.add(feeder.id);
  }

  // Sets with nothing before them take the next free slot, top to bottom, in
  // the order the final's tree is walked; every other set sits level with
  // the middle of what fed it.
  const rows = new Map<string, number>();
  let nextLeaf = 0;
  const place = (set: EventSet): number => {
    const known = rows.get(set.id);
    if (known !== undefined) return known;
    const own = feeders.get(set.id) ?? [];
    const row =
      own.length === 0
        ? nextLeaf++
        : own.map(place).reduce((sum, value) => sum + value, 0) / own.length;
    rows.set(set.id, row);
    return row;
  };
  [...sets]
    .filter((set) => !fed.has(set.id))
    .sort((a, b) => columnOf(b) - columnOf(a))
    .forEach(place);

  return {
    id,
    columns: keys.map((key) => key.slice(key.indexOf("|") + 1)),
    nodes: sets.map((set) => ({
      set,
      column: columnOf(set),
      row: rows.get(set.id) ?? 0,
      feeders: (feeders.get(set.id) ?? []).map((feeder) => feeder.id),
    })),
    rows: Math.max(nextLeaf, 1),
  };
};

// The winners side (grand final included) and the losers side of the given
// sets, each laid out as a bracket. A lane with no sets is left out.
export const layoutBracket = (sets: EventSet[]): BracketLane[] =>
  [
    layoutLane(
      "winners",
      sets.filter((set) => (set.round ?? 0) >= 0),
    ),
    layoutLane(
      "losers",
      sets.filter((set) => (set.round ?? 0) < 0),
    ),
  ].filter((lane): lane is BracketLane => lane !== null);
