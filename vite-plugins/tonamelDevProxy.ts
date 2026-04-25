import type { Plugin } from "vite";

const TONAMEL_BASE = "https://tonamel.com";
const TONAMEL_MANAGEMENT_ENDPOINT = `${TONAMEL_BASE}/graphql/competition_management`;
const TONAMEL_PUBLIC_ENDPOINT = `${TONAMEL_BASE}/graphql`;

async function fetchCsrfToken(): Promise<{ token: string; cookies: string }> {
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

async function queryGraphQL(
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

async function fetchCompetition(slug: string) {
  const { token, cookies } = await fetchCsrfToken();

  // Step 1: Get tournament IDs from management endpoint
  const compData = await queryGraphQL(
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

    const blocksData = await queryGraphQL(
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

      const podiumData = await queryGraphQL(
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
  const publicData = await queryGraphQL(
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

export function tonamelDevProxy(): Plugin {
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
          const data = await fetchCompetition(slug);
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
