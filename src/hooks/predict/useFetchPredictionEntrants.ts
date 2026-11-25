import { useClient } from "urql";
import { t } from "@lingui/core/macro";

import { graphql } from "@/gql";
import { usePredictionStore } from "@/store/predictionStore";
import { detectPlatformAndSlug, slugToUrl } from "@/consts/platforms";
import type { PredictionPlayer } from "@/types/predict/Prediction";
import { extractTournamentPalette } from "@/utils/predict/extractTournamentPalette";
import { logEvent } from "@/utils/observability/log";
import { fetchEventEntrants } from "@/utils/startgg/fetchEventEntrants";
import {
  fetchHiveeEntrants,
  fetchHiveeEvent,
  resolveHiveeSlug,
} from "@/utils/hivee/api";
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

  const entrants = await fetchEventEntrants(client, {
    slug,
    phases: event.phases ?? [],
    numEntrants: event.numEntrants ?? 0,
    rosterSize: event.teamRosterSize?.maxPlayers ?? 1,
  });
  const allEntrants: PredictionPlayer[] = entrants.map((entrant) => ({
    ...entrant,
    seed: entrant.seed ?? 9999,
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
    throw new Error(body.error || t`Challonge API error: ${res.status}`);
  }

  const data: ChallongeResponse = await res.json();
  const tournament = data.tournament;

  const entrants: PredictionPlayer[] = (tournament.participants ?? [])
    .map(({ participant: p }) => ({
      id: String(p.id),
      name: p.name,
      seed: p.seed ?? 9999,
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
    tournamentId: "",
    entrants,
  };
};

const fetchTonamelEntrants = async (slug: string): Promise<FetchResult> => {
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
  if (!finalProgram) throw new Error(t`This event has no bracket to load.`);
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
          seed: entry.seed ?? 9999,
        },
      ];
    })
    .sort((a, b) => a.seed - b.seed);

  return {
    tournamentName: event.title,
    eventName: finalProgram.title,
    tournamentDate: event.starts_at
      ? new Date(event.starts_at).toISOString()
      : "",
    tournamentUrl: "",
    tournamentIconUrl: event.community.icon_url ?? "",
    tournamentId: event.id,
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

      dispatch({ type: "FETCH_SUCCESS", payload: result });
      logEvent("prediction_load", {
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
      // Don't Sentry-capture: most failures here are user-input errors. Real
      // upstream issues land in the api/* function-side Sentry captures.
      dispatch({ type: "FETCH_FAIL", payload: message });
      logEvent("prediction_fetch_fail", {
        tournament_platform: detected.platform,
        tournament_slug: detected.slug,
      });
    }
  };

  return { fetchEntrants };
};
