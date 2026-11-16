import type { UserEvent } from "@/types/user/UserEvent";
import type { UserSet } from "@/types/user/UserSet";

export type MonthActivity = {
  // First day of the month, milliseconds since epoch.
  month: number;
  count: number;
};

export type CareerStats = {
  eventCount: number;
  tournamentCount: number;
  // Sum of bracket sizes: everyone the user has shared a bracket with.
  entrantsFaced: number;
  wins: number;
  podiums: number;
  top8s: number;
  // Average share of the bracket the user finished ahead of, 0–100.
  outplacedPercent: number | null;
  bestFinish: UserEvent | null;
  biggestBracket: UserEvent | null;
  seedBeaten: { beaten: number; seeded: number };
  firstEventAt: number | null;
  // The twelve months up to now, oldest first.
  activity: MonthActivity[];
  busiestMonth: MonthActivity | null;
  longestWeeklyStreak: number;
  // 0 = Sunday.
  favoriteWeekday: number | null;
  homeTurf: { label: string; count: number } | null;
  cityCount: number;
  series: { name: string; count: number } | null;
  offlinePercent: number | null;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;

const mostCommon = <T>(
  items: T[],
  key: (item: T) => string | null,
): { key: string; count: number } | null => {
  const counts = new Map<string, number>();
  for (const item of items) {
    const k = key(item);
    if (k) counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  let best: { key: string; count: number } | null = null;
  for (const [k, count] of counts) {
    if (!best || count > best.count) best = { key: k, count };
  }
  return best;
};

// "Game Night #104" and "Game Night #106 Monthly" are the same series:
// drop the numbering and anything after it.
export const seriesName = (tournamentName: string): string =>
  tournamentName
    .replace(/\s*[#(（]?\s*\d+.*$/u, "")
    .replace(/[\s\-–—:|@!]+$/u, "")
    .trim();

const monthStart = (time: number): number => {
  const date = new Date(time);
  return new Date(date.getFullYear(), date.getMonth(), 1).getTime();
};

const longestStreak = (weekIndexes: number[]): number => {
  const weeks = [...new Set(weekIndexes)].sort((a, b) => a - b);
  let best = 0;
  let run = 0;
  let previous: number | null = null;
  for (const week of weeks) {
    run = previous !== null && week === previous + 1 ? run + 1 : 1;
    best = Math.max(best, run);
    previous = week;
  }
  return best;
};

// The placement a seed is expected to reach in double elimination, where
// places are shared in tiers: 5th–6th both read 5, 9th–12th all read 9.
export const expectedPlacement = (seed: number): number => {
  if (seed <= 4) return seed;
  let tierStart = 5;
  let tierSize = 2;
  let tiersAtSize = 0;
  while (seed >= tierStart + tierSize) {
    tierStart += tierSize;
    if (++tiersAtSize === 2) {
      tierSize *= 2;
      tiersAtSize = 0;
    }
  }
  return tierStart;
};

export const computeCareerStats = (
  events: UserEvent[],
  now: number = Date.now(),
): CareerStats => {
  const played = events.filter(
    (event) => event.startAt !== null && event.startAt <= now,
  );
  const placed = played.filter(
    (event) => event.isCompleted && event.placement !== null,
  );

  const ranked = placed.filter((event) => event.numEntrants > 1);
  const outplacedPercent = ranked.length
    ? (ranked.reduce(
        (sum, event) =>
          sum +
          Math.max(0, event.numEntrants - event.placement!) /
            (event.numEntrants - 1),
        0,
      ) /
        ranked.length) *
      100
    : null;

  const bestFinish = placed.reduce<UserEvent | null>((best, event) => {
    if (!best) return event;
    if (event.placement! !== best.placement!) {
      return event.placement! < best.placement! ? event : best;
    }
    return event.numEntrants > best.numEntrants ? event : best;
  }, null);

  const biggestBracket = played.reduce<UserEvent | null>(
    (best, event) =>
      !best || event.numEntrants > best.numEntrants ? event : best,
    null,
  );

  const seeded = placed.filter((event) => event.seed !== null);

  const activity: MonthActivity[] = [];
  const today = new Date(now);
  for (let back = 11; back >= 0; back--) {
    activity.push({
      month: new Date(
        today.getFullYear(),
        today.getMonth() - back,
        1,
      ).getTime(),
      count: 0,
    });
  }
  const activityByMonth = new Map(activity.map((m) => [m.month, m]));

  // Count a tournament once even when the user entered several events.
  const tournaments = new Map<string, UserEvent>();
  for (const event of played) {
    if (!tournaments.has(event.tournament.id)) {
      tournaments.set(event.tournament.id, event);
    }
  }
  const visits = [...tournaments.values()];

  const perMonth = new Map<number, number>();
  for (const visit of visits) {
    const month = monthStart(visit.startAt!);
    perMonth.set(month, (perMonth.get(month) ?? 0) + 1);
    const slot = activityByMonth.get(month);
    if (slot) slot.count++;
  }
  let busiestMonth: MonthActivity | null = null;
  for (const [month, count] of perMonth) {
    if (!busiestMonth || count > busiestMonth.count) {
      busiestMonth = { month, count };
    }
  }

  const weekday = mostCommon(visits, (visit) =>
    String(new Date(visit.startAt!).getDay()),
  );

  const offline = visits.filter((visit) => !visit.isOnline);
  const cityLabel = (visit: UserEvent) =>
    visit.tournament.city
      ? [visit.tournament.city, visit.tournament.state]
          .filter(Boolean)
          .join(", ")
      : null;
  const home = mostCommon(offline, cityLabel);
  const series = mostCommon(
    visits,
    (visit) => seriesName(visit.tournament.name) || null,
  );

  const startTimes = played.map((event) => event.startAt!);

  return {
    eventCount: played.length,
    tournamentCount: visits.length,
    entrantsFaced: played.reduce((sum, event) => sum + event.numEntrants, 0),
    wins: placed.filter((event) => event.placement === 1).length,
    podiums: placed.filter((event) => event.placement! <= 3).length,
    top8s: placed.filter((event) => event.placement! <= 8).length,
    outplacedPercent,
    bestFinish,
    biggestBracket,
    seedBeaten: {
      beaten: seeded.filter(
        (event) => event.placement! < expectedPlacement(event.seed!),
      ).length,
      seeded: seeded.length,
    },
    firstEventAt: startTimes.length ? Math.min(...startTimes) : null,
    activity,
    busiestMonth,
    longestWeeklyStreak: longestStreak(
      visits.map((visit) => Math.floor(visit.startAt! / WEEK_MS)),
    ),
    favoriteWeekday: weekday ? Number(weekday.key) : null,
    homeTurf: home ? { label: home.key, count: home.count } : null,
    cityCount: new Set(offline.map(cityLabel).filter(Boolean)).size,
    series:
      series && series.count > 1
        ? { name: series.key, count: series.count }
        : null,
    offlinePercent: visits.length
      ? (offline.length / visits.length) * 100
      : null,
  };
};

export type Matchup = {
  name: string;
  wins: number;
  losses: number;
};

export type SetStats = {
  setCount: number;
  wins: number;
  losses: number;
  winPercent: number | null;
  // Sets that went to the last game (2-1, 3-2).
  deciders: { wins: number; losses: number };
  longestWinStreak: number;
  // Most sets played against.
  rival: Matchup | null;
  // Most losses to, with a losing record.
  nemesis: Matchup | null;
  // Most wins against, never lost to.
  favoriteOpponent: Matchup | null;
  characters: { id: string; games: number }[];
};

// `isKnownCharacter` leaves out picks from games the site has no art for.
export const computeSetStats = (
  sets: UserSet[],
  isKnownCharacter: (id: string) => boolean = () => true,
): SetStats => {
  const wins = sets.filter((set) => set.won).length;

  const deciders = { wins: 0, losses: 0 };
  for (const set of sets) {
    if (!set.score) continue;
    const { mine, theirs } = set.score;
    if (Math.abs(mine - theirs) !== 1 || Math.min(mine, theirs) < 1) continue;
    if (set.won) deciders.wins++;
    else deciders.losses++;
  }

  const chronological = [...sets].sort(
    (a, b) => (a.completedAt ?? 0) - (b.completedAt ?? 0),
  );
  let longestWinStreak = 0;
  let run = 0;
  for (const set of chronological) {
    run = set.won ? run + 1 : 0;
    longestWinStreak = Math.max(longestWinStreak, run);
  }

  const matchups = new Map<string, Matchup>();
  // Newest first, so the name kept is the opponent's current tag.
  for (const set of [...chronological].reverse()) {
    if (!set.opponent.playerId) continue;
    const matchup = matchups.get(set.opponent.playerId) ?? {
      name: set.opponent.name,
      wins: 0,
      losses: 0,
    };
    if (set.won) matchup.wins++;
    else matchup.losses++;
    matchups.set(set.opponent.playerId, matchup);
  }
  const all = [...matchups.values()];
  const pick = (
    candidates: Matchup[],
    score: (m: Matchup) => number,
  ): Matchup | null =>
    candidates.reduce<Matchup | null>(
      (best, m) => (!best || score(m) > score(best) ? m : best),
      null,
    );

  const rival = pick(
    all.filter((m) => m.wins + m.losses >= 3),
    (m) => m.wins + m.losses,
  );
  const nemesis = pick(
    all.filter((m) => m !== rival && m.losses >= 2 && m.losses > m.wins),
    (m) => m.losses - m.wins,
  );
  const favoriteOpponent = pick(
    all.filter((m) => m !== rival && m.wins >= 2 && m.losses === 0),
    (m) => m.wins,
  );

  const characterGames = new Map<string, number>();
  for (const set of sets) {
    for (const id of set.characterIds) {
      if (!isKnownCharacter(id)) continue;
      characterGames.set(id, (characterGames.get(id) ?? 0) + 1);
    }
  }

  return {
    setCount: sets.length,
    wins,
    losses: sets.length - wins,
    winPercent: sets.length ? (wins / sets.length) * 100 : null,
    deciders,
    longestWinStreak,
    rival,
    nemesis,
    favoriteOpponent,
    characters: [...characterGames]
      .map(([id, games]) => ({ id, games }))
      .sort((a, b) => b.games - a.games)
      .slice(0, 3),
  };
};
