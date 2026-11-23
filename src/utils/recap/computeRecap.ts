import type {
  Recap,
  RecapCity,
  RecapEvent,
  RecapOpponent,
  RecapPlayer,
  RecapSet,
  RecapTypeId,
  RecapUpset,
} from "@/types/recap/Recap";
import { seriesName } from "@/utils/user/careerStats";

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKS = 52;
// A month needs this many sets before it can be the best one.
const MIN_MONTH_SETS = 6;
// Tournament icons on the attendance slide.
const MAX_ICONS = 21;
// Farther than this from home is a trip.
const TRIP_KM = 800;
// Labelled cities are at least this far apart while the whole globe shows.
const LABEL_SPACING_KM = 1500;
const EARTH_RADIUS_KM = 6371;

// Where double-elimination placement tiers start: 5th–6th, 7th–8th, 9th–12th…
const TIERS = [
  1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769,
  1025, 1537, 2049,
];

const tierOf = (seed: number): number => {
  let tier = 0;
  for (let i = 0; i < TIERS.length; i++) {
    if (seed >= TIERS[i]) tier = i;
  }
  return tier;
};

// How many placement tiers apart two seeds are: the usual "upset factor".
export const upsetFactor = (seed: number, opponentSeed: number): number =>
  tierOf(seed) - tierOf(opponentSeed);

const percent = (part: number, whole: number): number =>
  whole ? Math.round((part / whole) * 100) : 0;

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

type Point = { lon: number; lat: number };

const distanceKm = (a: Point, b: Point): number => {
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);
  const h =
    Math.sin((lat2 - lat1) / 2) ** 2 +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(toRadians(b.lon - a.lon) / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
};

// The rotation that puts the midpoint of the two farthest cities in the
// middle of the globe, so both ends of the longest trip are in view.
const restViewFor = (points: Point[]): [number, number] => {
  if (points.length === 0) return [0, 0];
  let a = points[0];
  let b = points[0];
  let farthest = -1;
  for (const p of points) {
    for (const q of points) {
      const d = distanceKm(p, q);
      if (d > farthest) {
        farthest = d;
        a = p;
        b = q;
      }
    }
  }
  const vector = (p: Point) => {
    const lon = toRadians(p.lon);
    const lat = toRadians(p.lat);
    return [
      Math.cos(lat) * Math.cos(lon),
      Math.cos(lat) * Math.sin(lon),
      Math.sin(lat),
    ];
  };
  const va = vector(a);
  const vb = vector(b);
  const mid = [va[0] + vb[0], va[1] + vb[1], va[2] + vb[2]];
  const length = Math.hypot(mid[0], mid[1], mid[2]) || 1;
  const lon = (Math.atan2(mid[1], mid[0]) * 180) / Math.PI;
  const lat = (Math.asin(mid[2] / length) * 180) / Math.PI;
  return [-lon, -lat];
};

