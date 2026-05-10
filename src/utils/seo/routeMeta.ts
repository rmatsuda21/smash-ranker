import { decodeInvite } from "../predict/inviteCode";

export type RouteMeta = {
  title: string;
  description: string;
  image: string;
  url: string;
  type: "website" | "article";
};

const SITE = "https://smash-ranker.app";
const DEFAULT_IMAGE = `${SITE}/og-default.png`;

const STATIC_ROUTES: Record<string, RouteMeta> = {
  "/": {
    title: "Smash Ranker — Tournament graphics for Super Smash Bros.",
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
    title: "Tierlist | Smash Ranker",
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
    title: "Thumbnail | Smash Ranker",
    description: "Design custom thumbnails for Super Smash Bros. content.",
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
  const d = escapeAttr(meta.description);
  const u = escapeAttr(meta.url);
  const i = escapeAttr(meta.image);

  return [
    `<title>${t}</title>`,
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

type FetchedTournament = { name: string };

const fetchTournamentName = async (
  origin: string,
  inviteCode: string,
): Promise<FetchedTournament | null> => {
  try {
    const res = await fetch(
      `${origin}/api/tournament-meta?d=${encodeURIComponent(inviteCode)}`,
      { headers: { Accept: "application/json" } },
    );
    if (!res.ok) return null;
    const json = (await res.json()) as { name?: string };
    if (!json.name) return null;
    return { name: json.name };
  } catch {
    return null;
  }
};

export const getRouteMeta = async (url: URL): Promise<RouteMeta> => {
  const pathname = url.pathname;

  if (pathname === "/predict") {
    const inviteCode = url.searchParams.get("d");
    if (inviteCode) {
      const invite = decodeInvite(inviteCode);
      if (invite) {
        const tournament = await fetchTournamentName(url.origin, inviteCode);
        if (tournament) {
          return {
            title: `Predict ${tournament.name} | Smash Ranker`,
            description: `Make your Top 8 prediction for ${tournament.name} and share it.`,
            image: `${SITE}/api/og-image?d=${encodeURIComponent(inviteCode)}`,
            url: `${SITE}/predict?d=${encodeURIComponent(inviteCode)}`,
            type: "article",
          };
        }
      }
    }
  }

  return STATIC_ROUTES[pathname] ?? STATIC_ROUTES["/"];
};
