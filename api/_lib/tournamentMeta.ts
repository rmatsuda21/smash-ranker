// Shared upstream fetchers used by `api/og-image` and `api/tournament-meta`.
// Returns a normalized minimum-viable record so the OG renderer and middleware
// don't need to know each platform's wire format.

export type Platform = "startgg" | "challonge" | "tonamel";

export type TournamentMeta = {
  name: string;
  iconUrl: string | null;
  startAt: string | null;
};

const FETCH_TIMEOUT_MS = 4000;

const fetchWithTimeout = async (
  input: string,
  init?: RequestInit,
): Promise<Response> => {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(input, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
};

// --- start.gg ---

const STARTGG_GQL = "https://api.start.gg/gql/alpha";

const STARTGG_QUERY = `
  query EventMeta($slug: String!) {
    event(slug: $slug) {
      name
      startAt
      tournament {
        name
        images { url type }
      }
    }
  }
`;

const fetchStartGG = async (slug: string): Promise<TournamentMeta | null> => {
  const token = process.env.VITE_START_GG_TOKEN;
  if (!token) return null;

  const res = await fetchWithTimeout(STARTGG_GQL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query: STARTGG_QUERY, variables: { slug } }),
  });
  if (!res.ok) return null;

  const json = (await res.json()) as {
    data?: {
      event?: {
        name: string | null;
        startAt: number | null;
        tournament?: {
          name: string | null;
          images?: { url: string; type: string }[] | null;
        } | null;
      } | null;
    };
  };

  const event = json.data?.event;
  if (!event) return null;

  const profileImg = event.tournament?.images?.find(
    (img) => img.type === "profile",
  );
  const fallbackImg = event.tournament?.images?.[0];
  const iconUrl = profileImg?.url ?? fallbackImg?.url ?? null;

  const name = event.tournament?.name ?? event.name ?? "";
  const startAt = event.startAt
    ? new Date(event.startAt * 1000).toISOString()
    : null;

  return { name, iconUrl, startAt };
};

// --- Challonge ---

const fetchChallonge = async (slug: string): Promise<TournamentMeta | null> => {
  const apiKey = process.env.CHALLONGE_API_KEY;
  if (!apiKey) return null;

  const url = `https://api.challonge.com/v1/tournaments/${encodeURIComponent(
    slug,
  )}.json?api_key=${encodeURIComponent(apiKey)}`;

  const res = await fetchWithTimeout(url);
  if (!res.ok) return null;

  const json = (await res.json()) as {
    tournament?: {
      name?: string;
      started_at?: string | null;
      live_image_url?: string | null;
    };
  };

  const tournament = json.tournament;
  if (!tournament) return null;

  return {
    name: tournament.name ?? "",
    iconUrl: tournament.live_image_url ?? null,
    startAt: tournament.started_at ?? null,
  };
};

// --- Tonamel ---

const TONAMEL_BASE = "https://tonamel.com";

const TONAMEL_PUBLIC_QUERY = `
  query($id: ID!) {
    competition(id: $id) {
      name
      competitionStartAt
      imageUrl
    }
  }
`;

const fetchTonamelCsrf = async (): Promise<{
  token: string;
  cookies: string;
} | null> => {
  const res = await fetchWithTimeout(`${TONAMEL_BASE}/api/csrf_token`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return null;

  const data = (await res.json()) as {
    token?: string;
    csrfToken?: string;
    csrf_token?: string;
  };
  const token = data.token ?? data.csrfToken ?? data.csrf_token;
  if (!token) return null;

  const setCookies = res.headers.getSetCookie?.() ?? [];
  const cookies = setCookies.map((c: string) => c.split(";")[0]).join("; ");

  return { token, cookies };
};

const fetchTonamel = async (slug: string): Promise<TournamentMeta | null> => {
  const csrf = await fetchTonamelCsrf();
  if (!csrf) return null;

  const res = await fetchWithTimeout(`${TONAMEL_BASE}/graphql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": csrf.token,
      Cookie: csrf.cookies,
      Referer: `${TONAMEL_BASE}/competition/${slug}`,
    },
    body: JSON.stringify({
      query: TONAMEL_PUBLIC_QUERY,
      variables: { id: slug },
    }),
  });
  if (!res.ok) return null;

  const json = (await res.json()) as {
    data?: {
      competition?: {
        name?: string;
        competitionStartAt?: string | null;
        imageUrl?: string | null;
      } | null;
    };
  };

  const comp = json.data?.competition;
  if (!comp) return null;

  return {
    name: comp.name ?? "",
    iconUrl: comp.imageUrl ?? null,
    startAt: comp.competitionStartAt ?? null,
  };
};

// --- Dispatch ---

export const fetchTournamentMeta = async (
  platform: Platform,
  slug: string,
): Promise<TournamentMeta | null> => {
  try {
    switch (platform) {
      case "startgg":
        return await fetchStartGG(slug);
      case "challonge":
        return await fetchChallonge(slug);
      case "tonamel":
        return await fetchTonamel(slug);
    }
  } catch {
    return null;
  }
};

// --- Invite decoding (duplicated locally — api/ builds independently of src/) ---

const VERSION = "1";
const PLATFORM_FROM_CHAR: Record<string, Platform> = {
  s: "startgg",
  c: "challonge",
  t: "tonamel",
};

const base64urlDecode = (code: string): string | null => {
  if (!/^[A-Za-z0-9_-]*$/.test(code)) return null;
  try {
    const padded = code.replace(/-/g, "+").replace(/_/g, "/");
    const padCount = (4 - (padded.length % 4)) % 4;
    return Buffer.from(padded + "=".repeat(padCount), "base64").toString(
      "utf8",
    );
  } catch {
    return null;
  }
};

const expandSlug = (platform: Platform, compact: string): string | null => {
  if (platform !== "startgg") return compact;
  const parts = compact.split("/");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  return `tournament/${parts[0]}/event/${parts[1]}`;
};

export const decodeInvite = (
  code: string | null | undefined,
): { platform: Platform; slug: string } | null => {
  if (!code) return null;
  const text = base64urlDecode(code);
  if (!text || text.length < 3) return null;
  if (text[0] !== VERSION) return null;
  const platform = PLATFORM_FROM_CHAR[text[1]];
  if (!platform) return null;
  const slug = expandSlug(platform, text.slice(2));
  if (!slug) return null;
  return { platform, slug };
};
