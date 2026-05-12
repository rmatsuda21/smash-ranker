import { useRef } from "react";
import { useClient } from "urql";
import * as countryList from "country-list";
import { t } from "@lingui/core/macro";

import { graphql } from "@/gql";
import { useResultsStore } from "@/store/resultsStore";
import { detectPlatformAndSlug, slugToUrl } from "@/consts/platforms";
import type { ResultsEntrantSummary } from "@/types/results/ResultsEntrantSummary";
import { extractTournamentPalette } from "@/utils/predict/extractTournamentPalette";
import { logEvent, logWarning } from "@/utils/observability/log";
import { MISSING_SEED_FALLBACK } from "@/utils/results/parseStartggResults";

// Pagination caps for the seed list. start.gg events typically register
// well under 256 entrants; we cap at 4 pages × 64 = 256 to bound the
// page-load latency and start.gg query-complexity budget. Tournaments
// past this surface a warning so the cap can be revisited.
const SEEDS_PER_PAGE = 64;
const MAX_SEEDS_PAGES = 4;

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
  let totalPages = 1;

  while (page <= totalPages && page <= MAX_SEEDS_PAGES) {
    const seedsResult = await client
      .query(ResultsPhaseSeedsQueryDoc, {
        phaseId: firstPhaseId,
        perPage: SEEDS_PER_PAGE,
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
        seed: node.seedNum ?? MISSING_SEED_FALLBACK,
        country: countryCode || undefined,
      });
    }

    page++;
  }

  if (totalPages > MAX_SEEDS_PAGES) {
    // Quietly truncating large events is the wrong call long-term; warn so
    // we can revisit the cap if it shows up in logs.
    logWarning("results entrant pool truncated", {
      area: "results-fetch",
      slug,
      totalPages,
      cap: MAX_SEEDS_PAGES,
      perPage: SEEDS_PER_PAGE,
      collected: allEntrants.length,
    });
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
  // Same monotonic-token cancellation pattern as useFetchPlayerResults:
  // a slow tournament A doesn't get to clobber the user's newer paste of
  // tournament B.
  const requestIdRef = useRef(0);

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

    const myRequest = ++requestIdRef.current;
    dispatch({ type: "FETCH_POOL_START" });
    logEvent("tournament_url_submit", {
      tournament_platform: detected.platform,
      surface: "results",
    });

    try {
      const result = await fetchStartgg(client, detected.slug);
      if (myRequest !== requestIdRef.current) return;
      result.tournamentUrl = slugToUrl(detected.platform, detected.slug);

      dispatch({ type: "FETCH_POOL_SUCCESS", payload: result });
      logEvent("results_load", {
        tournament_platform: detected.platform,
        entrant_count: result.entrants.length,
      });

      if (result.tournamentIconUrl) {
        // Palette extraction is best-effort — the default palette is a
        // fine fallback. Don't let a transient image error bubble as an
        // unhandled rejection.
        extractTournamentPalette(result.tournamentIconUrl)
          .then((palette) => {
            if (myRequest !== requestIdRef.current) return;
            dispatch({ type: "SET_COLOR_PALETTE", payload: palette });
          })
          .catch((err) => {
            logWarning("results palette extraction failed", {
              area: "results-fetch",
              iconUrl: result.tournamentIconUrl,
              error: err instanceof Error ? err.message : String(err),
            });
          });
      }
    } catch (error) {
      if (myRequest !== requestIdRef.current) return;
      const message =
        error instanceof Error ? error.message : t`Failed to fetch tournament`;
      logWarning("results pool-fetch failed", {
        area: "results-fetch",
        slug: detected.slug,
        error: message,
      });
      dispatch({ type: "FETCH_POOL_FAIL", payload: message });
      logEvent("results_fetch_fail", {
        tournament_platform: detected.platform,
        stage: "pool",
        reason: "query_error",
      });
    }
  };

  return { fetchEntrants };
};
