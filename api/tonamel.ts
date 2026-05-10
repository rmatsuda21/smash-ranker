import "./_instrument";

import type { VercelRequest, VercelResponse } from "@vercel/node";

import {
  addBreadcrumb,
  captureFnException,
  withLogging,
} from "./_lib/withLogging";

const TONAMEL_BASE = "https://tonamel.com";
const MANAGEMENT_ENDPOINT = `${TONAMEL_BASE}/graphql/competition_management`;
const PUBLIC_ENDPOINT = `${TONAMEL_BASE}/graphql`;

// Step 1: Get tournament IDs from management endpoint
const COMPETITION_QUERY = `
  query($id: ID!) {
    competition(id: $id) {
      title
      tournaments { id status style }
    }
  }
`;

// Step 2: Get block IDs for a tournament
const BLOCKS_QUERY = `
  query($competitionId: ID!, $tournamentId: ID!, $blockFilter: BlocksFilter!) {
    competition(id: $competitionId) {
      tournament(id: $tournamentId) {
        blocks(filter: $blockFilter) {
          edges { node { id label } }
        }
      }
    }
  }
`;

// Step 3: Get podium (placements) for a block
const PODIUM_QUERY = `
  query($competitionId: ID!, $tournamentId: ID!, $blockId: ID!, $filter: ParticipantFilter!) {
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
  }
`;

// Step 4: Get competition metadata + participants from public endpoint
const PUBLIC_COMPETITION_QUERY = `
  query($id: ID!) {
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
  }
`;

async function fetchCsrfToken(): Promise<{ token: string; cookies: string }> {
  const res = await fetch(`${TONAMEL_BASE}/api/csrf_token`, {
    headers: { Accept: "application/json" },
  });

  if (!res.ok) throw new Error(`Failed to get CSRF token: ${res.status}`);

  const data = await res.json();
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

async function fetchCompetition(slug: string, podiumLimit: number) {
  let csrf: { token: string; cookies: string };
  try {
    csrf = await fetchCsrfToken();
    addBreadcrumb("tonamel", "csrf_token_ok");
  } catch (err) {
    addBreadcrumb("tonamel", "csrf_token_fail", { error: String(err) });
    throw err;
  }
  const { token, cookies } = csrf;

  // Step 1: Get competition info + tournament IDs from management endpoint
  let compData;
  try {
    compData = await queryGraphQL(
      MANAGEMENT_ENDPOINT,
      COMPETITION_QUERY,
      { id: slug },
      token,
      cookies,
      slug,
    );
    addBreadcrumb("tonamel", "competition_query_ok", { slug });
  } catch (err) {
    addBreadcrumb("tonamel", "competition_query_fail", {
      slug,
      error: String(err),
    });
    throw err;
  }

  const competition = compData.data?.competition;
  if (!competition) throw new Error("Competition not found");

  // Step 2: Try to get placements via tournament -> blocks -> podium
  interface Placement {
    place: number;
    displayName: string;
    playerId: string;
  }
  const placements: Placement[] = [];
  const tournaments = competition.tournaments ?? [];
  const tournamentStyles: string[] = tournaments
    .map((t: any) => t.style)
    .filter(Boolean);
  let blockCount = 0;

  if (tournaments.length > 0) {
    const tournamentId = tournaments[0].id;

    let blocksData;
    try {
      blocksData = await queryGraphQL(
        MANAGEMENT_ENDPOINT,
        BLOCKS_QUERY,
        {
          competitionId: slug,
          tournamentId,
          blockFilter: { first: 10, after: "", last: 10, before: "" },
        },
        token,
        cookies,
        slug,
      );
      addBreadcrumb("tonamel", "blocks_query_ok");
    } catch (err) {
      addBreadcrumb("tonamel", "blocks_query_fail", { error: String(err) });
      throw err;
    }

    const blocks =
      blocksData.data?.competition?.tournament?.blocks?.edges ?? [];
    blockCount = blocks.length;

    if (blocks.length > 0) {
      const blockId = blocks[0].node.id;

      let podiumData;
      try {
        podiumData = await queryGraphQL(
          MANAGEMENT_ENDPOINT,
          PODIUM_QUERY,
          {
            competitionId: slug,
            tournamentId,
            blockId,
            filter: {
              first: podiumLimit,
              after: "",
              last: podiumLimit,
              before: "",
            },
          },
          token,
          cookies,
          slug,
        );
        addBreadcrumb("tonamel", "podium_query_ok");
      } catch (err) {
        addBreadcrumb("tonamel", "podium_query_fail", { error: String(err) });
        throw err;
      }

      const podiumEdges =
        podiumData.data?.competition?.tournament?.block?.podium?.edges ?? [];

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
  let publicData;
  try {
    publicData = await queryGraphQL(
      PUBLIC_ENDPOINT,
      PUBLIC_COMPETITION_QUERY,
      { id: slug },
      token,
      cookies,
      slug,
    );
    addBreadcrumb("tonamel", "public_query_ok");
  } catch (err) {
    addBreadcrumb("tonamel", "public_query_fail", { error: String(err) });
    throw err;
  }

  const publicComp = publicData.data?.competition;

  interface ParticipantInfo {
    playerId: string;
    name: string;
    countryCode?: string;
    gameCode?: string;
  }
  const participants: ParticipantInfo[] = [];
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

const handler = async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const slug = req.query.slug as string;
  if (!slug) {
    return res
      .status(400)
      .json({ error: "Missing required query param: slug" });
  }

  const playerCountParam = parseInt(req.query.playerCount as string, 10);
  const podiumLimit =
    Number.isFinite(playerCountParam) && playerCountParam > 0
      ? Math.min(playerCountParam, 256)
      : 20;

  try {
    const data = await fetchCompetition(slug, podiumLimit);
    return res.status(200).json(data);
  } catch (error) {
    captureFnException(error, { fn: "tonamel" });
    const message =
      error instanceof Error ? error.message : "Failed to fetch from Tonamel";
    return res.status(500).json({ error: message });
  }
};

export default withLogging("tonamel", handler);
