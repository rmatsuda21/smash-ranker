import { t } from "@lingui/core/macro";
import { LineupSource, PlayerInfo } from "@/types/top8/Player";
import { TournamentInfo } from "@/types/top8/Tournament";
import { usePlayerStore } from "@/store/playerStore";
import { useTournamentStore } from "@/store/tournamentStore";
import {
  assignPlacementsToPlayers,
  padPlayersWithBlanks,
} from "@/utils/top8/samplePlayers";
import { getLineupNotice } from "@/utils/top8/lineupNotice";
import { noCharacters } from "@/utils/top8/playerCharacters";
import { getGameForName } from "@/utils/games";
import { useToast } from "@/components/Toast";
import { logEvent } from "@/utils/observability/log";
import {
  failureKindForStatus,
  failureKindOf,
  LoadError,
} from "@/utils/loadError";
import { requestIdOf } from "@/utils/observability/requestId";
import {
  beginTournamentLoad,
  isCurrentTournamentLoad,
} from "@/utils/top8/loadGuard";

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
    id: number;
    name: string;
    game_name: string | null;
    started_at: string | null;
    // When it is planned to start; `started_at` is null until it does.
    start_at?: string | null;
    // "complete" once the results are in.
    state?: string;
    participants_count: number;
    full_challonge_url: string | null;
    participants: ChallongeParticipantWrapper[];
  };
}

const fetchChallongeTournament = async (
  slug: string,
): Promise<ChallongeResponse> => {
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

  return res.json();
};

const getLineup = ({
  state,
  participants,
}: ChallongeResponse["tournament"]): LineupSource => {
  if (!participants?.length) return "none";
  const ranked = participants.filter((p) => p.participant.final_rank !== null);
  if (ranked.length === 0) return "seeds";
  return state === undefined || state === "complete" ? "final" : "live";
};

// Placed players first, then the rest by seed.
const byRankThenSeed = (
  { participant: a }: ChallongeParticipantWrapper,
  { participant: b }: ChallongeParticipantWrapper,
) =>
  (a.final_rank ?? Infinity) === (b.final_rank ?? Infinity)
    ? (a.seed ?? Infinity) - (b.seed ?? Infinity) || 0
    : (a.final_rank ?? Infinity) - (b.final_rank ?? Infinity);

const parseParticipants = (
  participants: ChallongeParticipantWrapper[],
): PlayerInfo[] => {
  const players: PlayerInfo[] = [...participants]
    .sort(byRankThenSeed)
    .map(({ participant: p }) => ({
      id: String(p.id),
      entrantId: String(p.id),
      name: p.name,
      gamerTag: p.name,
      characters: noCharacters(),
      placement: 0,
      prefix: undefined,
      twitter: undefined,
      country: undefined,
    }));

  return assignPlacementsToPlayers(players);
};

const parseTournamentInfo = (
  tournament: ChallongeResponse["tournament"],
): TournamentInfo => {
  const startDate = tournament.started_at ?? tournament.start_at;
  return {
    tournamentName: tournament.name,
    eventName: tournament.game_name || "",
    date: startDate
      ? new Date(startDate).toISOString()
      : new Date().toISOString(),
    location: {},
    entrants: tournament.participants_count,
    url: tournament.full_challonge_url || "",
    iconSrc: undefined,
  };
};

export const useFetchChallonge = () => {
  const playerDispatch = usePlayerStore((state) => state.dispatch);
  const tournamentDispatch = useTournamentStore((state) => state.dispatch);
  const { showToast } = useToast();

  const fetchChallonge = async (slug: string, playerCount: number = 8) => {
    const loadId = beginTournamentLoad();
    playerDispatch({ type: "FETCH_PLAYERS" });

    try {
      const data = await fetchChallongeTournament(slug);
      if (!isCurrentTournamentLoad(loadId)) return;

      const tournamentInfo = parseTournamentInfo(data.tournament);
      tournamentDispatch({
        type: "SET_TOURNAMENT_INFO",
        payload: tournamentInfo,
      });
      const game = getGameForName(data.tournament.game_name);
      if (game) tournamentDispatch({ type: "SET_GAME", payload: game.id });

      const players = parseParticipants(data.tournament.participants ?? []);
      const paddedPlayers = padPlayersWithBlanks(players, playerCount);
      const lineup = getLineup(data.tournament);
      playerDispatch({
        type: "FETCH_PLAYERS_SUCCESS",
        payload: paddedPlayers,
      });
      const notice = getLineupNotice(lineup);
      if (notice) showToast(notice, { variant: "info" });
      logEvent("tournament_load", {
        tournament_platform: "challonge",
        player_count: playerCount,
        lineup_source: lineup,
      });
    } catch (error) {
      if (!isCurrentTournamentLoad(loadId)) return;
      const message =
        error instanceof Error
          ? error.message
          : t`Failed to fetch Challonge tournament`;
      // Don't Sentry-capture: most failures here are user-input errors (404
      // on bad slug). The api/challonge.ts wrapper captures real upstream
      // bugs. Surface as a product event for rate tracking instead.
      playerDispatch({ type: "FETCH_PLAYERS_FAIL", payload: message });
      showToast(message, { variant: "error" });
      logEvent("tournament_fetch_fail", {
        tournament_platform: "challonge",
        tournament_slug: slug,
        failure_kind: failureKindOf(error),
      });
    }
  };

  return { fetchChallonge };
};
