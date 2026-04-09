import path from "path";
import { defineConfig, type Plugin } from "vite";

import react from "@vitejs/plugin-react-swc";
import { analyzer } from "vite-bundle-analyzer";
import { lingui } from "@lingui/vite-plugin";

const CHALLONGE_API_BASE = "https://api.challonge.com/v1";

function challongeDevProxy(): Plugin {
  return {
    name: "challonge-dev-proxy",
    configureServer(server) {
      server.middlewares.use("/api/challonge", async (req, res) => {
        const apiKey = process.env.CHALLONGE_API_KEY;
        if (!apiKey) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: "CHALLONGE_API_KEY not set" }));
          return;
        }

        const url = new URL(req.url ?? "/", "http://localhost");
        const slug = url.searchParams.get("slug");

        if (!slug) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: "Missing slug param" }));
          return;
        }

        const apiUrl = `${CHALLONGE_API_BASE}/tournaments/${slug}.json?api_key=${encodeURIComponent(apiKey)}&include_participants=1`;

        try {
          const response = await fetch(apiUrl);
          const text = await response.text();
          res.statusCode = response.status;
          res.setHeader("Content-Type", "application/json");
          res.end(text);
        } catch {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: "Failed to fetch from Challonge" }));
        }
      });
    },
  };
}

const TONAMEL_BASE = "https://tonamel.com";

async function tonamelFetchCsrfToken(): Promise<{ token: string; cookies: string }> {
  const res = await fetch(`${TONAMEL_BASE}/api/csrf_token`, {
    headers: { Accept: "application/json" },
  });

  if (!res.ok) throw new Error(`Failed to get CSRF token: ${res.status}`);

  const data = (await res.json()) as Record<string, string>;
  const token = data.token || data.csrfToken || data.csrf_token;
  if (!token) throw new Error("No CSRF token in response");

  const setCookies = res.headers.getSetCookie?.() ?? [];
  const cookieStr = setCookies.map((c: string) => c.split(";")[0]).join("; ");

  return { token, cookies: cookieStr };
}

const TONAMEL_MANAGEMENT_ENDPOINT = `${TONAMEL_BASE}/graphql/competition_management`;
const TONAMEL_PUBLIC_ENDPOINT = `${TONAMEL_BASE}/graphql`;

