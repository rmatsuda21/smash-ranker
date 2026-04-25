import { useClient } from "urql";
import * as countryList from "country-list";
import { t } from "@lingui/core/macro";

import { graphql } from "@/gql";
import { usePredictionStore } from "@/store/predictionStore";
import { detectPlatformAndSlug } from "@/consts/platforms";
import { EMPTY_CHARACTER_ID } from "@/consts/top8/characters";
import type { PredictionPlayer } from "@/types/predict/Prediction";

// Step 1: Get event metadata + first phase ID
const EventMetaQueryDoc = graphql(`
  query PredictionEventMeta($slug: String!) {
    event(slug: $slug) {
      name
      startAt
      numEntrants
      tournament {
        name
        url(tab: "", relative: false)
        images {
          url
          type
        }
      }
      phases {
        id
        phaseOrder
      }
    }
  }
`);

// Step 2: Get seeds from the first phase (returns entrants in seed order)
const PhaseSeedsQueryDoc = graphql(`
  query PredictionPhaseSeeds($phaseId: ID!, $perPage: Int!, $page: Int!) {
    phase(id: $phaseId) {
      seeds(query: { page: $page, perPage: $perPage }) {
        pageInfo {
          total
          totalPages
        }
        nodes {
          seedNum
          entrant {
            id
            name
            participants {
              gamerTag
              prefix
              user {
                location {
                  country
                }
              }
            }
          }
        }
      }
    }
  }
`);

interface ChallongeParticipantWrapper {
  participant: {
    id: number;
    name: string;
    seed: number;
    final_rank: number | null;
  };
}

interface ChallongeResponse {
  tournament: {
    name: string;
    game_name: string | null;
    started_at: string | null;
    participants_count: number;
    full_challonge_url: string | null;
    participants: ChallongeParticipantWrapper[];
  };
}

interface TonamelParticipant {
  playerId: string;
  name: string;
  countryCode?: string;
  gameCode?: string;
}

interface TonamelCompetition {
  name: string;
  competitionStartAt: number;
  currentEntry: number;
  game: { name: string } | null;
  participants: TonamelParticipant[];
}

interface TonamelResponse {
  competition: TonamelCompetition | null;
}

type FetchResult = {
  tournamentName: string;
  eventName: string;
  tournamentDate: string;
  tournamentUrl: string;
  tournamentIconUrl: string;
  entrants: PredictionPlayer[];
};

const fetchStartgg = async (
  client: ReturnType<typeof useClient>,
  slug: string,
): Promise<FetchResult> => {
  // Step 1: Get event metadata and find the first phase
  const metaResult = await client
    .query(EventMetaQueryDoc, { slug })
    .toPromise();

  if (metaResult.error || !metaResult.data?.event) {
    throw new Error(metaResult.error?.message || t`Tournament not found`);
  }

  const event = metaResult.data.event;
  const tournamentName = event.tournament?.name || "";
  const eventName = event.name || "";
  const tournamentDate = event.startAt
    ? new Date(event.startAt * 1000).toISOString()
    : "";
  const tournamentUrl = event.tournament?.url || "";
  const tournamentIconUrl =
    event.tournament?.images?.find((img) => img?.type === "profile")?.url?.replace("http://", "https://") || "";

  // Find the first phase (lowest phaseOrder)
  const phases = (event.phases ?? []).filter(Boolean);
  if (phases.length === 0) {
    throw new Error(t`No phases found for this event`);
  }
  phases.sort((a, b) => (a!.phaseOrder ?? 0) - (b!.phaseOrder ?? 0));
  const firstPhaseId = String(phases[0]!.id);

  // Step 2: Fetch seeds from the first phase (already in seed order)
  const allEntrants: PredictionPlayer[] = [];
  let page = 1;
  const perPage = 64;
  let totalPages = 1;

  while (page <= totalPages && page <= 4) {
    const seedsResult = await client
      .query(PhaseSeedsQueryDoc, {
        phaseId: firstPhaseId,
        perPage,
        page,
      })
      .toPromise();

    if (seedsResult.error || !seedsResult.data?.phase) {
      throw new Error(seedsResult.error?.message || t`Failed to fetch seeds`);
    }

    const seedsData = seedsResult.data.phase.seeds;
    if (page === 1) {
      totalPages = seedsData?.pageInfo?.totalPages || 1;
    }

    const nodes = seedsData?.nodes || [];
    for (const node of nodes) {
      if (!node?.entrant) continue;
      const entrant = node.entrant;
      const participant = entrant.participants?.[0];
      const countryName = participant?.user?.location?.country;
      const countryCode = countryList.getCode(countryName ?? "");

      allEntrants.push({
        id: String(entrant.id),
        name: participant?.gamerTag || entrant.name || "Unknown",
        prefix: participant?.prefix || undefined,
        seed: node.seedNum ?? 9999,
        characterId: EMPTY_CHARACTER_ID,
        country: countryCode || undefined,
      });
    }

    page++;
  }

  // Seeds from phase.seeds should already be in order, but sort to be safe
  allEntrants.sort((a, b) => a.seed - b.seed);

  return { tournamentName, eventName, tournamentDate, tournamentUrl, tournamentIconUrl, entrants: allEntrants };
};

