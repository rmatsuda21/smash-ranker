import { hiveeEventDate } from "@/utils/hivee/date";
import { useRef } from "react";
import { useClient } from "urql";
import { t } from "@lingui/core/macro";

import { graphql } from "@/gql";
import { usePredictionStore } from "@/store/predictionStore";
import { detectPlatformAndSlug, slugToUrl } from "@/consts/platforms";
import type { PredictionPlayer } from "@/types/predict/Prediction";
import { extractTournamentPalette } from "@/utils/predict/extractTournamentPalette";
import {
  failureKindForStatus,
  failureKindOf,
  LoadError,
  reportLoadFailure,
} from "@/utils/loadError";
import { requestIdOf } from "@/utils/observability/requestId";
import { logEvent } from "@/utils/observability/log";
import { startggLoadError } from "@/utils/startgg/describeError";
import { fetchEventEntrants } from "@/utils/startgg/fetchEventEntrants";
import {
  fetchHiveeEntrants,
  fetchHiveeEvent,
  resolveHiveeSlug,
} from "@/utils/hivee/api";
import { MISSING_SEED_FALLBACK } from "@/consts/seeds";
import { pickFinalProgram, pickFirstProgram } from "@/utils/hivee/programs";

// Event metadata, plus what fetchEventEntrants needs to plan its pages.
const EventMetaQueryDoc = graphql(`
  query PredictionEventMeta($slug: String!) {
    event(slug: $slug) {
      name
      startAt
      numEntrants
      tournament {
        id
        name
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
    // When it is planned to start; `started_at` is null until it does.
    start_at?: string | null;
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
  // start.gg's tournament id, "" on other platforms.
  tournamentId: string;
  entrants: PredictionPlayer[];
};

const fetchStartgg = async (
  client: ReturnType<typeof useClient>,
  slug: string,
): Promise<FetchResult> => {
  const metaResult = await client
    .query(EventMetaQueryDoc, { slug })
    .toPromise();

  if (metaResult.error || !metaResult.data?.event) {
    throw startggLoadError(metaResult.error, t`Tournament not found`);
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

  const entrants = await fetchEventEntrants(client, {
    slug,
    phases: event.phases ?? [],
    numEntrants: event.numEntrants ?? 0,
    rosterSize: event.teamRosterSize?.maxPlayers ?? 1,
  });
  const allEntrants: PredictionPlayer[] = entrants.map((entrant) => ({
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
    entrants: allEntrants,
  };
};

const fetchChallongeEntrants = async (slug: string): Promise<FetchResult> => {
  const res = await fetch(`/api/challonge?slug=${encodeURIComponent(slug)}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new LoadError(
      body.error || t`Challonge API error: ${res.status}`,
      failureKindForStatus(res.status),
      `challonge ${res.status}`,
      requestIdOf(res),
    );
  }

  const data: ChallongeResponse = await res.json();
  const tournament = data.tournament;
  const startDate = tournament.started_at ?? tournament.start_at;

  const entrants: PredictionPlayer[] = (tournament.participants ?? [])
    .map(({ participant: p }) => ({
      id: String(p.id),
      name: p.name,
      seed: p.seed ?? MISSING_SEED_FALLBACK,
    }))
    .sort((a, b) => a.seed - b.seed);

  return {
    tournamentName: tournament.name,
    eventName: tournament.game_name || "",
    tournamentDate: startDate ? new Date(startDate).toISOString() : "",
    tournamentUrl: tournament.full_challonge_url || "",
    tournamentIconUrl: "",
    tournamentId: "",
    entrants,
  };
};