async function tonamelQueryGraphQL(
  endpoint: string,
  query: string,
  variables: Record<string, unknown>,
  token: string,
  cookies: string,
  slug: string,
) {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": token,
      Cookie: cookies,
      Referer: `${TONAMEL_BASE}/competition/${slug}`,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Tonamel GraphQL error: ${res.status} - ${text}`);
  }

  return res.json();
}

async function tonamelFetchCompetition(slug: string) {
  const { token, cookies } = await tonamelFetchCsrfToken();

  // Step 1: Get tournament IDs from management endpoint
  const compData = await tonamelQueryGraphQL(
    TONAMEL_MANAGEMENT_ENDPOINT,
    `query($id: ID!) {
      competition(id: $id) {
        title
        tournaments { id status style }
      }
    }`,
    { id: slug },
    token,
    cookies,
    slug,
  );

  const competition = (compData as any).data?.competition;
  if (!competition) throw new Error("Competition not found");

  // Step 2: Try to get placements via tournament -> blocks -> podium
  const placements: Array<{ place: number; displayName: string; playerId: string }> = [];
  const tournaments = competition.tournaments ?? [];
  const tournamentStyles: string[] = tournaments
    .map((t: any) => t.style)
    .filter(Boolean);
  let blockCount = 0;

  if (tournaments.length > 0) {
    const tournamentId = tournaments[0].id;

    const blocksData = await tonamelQueryGraphQL(
      TONAMEL_MANAGEMENT_ENDPOINT,
      `query($competitionId: ID!, $tournamentId: ID!, $blockFilter: BlocksFilter!) {
        competition(id: $competitionId) {
          tournament(id: $tournamentId) {
            blocks(filter: $blockFilter) {
              edges { node { id label } }
            }
          }
        }
      }`,
      {
        competitionId: slug,
        tournamentId,
        blockFilter: { first: 10, after: "", last: 10, before: "" },
      },
      token,
      cookies,
      slug,
    );

    const blocks = (blocksData as any).data?.competition?.tournament?.blocks?.edges ?? [];
    blockCount = blocks.length;

    if (blocks.length > 0) {
      const blockId = blocks[0].node.id;

      const podiumData = await tonamelQueryGraphQL(
        TONAMEL_MANAGEMENT_ENDPOINT,
        `query($competitionId: ID!, $tournamentId: ID!, $blockId: ID!, $filter: ParticipantFilter!) {
          competition(id: $competitionId) {
            tournament(id: $tournamentId) {
              block(id: $blockId) {
                podium(filter: $filter) {
                  edges {
                    node {
                      id
                      playerId
                      place
                      entrant {
                        overridePlayerName
                        entrantName { text { answer } }
                      }
                    }
                  }
                }
              }
            }
          }
        }`,
        {
          competitionId: slug,
          tournamentId,
          blockId,
          filter: { first: 20, after: "", last: 20, before: "" },
        },
        token,
        cookies,
        slug,
      );

      const podiumEdges = (podiumData as any).data?.competition?.tournament?.block?.podium?.edges ?? [];

      for (const edge of podiumEdges) {
        const node = edge.node;
        const displayName =
          node.entrant?.overridePlayerName ||
          node.entrant?.entrantName?.text?.answer ||
          "";
        if (displayName) {
          placements.push({
            place: node.place,
            displayName,
            playerId: node.playerId,
          });
        }
      }

      placements.sort((a, b) => a.place - b.place);
    }
  }

  // Step 3: Get competition metadata + participants from public endpoint
  const publicData = await tonamelQueryGraphQL(
    TONAMEL_PUBLIC_ENDPOINT,
    `query($id: ID!) {
      competition(id: $id) {
        name
        competitionStartAt
        currentEntry
        imageUrl
        game { name }
        participants(count: 50, fetchType: TOURNAMENT) {
          edges {
            node {
              player { id name countryCode }
              entryInfo { gameCode }
            }
          }
        }
      }
    }`,
    { id: slug },
    token,
    cookies,
    slug,
  );

  const publicComp = (publicData as any).data?.competition;

  const participants: Array<{ playerId: string; name: string; countryCode?: string; gameCode?: string }> = [];
  const participantEdges = publicComp?.participants?.edges ?? [];

  for (const edge of participantEdges) {
    const { player, entryInfo } = edge.node;
    participants.push({
      playerId: player.id,
      name: player.name,
      countryCode: player.countryCode || undefined,
      gameCode: entryInfo?.gameCode || undefined,
    });
  }

  return {
    competition: {
      name: publicComp?.name || competition.title,
      competitionStartAt: publicComp?.competitionStartAt,
      currentEntry: publicComp?.currentEntry,
      imageUrl: publicComp?.imageUrl,
      game: publicComp?.game || null,
      tournamentStyles,
      blockCount,
      placements,
      participants,
    },
  };
}

function tonamelDevProxy(): Plugin {
  return {
    name: "tonamel-dev-proxy",
    configureServer(server) {
      server.middlewares.use("/api/tonamel", async (req, res) => {
        const url = new URL(req.url ?? "/", "http://localhost");
        const slug = url.searchParams.get("slug");

        if (!slug) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: "Missing slug param" }));
          return;
        }

        try {
          const data = await tonamelFetchCompetition(slug);
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(data));
        } catch {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: "Failed to fetch from Tonamel" }));
        }
      });
    },
  };
}

const TONAMEL_IMAGE_ALLOWED_HOSTS = ["assets.tonamel.com", "img.tonamel.com", "p1-c2db36b0.imageflux.jp"];

function tonamelImageProxy(): Plugin {
  return {
    name: "tonamel-image-proxy",
    configureServer(server) {
      server.middlewares.use("/api/tonamel-image", async (req, res) => {
        const url = new URL(req.url ?? "/", "http://localhost");
        const imageUrl = url.searchParams.get("url");

        if (!imageUrl) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: "Missing url param" }));
          return;
        }

        let parsed: URL;
        try {
          parsed = new URL(imageUrl);
        } catch {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: "Invalid URL" }));
          return;
        }

        if (!TONAMEL_IMAGE_ALLOWED_HOSTS.includes(parsed.hostname)) {
          res.statusCode = 403;
          res.end(JSON.stringify({ error: "Host not allowed" }));
          return;
        }

        try {
          const response = await fetch(imageUrl);
          const contentType = response.headers.get("content-type") || "image/jpeg";
          const buffer = Buffer.from(await response.arrayBuffer());

          res.statusCode = response.status;
          res.setHeader("Content-Type", contentType);
          res.setHeader("Cache-Control", "public, max-age=86400");
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.end(buffer);
        } catch {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: "Failed to fetch image" }));
        }
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig(() => {
  const shouldAnalyze = process.env.ANALYZE === "true";

  return {
    plugins: [
      react({
        plugins: [["@lingui/swc-plugin", {}]],
      }),
      lingui(),
      challongeDevProxy(),
      tonamelDevProxy(),
      tonamelImageProxy(),
      shouldAnalyze && analyzer(),
    ].filter(Boolean),
    optimizeDeps: {
      force: true,
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "@assets": path.resolve(__dirname, "./src/assets"),
        "@components": path.resolve(__dirname, "./src/components"),
      },
    },
  };
});
