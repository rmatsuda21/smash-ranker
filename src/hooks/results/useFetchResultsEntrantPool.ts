import { useClient } from "urql";
import * as countryList from "country-list";
import { t } from "@lingui/core/macro";

import { graphql } from "@/gql";
import { useResultsStore } from "@/store/resultsStore";
import { detectPlatformAndSlug, slugToUrl } from "@/consts/platforms";
import type { ResultsEntrantSummary } from "@/types/results/ResultsEntrantSummary";
import { extractTournamentPalette } from "@/utils/predict/extractTournamentPalette";
import { logEvent } from "@/utils/observability/log";

const ResultsEventMetaQueryDoc = graphql(`
  query ResultsEventMeta($slug: String!) {
    event(slug: $slug) {
      name
      startAt
      numEntrants
      videogame {
        id
      }
      tournament {
        name
        countryCode
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

const ResultsPhaseSeedsQueryDoc = graphql(`
  query ResultsPhaseSeeds($phaseId: ID!, $perPage: Int!, $page: Int!) {
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

type FetchResult = {
  tournamentName: string;
  eventName: string;
  tournamentDate: string;
  tournamentUrl: string;
  tournamentIconUrl: string;
  tournamentCountry: string | undefined;
  numEntrants: number;
  videogameId: string | null;
  entrants: ResultsEntrantSummary[];
};

const fetchStartgg = async (
  client: ReturnType<typeof useClient>,
  slug: string,
): Promise<FetchResult> => {
  const metaResult = await client
    .query(ResultsEventMetaQueryDoc, { slug })
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
    event.tournament?.images
      ?.find((img) => img?.type === "profile")
      ?.url?.replace("http://", "https://") || "";
  const numEntrants = event.numEntrants ?? 0;
  const videogameId = event.videogame?.id ? String(event.videogame.id) : null;
  // start.gg returns ISO-3166 alpha-2 country codes (e.g. "US", "JP"). The
  // flag-asset files are lowercased (`us.svg`); normalize here once.
  const tournamentCountry = event.tournament?.countryCode
    ? event.tournament.countryCode.toLowerCase()
    : undefined;

  const phases = (event.phases ?? []).filter(Boolean);
  if (phases.length === 0) {
    throw new Error(t`No phases found for this event`);
  }
  phases.sort((a, b) => (a!.phaseOrder ?? 0) - (b!.phaseOrder ?? 0));
  const firstPhaseId = String(phases[0]!.id);

  const allEntrants: ResultsEntrantSummary[] = [];
  let page = 1;
  const perPage = 64;
  let totalPages = 1;

  while (page <= totalPages && page <= 4) {
    const seedsResult = await client
      .query(ResultsPhaseSeedsQueryDoc, {
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
        country: countryCode || undefined,
      });
    }

    page++;
  }

  allEntrants.sort((a, b) => a.seed - b.seed);

  return {
    tournamentName,
    eventName,
    tournamentDate,
    tournamentUrl,
    tournamentIconUrl,
    tournamentCountry,
    numEntrants,
    videogameId,
    entrants: allEntrants,
  };
};

export const useFetchResultsEntrantPool = () => {
  const client = useClient();
  const dispatch = useResultsStore((state) => state.dispatch);

  const fetchEntrants = async (url: string) => {
    const detected = detectPlatformAndSlug(url);
    if (!detected) return;

    if (detected.platform !== "startgg") {
      dispatch({
        type: "FETCH_POOL_FAIL",
        payload: t`Tournament results are start.gg-only for now. Paste a start.gg event URL to continue.`,
      });
      logEvent("results_fetch_fail", {
        tournament_platform: detected.platform,
        stage: "pool",
        reason: "unsupported_platform",
      });
      return;
    }

    dispatch({ type: "FETCH_POOL_START" });
    logEvent("tournament_url_submit", {
      tournament_platform: detected.platform,
      surface: "results",
    });

    try {
      const result = await fetchStartgg(client, detected.slug);
      result.tournamentUrl = slugToUrl(detected.platform, detected.slug);

      dispatch({ type: "FETCH_POOL_SUCCESS", payload: result });
      logEvent("results_load", {
        tournament_platform: detected.platform,
        entrant_count: result.entrants.length,
      });

      if (result.tournamentIconUrl) {
        extractTournamentPalette(result.tournamentIconUrl).then((palette) => {
          dispatch({ type: "SET_COLOR_PALETTE", payload: palette });
        });
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t`Failed to fetch tournament`;
      dispatch({ type: "FETCH_POOL_FAIL", payload: message });
      logEvent("results_fetch_fail", {
        tournament_platform: detected.platform,
        stage: "pool",
      });
    }
  };

  return { fetchEntrants };
};
