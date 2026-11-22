import { useRef } from "react";
import { useClient } from "urql";
import { t } from "@lingui/core/macro";

import { graphql } from "@/gql";
import { useResultsStore } from "@/store/resultsStore";
import { detectPlatformAndSlug, slugToUrl } from "@/consts/platforms";
import type { ResultsEntrantSummary } from "@/types/results/ResultsEntrantSummary";
import { extractTournamentPalette } from "@/utils/predict/extractTournamentPalette";
import { logEvent, logWarning } from "@/utils/observability/log";
import { MISSING_SEED_FALLBACK } from "@/utils/results/parseStartggResults";
import { fetchEventEntrants } from "@/utils/startgg/fetchEventEntrants";

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
      teamRosterSize {
        maxPlayers
      }
      phases {
        id
        phaseOrder
        numSeeds
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

  const entrants = await fetchEventEntrants(client, {
    slug,
    phases: event.phases ?? [],
    numEntrants,
    rosterSize: event.teamRosterSize?.maxPlayers ?? 1,
  });
  const allEntrants: ResultsEntrantSummary[] = entrants.map((entrant) => ({
    ...entrant,
    seed: entrant.seed ?? MISSING_SEED_FALLBACK,
  }));

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
        tournament_slug: detected.slug,
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
              tournament_platform: detected.platform,
              tournament_slug: detected.slug,
              tournament_url: result.tournamentUrl,
              icon_url: result.tournamentIconUrl,
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
        tournament_platform: detected.platform,
        tournament_slug: detected.slug,
        error: message,
      });
      dispatch({ type: "FETCH_POOL_FAIL", payload: message });
      logEvent("results_fetch_fail", {
        tournament_platform: detected.platform,
        stage: "pool",
        reason: "query_error",
        tournament_slug: detected.slug,
      });
    }
  };

  return { fetchEntrants };
};
