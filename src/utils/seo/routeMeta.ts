import { decodeInvite } from "../predict/inviteCode.js";

export type RouteMeta = {
  // The title shared in link previews.
  title: string;
  // The browser tab's title, when it is shorter than the shared one. The app
  // sets the same one once it runs (`useDocumentTitle`).
  tabTitle?: string;
  description: string;
  image: string;
  url: string;
  type: "website" | "article";
};

const SITE = "https://smash-ranker.app";
const DEFAULT_IMAGE = `${SITE}/og-image.png`;

const STATIC_ROUTES: Record<string, RouteMeta> = {
  "/": {
    title: "Smash Ranker — Tournament graphics for Super Smash Bros.",
    tabTitle: "Smash Ranker",
    description: "Your one-stop shop for Super Smash Bros. graphics!",
    image: DEFAULT_IMAGE,
    url: `${SITE}/`,
    type: "website",
  },
  "/ranker": {
    title: "Ranker | Smash Ranker",
    description:
      "Generate Top 8 bracket graphics for your Super Smash Bros. tournament.",
    image: DEFAULT_IMAGE,
    url: `${SITE}/ranker`,
    type: "website",
  },
  "/tier": {
    title: "Tier List | Smash Ranker",
    description:
      "Build and share Super Smash Bros. tier lists with customizable labels, layout, and image style.",
    image: DEFAULT_IMAGE,
    url: `${SITE}/tier`,
    type: "website",
  },
  "/predict": {
    title: "Predictions | Smash Ranker",
    description:
      "Make and share your tournament predictions for any Super Smash Bros. tournament.",
    image: DEFAULT_IMAGE,
    url: `${SITE}/predict`,
    type: "website",
  },
  "/thumbnail": {
    title: "Thumbnail Maker | Smash Ranker",
    description:
      "Make video thumbnails for Super Smash Bros. sets, filled in from start.gg.",
    image: DEFAULT_IMAGE,
    url: `${SITE}/thumbnail`,
    type: "website",
  },
};

const escapeAttr = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

export const renderHeadTags = (meta: RouteMeta): string => {
  const t = escapeAttr(meta.title);
  const tab = escapeAttr(meta.tabTitle ?? meta.title);
  const d = escapeAttr(meta.description);
  const u = escapeAttr(meta.url);
  const i = escapeAttr(meta.image);

  return [
    `<title>${tab}</title>`,
    `<meta name="description" content="${d}" />`,
    `<link rel="canonical" href="${u}" />`,
    `<meta property="og:type" content="${meta.type}" />`,
    `<meta property="og:site_name" content="Smash Ranker" />`,
    `<meta property="og:title" content="${t}" />`,
    `<meta property="og:description" content="${d}" />`,
    `<meta property="og:url" content="${u}" />`,
    `<meta property="og:image" content="${i}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${t}" />`,
    `<meta name="twitter:description" content="${d}" />`,
    `<meta name="twitter:image" content="${i}" />`,
  ].join("\n    ");
};

// `null`: the invite names no tournament we could find (the generic tags are
// the right answer). `"failed"`: the lookup itself broke or timed out, so the
// generic tags are a stand-in that must not be cached.
type TournamentLookup = { name: string } | null | "failed";

// The edge middleware waits on this before any HTML goes out.
const LOOKUP_TIMEOUT_MS = 5000;

const fetchTournamentName = async (
  origin: string,
  inviteCode: string,
): Promise<TournamentLookup> => {
  try {
    const res = await fetch(
      `${origin}/api/tournament-meta?d=${encodeURIComponent(inviteCode)}`,
      {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(LOOKUP_TIMEOUT_MS),
      },
    );
    if (res.status === 404) return null;
    if (!res.ok) {
      console.warn(
        JSON.stringify({
          fn: "route-meta",
          lookup: "failed",
          status: res.status,
        }),
      );
      return "failed";
    }
    const json = (await res.json()) as { name?: string };
    if (!json.name) return null;
    return { name: json.name };
  } catch (err) {
    console.warn(
      JSON.stringify({
        fn: "route-meta",
        lookup: "failed",
        error: err instanceof Error ? err.name : "unknown",
      }),
    );
    return "failed";
  }
};

export type RouteMetaResult = {
  meta: RouteMeta;
  // The page's own tags could not be worked out and these are the generic
  // ones in their place.
  lookupFailed: boolean;
};

export const getRouteMeta = async (url: URL): Promise<RouteMetaResult> => {
  const pathname = url.pathname;
  let lookupFailed = false;

  if (pathname === "/predict") {
    const inviteCode = url.searchParams.get("d");
    if (inviteCode) {
      const invite = decodeInvite(inviteCode);
      if (invite) {
        const tournament = await fetchTournamentName(url.origin, inviteCode);
        if (tournament === "failed") {
          lookupFailed = true;
        } else if (tournament) {
          return {
            meta: {
              title: `Predict ${tournament.name} | Smash Ranker`,
              description: `Make your Top 8 prediction for ${tournament.name} and share it.`,
              image: `${SITE}/api/og-image?d=${encodeURIComponent(inviteCode)}`,
              url: `${SITE}/predict?d=${encodeURIComponent(inviteCode)}`,
              type: "article",
            },
            lookupFailed: false,
          };
        }
      }
    }
  }

  return {
    meta: STATIC_ROUTES[pathname] ?? STATIC_ROUTES["/"],
    lookupFailed,
  };
};