const fetchChallongeEntrants = async (
  slug: string,
): Promise<FetchResult> => {
  const res = await fetch(`/api/challonge?slug=${encodeURIComponent(slug)}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || t`Challonge API error: ${res.status}`);
  }

  const data: ChallongeResponse = await res.json();
  const tournament = data.tournament;

  const entrants: PredictionPlayer[] = (tournament.participants ?? [])
    .map(({ participant: p }) => ({
      id: String(p.id),
      name: p.name,
      seed: p.seed ?? 9999,
      characterId: EMPTY_CHARACTER_ID,
    }))
    .sort((a, b) => a.seed - b.seed);

  return {
    tournamentName: tournament.name,
    eventName: tournament.game_name || "",
    tournamentDate: tournament.started_at
      ? new Date(tournament.started_at).toISOString()
      : "",
    tournamentUrl: tournament.full_challonge_url || "",
    tournamentIconUrl: "",
    entrants,
  };
};

const fetchTonamelEntrants = async (
  slug: string,
): Promise<FetchResult> => {
  const res = await fetch(`/api/tonamel?slug=${encodeURIComponent(slug)}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || t`Tonamel API error: ${res.status}`);
  }

  const data: TonamelResponse = await res.json();
  if (!data.competition) throw new Error(t`Competition not found`);

  const competition = data.competition;

  const entrants: PredictionPlayer[] = competition.participants.map(
    (p, index) => ({
      id: p.playerId || `tonamel-${index}`,
      name: p.gameCode || p.name,
      seed: index + 1,
      characterId: EMPTY_CHARACTER_ID,
      country: p.countryCode || undefined,
    }),
  );

  return {
    tournamentName: competition.name,
    eventName: competition.game?.name || "",
    tournamentDate: competition.competitionStartAt
      ? new Date(competition.competitionStartAt * 1000).toISOString()
      : "",
    tournamentUrl: `https://tonamel.com/competition/${slug}`,
    tournamentIconUrl: "",
    entrants,
  };
};

export const useFetchPredictionEntrants = () => {
  const client = useClient();
  const dispatch = usePredictionStore((state) => state.dispatch);

  const fetchEntrants = async (url: string) => {
    const detected = detectPlatformAndSlug(url);
    if (!detected) return;

    dispatch({ type: "FETCH_START" });

    try {
      let result;

      if (detected.platform === "startgg") {
        result = await fetchStartgg(client, detected.slug);
      } else if (detected.platform === "challonge") {
        result = await fetchChallongeEntrants(detected.slug);
      } else {
        result = await fetchTonamelEntrants(detected.slug);
      }

      dispatch({ type: "FETCH_SUCCESS", payload: result });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : t`Failed to fetch tournament`;
      console.error("Prediction fetch error:", error);
      dispatch({ type: "FETCH_FAIL", payload: message });
    }
  };

  return { fetchEntrants };
};
