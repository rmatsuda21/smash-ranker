import { hiveeEventDate } from "@/utils/hivee/date";
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
import { loadHiveeEventData } from "@/utils/hivee/eventData";
import { buildHiveeEntrantPool } from "@/utils/hivee/results";

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
        id
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
  tournamentId: string;
  tournamentCountry: string | undefined;
  numEntrants: number;
  videogameId: string | null;
  entrants: ResultsEntrantSummary[];
};

const fetchStartgg = async (
  client: ReturnType<typeof useClient>,
  slug: string,
  // Called once the event itself is known, before its entrants are fetched.
  onEvent: (event: { videogameId: string | null }) => void,
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
  const tournamentId = event.tournament?.id ? String(event.tournament.id) : "";
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

  onEvent({ videogameId });

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
    tournamentId,
    tournamentCountry,
    numEntrants,
    videogameId,
    entrants: allEntrants,
  };
};

// A Hivee event: everyone in the standings of the bracket the link leads to.
// There is no start.gg game id, which also keeps start.gg's character
// lookups off: Hivee's fallbacks come from the event's own matches.
const fetchHivee = async (slug: string): Promise<FetchResult> => {
  const data = await loadHiveeEventData(slug, { fresh: true });
  const entrants = buildHiveeEntrantPool(data);
  if (entrants.length === 0) {
    throw new Error(t`This event has no standings yet.`);
  }
  const { event, program } = data;
  return {
    tournamentName: event.title,
    eventName: program.title,
    tournamentDate: hiveeEventDate(event),
    tournamentUrl: "",
    tournamentIconUrl: event.community.icon_url ?? event.cover_image_url ?? "",
    tournamentId: event.id,
    tournamentCountry: event.country?.toLowerCase() || undefined,
    numEntrants: entrants.length,
    videogameId: null,
    entrants,
  };
};

export const useFetchResultsEntrantPool = () => {
  const client = useClient();
  const dispatch = useResultsStore((state) => state.dispatch);
  // Same monotonic-token cancellation pattern as useFetchPlayerResults:
  // a slow tournament A doesn't get to clobber the user's newer paste of
  // tournament B.
  const requestIdRef = useRef(0);

  // `selectEntrantId` is a player to open once the event is known (a recap
  // link). Their results are fetched while the entrant list is still loading.
  const fetchEntrants = async (
    url: string,
    { selectEntrantId }: { selectEntrantId?: string } = {},
  ) => {
    const detected = detectPlatformAndSlug(url);
    if (!detected) return;

    if (detected.platform !== "startgg" && detected.platform !== "hivee") {
      dispatch({
        type: "FETCH_POOL_FAIL",
        payload: t`Tournament results work with start.gg and Hivee for now. Paste a start.gg or Hivee event URL to continue.`,
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
      const tournamentUrl = slugToUrl(detected.platform, detected.slug);
      const result =
        detected.platform === "hivee"
          ? await fetchHivee(detected.slug)
          : await fetchStartgg(client, detected.slug, ({ videogameId }) => {
              if (!selectEntrantId || myRequest !== requestIdRef.current)
                return;
              dispatch({
                type: "PRESELECT_ENTRANT",
                payload: {
                  entrantId: selectEntrantId,
                  videogameId,
                  tournamentUrl,
                },
              });
            });
      if (myRequest !== requestIdRef.current) return;
      result.tournamentUrl = tournamentUrl;

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
