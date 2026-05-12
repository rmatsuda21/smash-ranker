// Lazy-loaded snapshot of the better-gg player profiles, used as the primary
// source for the fallback-character lookup. Falling back to start.gg's
// recentStandings is slower (1 request per opponent) and noisier (we have to
// aggregate set-level character selections), so we try the local data first.
//
// Swap the URL below for a github gist raw URL if you'd rather host the data
// separately from the better-gg repo. Gist raw URLs look like:
//   https://gist.githubusercontent.com/<user>/<gist-id>/raw/players.json
import { logWarning } from "@/utils/observability/log";

const PLAYERS_DATA_URL =
  "https://raw.githubusercontent.com/rmatsuda21/better-gg/main/public/data/players.json";

type LocalPlayerChar = {
  id: number;
  pct: number;
  role: string;
};

type LocalPlayer = {
  pid: number;
  tag: string;
  pfx: string;
  disc: string;
  cc: string | null;
  chars: LocalPlayerChar[];
  tc: number;
};

let cache: Map<string, LocalPlayer> | null = null;
let inflight: Promise<Map<string, LocalPlayer>> | null = null;

const buildIndex = (arr: LocalPlayer[]): Map<string, LocalPlayer> => {
  const map = new Map<string, LocalPlayer>();
  for (const p of arr) {
    if (typeof p?.pid === "number") map.set(String(p.pid), p);
  }
  return map;
};

const fetchOnce = async (): Promise<Map<string, LocalPlayer>> => {
  try {
    const res = await fetch(PLAYERS_DATA_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const arr = (await res.json()) as LocalPlayer[];
    if (!Array.isArray(arr)) throw new Error("payload is not an array");
    cache = buildIndex(arr);
    return cache;
  } catch (err) {
    // Best-effort lookup — failure just means callers fall through to the
    // start.gg query. Don't surface as an error to the user.
    logWarning("better-gg players data fetch failed", {
      area: "results-fetch",
      url: PLAYERS_DATA_URL,
      error: err instanceof Error ? err.message : String(err),
    });
    cache = new Map();
    return cache;
  }
};

/** Resolves to the player-id-keyed index. Caches per session. */
export const getLocalPlayersData = (): Promise<Map<string, LocalPlayer>> => {
  if (cache) return Promise.resolve(cache);
  if (inflight) return inflight;
  inflight = fetchOnce().finally(() => {
    inflight = null;
  });
  return inflight;
};

/**
 * Returns the start.gg character id (as a string) of the player's main from
 * better-gg's local snapshot, or null if the player isn't in the dataset or
 * has no recorded characters. `chars` is sorted by `pct` desc and the first
 * entry is the main, so we just take [0].
 */
export const getLocalMainCharacterId = (
  data: Map<string, LocalPlayer>,
  playerId: string | null | undefined,
): string | null => {
  if (!playerId) return null;
  const entry = data.get(String(playerId));
  if (!entry || !Array.isArray(entry.chars) || entry.chars.length === 0) {
    return null;
  }
  const top = entry.chars[0];
  return top?.id ? String(top.id) : null;
};