const fetchTonamelEntrants = async (slug: string): Promise<FetchResult> => {
  const res = await fetch(`/api/tonamel?slug=${encodeURIComponent(slug)}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new LoadError(
      body.error || t`Tonamel API error: ${res.status}`,
      failureKindForStatus(res.status),
      `tonamel ${res.status}`,
      requestIdOf(res),
    );
  }

  const data: TonamelResponse = await res.json();
  if (!data.competition) {
    throw new LoadError(t`Competition not found`, "not_found");
  }

  const competition = data.competition;

  const entrants: PredictionPlayer[] = competition.participants.map(
    (p, index) => ({
      id: p.playerId || `tonamel-${index}`,
      name: p.gameCode || p.name,
      seed: index + 1,
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
    tournamentId: "",
    entrants,
  };
};

const fetchHiveePrediction = async (slug: string): Promise<FetchResult> => {
  const { eventId, programId } = await resolveHiveeSlug(slug);
  const [event, allEntrants] = await Promise.all([
    fetchHiveeEvent(eventId),
    fetchHiveeEntrants(eventId),
  ]);

  // The prediction is of the final bracket, which has no entrants of its own
  // until its qualifier ends: the field is whoever starts in the qualifier.
  const finalProgram = pickFinalProgram(event.programs, programId);
  if (!finalProgram) {
    throw new LoadError(t`This event has no bracket to load.`, "unsupported");
  }
  const firstProgram = pickFirstProgram(event.programs, finalProgram);

  const entrants: PredictionPlayer[] = allEntrants
    .flatMap((entrant) => {
      const entry = entrant.programs.find(
        (program) => program.program_id === firstProgram.id,
      );
      if (!entry) return [];
      return [
        {
          id: entrant.id,
          name: entrant.display_name,
          seed: entry.seed ?? MISSING_SEED_FALLBACK,
        },
      ];
    })
    .sort((a, b) => a.seed - b.seed);

  return {
    tournamentName: event.title,
    eventName: finalProgram.title,
    tournamentDate: hiveeEventDate(event),
    tournamentUrl: "",
    tournamentIconUrl: event.community.icon_url ?? "",
    tournamentId: event.id,
    entrants,
  };
};

export const useFetchPredictionEntrants = () => {
  const client = useClient();
  const dispatch = usePredictionStore((state) => state.dispatch);
  // Bumped per load: a slow answer to an earlier link must not overwrite a
  // newer one.
  const requestIdRef = useRef(0);

  const fetchEntrants = async (url: string) => {
    const detected = detectPlatformAndSlug(url);
    if (!detected) return;

    const requestId = ++requestIdRef.current;

    dispatch({ type: "FETCH_START" });
    logEvent("tournament_url_submit", {
      tournament_platform: detected.platform,
      surface: "predict",
    });

    try {
      let result;

      if (detected.platform === "startgg") {
        result = await fetchStartgg(client, detected.slug);
      } else if (detected.platform === "challonge") {
        result = await fetchChallongeEntrants(detected.slug);
      } else if (detected.platform === "tonamel") {
        result = await fetchTonamelEntrants(detected.slug);
      } else {
        result = await fetchHiveePrediction(detected.slug);
      }

      // Overwrite with the canonical platform+slug URL so it always
      // round-trips through detectPlatformAndSlug (start.gg's API returns
      // tournament URL without the event slug).
      result.tournamentUrl = slugToUrl(detected.platform, detected.slug);
      if (requestIdRef.current !== requestId) return;

      dispatch({ type: "FETCH_SUCCESS", payload: result });
      logEvent("prediction_load", {
        tournament_platform: detected.platform,
        entrant_count: result.entrants.length,
      });

      if (result.tournamentIconUrl) {
        extractTournamentPalette(result.tournamentIconUrl).then((palette) => {
          if (requestIdRef.current !== requestId) return;
          dispatch({ type: "SET_COLOR_PALETTE", payload: palette });
        });
      }
    } catch (error) {
      if (requestIdRef.current !== requestId) return;
      const message =
        error instanceof Error ? error.message : t`Failed to fetch tournament`;
      // start.gg and Hivee are called from the browser, so their failures
      // are reported here (user-input ones left out). Challonge and Tonamel
      // go through api/* functions, which capture their own.
      const viaProxy =
        detected.platform === "challonge" || detected.platform === "tonamel";
      const failureKind = viaProxy
        ? failureKindOf(error)
        : reportLoadFailure("prediction entrants fetch failed", error, {
            area: "predict",
            tournament_platform: detected.platform,
          });
      dispatch({ type: "FETCH_FAIL", payload: message });
      logEvent("prediction_fetch_fail", {
        tournament_platform: detected.platform,
        tournament_slug: detected.slug,
        failure_kind: failureKind,
      });
    }
  };

  return { fetchEntrants };
};