const mostCommon = <T>(
  items: T[],
  key: (item: T) => string | number,
): { key: string; count: number } | null => {
  const counts = new Map<string, number>();
  for (const item of items) {
    const k = String(key(item));
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  let best: { key: string; count: number } | null = null;
  for (const [k, count] of counts) {
    if (!best || count > best.count) best = { key: k, count };
  }
  return best;
};

type Tournament = {
  info: RecapEvent["tournament"];
  startAt: number;
  events: RecapEvent[];
};

const pickType = (recap: Omit<Recap, "type">): RecapTypeId => {
  const main = recap.characters[0];
  if (main && percent(main.games, recap.recordedGames) >= 90) return "loyal";
  if (recap.characterCount >= 5) return "lab";

  const deciders = recap.deciders.wins + recap.deciders.losses;
  if (deciders >= 10 && recap.deciders.wins / deciders >= 0.7) return "closer";

  const home = recap.cities.find((city) => city.isHome);
  const offline = recap.cities.reduce((sum, city) => sum + city.count, 0);
  if (home && offline >= 10 && home.count / offline >= 0.8) return "local";
  if (recap.countryCount >= 3 || recap.cities.length >= 10) return "road";
  if (recap.streak.length >= 12) return "iron";
  if (recap.upsetCount >= 10) return "slayer";
  return "gate";
};

// Everything the recap shows, from one year of a player's events and sets.
// `isKnownCharacter` leaves out picks from games the site has no art for.
export const computeRecap = (
  player: RecapPlayer,
  year: number,
  events: RecapEvent[],
  sets: RecapSet[],
  isKnownCharacter: (id: string) => boolean = () => true,
): Recap => {
  const eventById = new Map(events.map((event) => [event.id, event]));

  // A tournament counts once however many of its events the player entered.
  const byTournament = new Map<string, Tournament>();
  for (const event of events) {
    const entry = byTournament.get(event.tournament.id) ?? {
      info: event.tournament,
      startAt: event.startAt,
      events: [],
    };
    entry.events.push(event);
    entry.startAt = Math.min(entry.startAt, event.startAt);
    byTournament.set(event.tournament.id, entry);
  }
  const tournaments = [...byTournament.values()].sort(
    (a, b) => a.startAt - b.startAt,
  );

  // Attendance by week.
  const yearStart = new Date(year, 0, 1).getTime();
  const weeks = Array.from({ length: WEEKS }, () => false);
  for (const tournament of tournaments) {
    const week = Math.floor((tournament.startAt - yearStart) / (7 * DAY_MS));
    weeks[Math.min(WEEKS - 1, Math.max(0, week))] = true;
  }
  const streak = { start: 0, length: 0 };
  let run = 0;
  weeks.forEach((entered, week) => {
    run = entered ? run + 1 : 0;
    if (run > streak.length) {
      streak.length = run;
      streak.start = week - run + 1;
    }
  });

  const month = mostCommon(tournaments, (t) => new Date(t.startAt).getMonth());
  const weekday = mostCommon(tournaments, (t) => new Date(t.startAt).getDay());
  const series = mostCommon(tournaments, (t) => seriesName(t.info.name));

  const icons: Recap["icons"] = [];
  const seenSeries = new Set<string>();
  for (const tournament of tournaments) {
    const name = seriesName(tournament.info.name);
    if (seenSeries.has(name)) continue;
    seenSeries.add(name);
    if (icons.length < MAX_ICONS) {
      icons.push({ label: name, url: tournament.info.iconUrl });
    }
  }

  // Sets.
  const wins = sets.filter((set) => set.won).length;
  const deciders = { wins: 0, losses: 0 };
  let games = 0;
  let winStreak = 0;
  run = 0;
  const monthly = Array.from({ length: 12 }, () => ({ wins: 0, losses: 0 }));
  for (const set of sets) {
    if (set.score) {
      const { mine, theirs } = set.score;
      games += mine + theirs;
      if (Math.abs(mine - theirs) === 1 && Math.min(mine, theirs) >= 1) {
        if (set.won) deciders.wins++;
        else deciders.losses++;
      }
    }
    run = set.won ? run + 1 : 0;
    winStreak = Math.max(winStreak, run);
    const tally = monthly[new Date(set.completedAt).getMonth()];
    if (set.won) tally.wins++;
    else tally.losses++;
  }
  let bestMonth: Recap["bestMonth"] = null;
  monthly.forEach((tally, index) => {
    const played = tally.wins + tally.losses;
    if (played < MIN_MONTH_SETS) return;
    const rate = tally.wins / played;
    if (
      !bestMonth ||
      rate > bestMonth.wins / (bestMonth.wins + bestMonth.losses)
    ) {
      bestMonth = { month: index, ...tally };
    }
  });

  // Characters. A set is credited to the character played most in it.
  const gamesByCharacter = new Map<string, number>();
  const recordByCharacter = new Map<string, { wins: number; losses: number }>();
  for (const set of sets) {
    const picks = set.characterIds.filter(isKnownCharacter);
    for (const id of picks) {
      gamesByCharacter.set(id, (gamesByCharacter.get(id) ?? 0) + 1);
    }
    const main = mostCommon(picks, (id) => id);
    if (!main) continue;
    const record = recordByCharacter.get(main.key) ?? { wins: 0, losses: 0 };
    if (set.won) record.wins++;
    else record.losses++;
    recordByCharacter.set(main.key, record);
  }
  const recordedGames = [...gamesByCharacter.values()].reduce(
    (sum, count) => sum + count,
    0,
  );
  const characters = [...gamesByCharacter]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([id, count]) => ({
      id,
      games: count,
      wins: recordByCharacter.get(id)?.wins ?? 0,
      losses: recordByCharacter.get(id)?.losses ?? 0,
    }));
  const mix = Array.from({ length: 12 }, (_, index) => {
    const picks = sets
      .filter((set) => new Date(set.completedAt).getMonth() === index)
      .flatMap((set) => set.characterIds.filter(isKnownCharacter));
    return {
      total: picks.length,
      shares: characters.map((character) =>
        percent(picks.filter((id) => id === character.id).length, picks.length),
      ),
    };
  });

  // Opponents. Newest first, so the name kept is the opponent's current tag.
  const matchups = new Map<string, RecapOpponent>();
  for (const set of [...sets].reverse()) {
    if (!set.opponent.playerId) continue;
    const matchup = matchups.get(set.opponent.playerId) ?? {
      tag: set.opponent.tag,
      avatarUrl: set.opponent.avatarUrl,
      wins: 0,
      losses: 0,
    };
    if (set.won) matchup.wins++;
    else matchup.losses++;
    matchup.avatarUrl ??= set.opponent.avatarUrl;
    matchups.set(set.opponent.playerId, matchup);
  }
  const pick = (
    candidates: [string, RecapOpponent][],
    score: (m: RecapOpponent) => number,
  ) =>
    candidates.reduce<[string, RecapOpponent] | null>(
      (best, entry) =>
        !best || score(entry[1]) > score(best[1]) ? entry : best,
      null,
    );
  const all = [...matchups];
  const rivalEntry = pick(all, (m) => m.wins + m.losses + m.wins / 1000);
  const nemesis = pick(
    all.filter(([, m]) => m.losses > m.wins),
    (m) => m.losses - m.wins / 1000,
  );
  const favorite = pick(
    all.filter(([, m]) => m.losses === 0),
    (m) => m.wins,
  );

  // Placements, in main brackets only.
  const placed = events.filter(
    (event) =>
      !event.isSide && event.placement !== null && event.numEntrants > 1,
  );
  const bestEvent = placed.reduce<RecapEvent | null>((best, event) => {
    if (!best) return event;
    if (event.placement !== best.placement) {
      return event.placement! < best.placement! ? event : best;
    }
    return event.numEntrants > best.numEntrants ? event : best;
  }, null);

  const upsets: RecapUpset[] = [];
  for (const set of sets) {
    const event = eventById.get(set.eventId);
    if (!set.won || !set.seed || !set.opponent.seed || !event || event.isSide) {
      continue;
    }
    const factor = upsetFactor(set.seed, set.opponent.seed);
    if (factor <= 0) continue;
    upsets.push({
      factor,
      seed: set.seed,
      opponentSeed: set.opponent.seed,
      opponent: set.opponent.tag,
      avatarUrl: set.opponent.avatarUrl,
      score: set.score,
      tournament: event.tournament.name,
    });
  }
  upsets.sort((a, b) => b.factor - a.factor || a.opponentSeed - b.opponentSeed);

  const seeded = placed.filter((event) => event.seed !== null);
  const beaten = seeded.filter(
    (event) => event.placement! < TIERS[tierOf(event.seed!)],
  ).length;

  // Cities, from tournaments played in person.
  const isOffline = (tournament: Tournament) =>
    tournament.events.some((event) => !event.isOnline);
  const located = tournaments.filter(
    (t) => isOffline(t) && t.info.lat !== null && t.info.lng !== null,
  );
  const cityMap = new Map<
    string,
    { name: string; countryCode: string; points: Point[]; best: number | null }
  >();
  for (const tournament of located) {
    const { city, countryCode, lat, lng } = tournament.info;
    const key = `${city ?? "?"}|${countryCode ?? "?"}`;
    const entry = cityMap.get(key) ?? {
      name: city ?? "?",
      countryCode: countryCode ?? "?",
      points: [],
      best: null,
    };
    entry.points.push({ lon: lng!, lat: lat! });
    for (const event of tournament.events) {
      if (event.isSide || event.placement === null) continue;
      if (entry.best === null || event.placement < entry.best) {
        entry.best = event.placement;
      }
    }
    cityMap.set(key, entry);
  }
  const ranked = [...cityMap.values()]
    .map((entry) => ({
      name: entry.name,
      countryCode: entry.countryCode,
      count: entry.points.length,
      best: entry.best,
      lon: entry.points.reduce((s, p) => s + p.lon, 0) / entry.points.length,
      lat: entry.points.reduce((s, p) => s + p.lat, 0) / entry.points.length,
    }))
    .sort((a, b) => b.count - a.count);
  const labelled: Point[] = [];
  const cities: RecapCity[] = ranked.map((city, index) => {
    const showLabel =
      index === 0 ||
      labelled.every((p) => distanceKm(p, city) > LABEL_SPACING_KM);
    if (showLabel) labelled.push(city);
    return {
      ...city,
      isHome: index === 0,
      isFar: distanceKm(ranked[0], city) > TRIP_KM,
      showLabel,
    };
  });
  // Straight lines between consecutive tournaments: an estimate.
  let travelled = 0;
  located.forEach((tournament, index) => {
    if (index === 0) return;
    const previous = located[index - 1].info;
    travelled += distanceKm(
      { lon: previous.lng!, lat: previous.lat! },
      { lon: tournament.info.lng!, lat: tournament.info.lat! },
    );
  });

  const recap: Omit<Recap, "type"> = {
    year,
    player,
    tournaments: tournaments.length,
    weeks,
    streak,
    busiestMonth: month
      ? { month: Number(month.key), count: month.count }
      : null,
    series: series
      ? {
          name: series.key,
          count: series.count,
          iconUrl:
            tournaments.find(
              (t) => seriesName(t.info.name) === series.key && t.info.iconUrl,
            )?.info.iconUrl ?? null,
        }
      : null,
    icons,
    setCount: sets.length,
    wins,
    losses: sets.length - wins,
    winPercent: percent(wins, sets.length),
    games,
    entrantsFaced: tournaments.reduce(
      (sum, t) => sum + Math.max(...t.events.map((e) => e.numEntrants)),
      0,
    ),
    deciders,
    winStreak,
    monthRates: monthly.map((tally) =>
      tally.wins + tally.losses
        ? percent(tally.wins, tally.wins + tally.losses)
        : null,
    ),
    bestMonth,
    characters,
    recordedGames,
    characterCount: [...gamesByCharacter.values()].filter(
      (count) => count >= recordedGames * 0.05,
    ).length,
    mix,
    bestRun: bestEvent
      ? {
          placement: bestEvent.placement!,
          entrants: bestEvent.numEntrants,
          seed: bestEvent.seed,
          name: bestEvent.tournament.name,
          sets: sets
            .filter((set) => set.eventId === bestEvent.id)
            .map((set) => ({
              round: set.round,
              opponent: set.opponent.tag,
              avatarUrl: set.opponent.avatarUrl,
              score: set.score,
              won: set.won,
            })),
        }
      : null,
    bracketWins: placed.filter((event) => event.placement === 1).length,
    top3: placed.filter((event) => event.placement! <= 3).length,
    top8: placed.filter((event) => event.placement! <= 8).length,
    upsets: upsets.slice(0, 4),
    upsetCount: upsets.length,
    aboveSeed: { beaten, seeded: seeded.length },
    rival: rivalEntry?.[1] ?? null,
    rivalSets: rivalEntry
      ? sets
          .filter((set) => set.opponent.playerId === rivalEntry[0])
          .map((set) => ({ won: set.won, score: set.score }))
      : [],
    nemesis: nemesis?.[1] ?? null,
    favorite: favorite?.[1] ?? null,
    cities,
    countryCount: new Set(cities.map((city) => city.countryCode)).size,
    distanceKm: Math.round(travelled),
    restView: restViewFor(cities),
    weekday: weekday
      ? { day: Number(weekday.key), count: weekday.count }
      : null,
    offlinePercent: percent(
      tournaments.filter(isOffline).length,
      tournaments.length,
    ),
  };

  return { ...recap, type: pickType(recap) };
};
