import { t } from "@lingui/core/macro";
import { PlayerInfo } from "@/types/top8/Player";
import { TournamentInfo } from "@/types/top8/Tournament";
import { usePlayerStore } from "@/store/playerStore";
import { useTournamentStore } from "@/store/tournamentStore";
import {
  assignPlacementsToPlayers,
  padPlayersWithBlanks,
} from "@/utils/top8/samplePlayers";
import { EMPTY_CHARACTER_ID } from "@/consts/top8/characters";
import { getGameForName } from "@/utils/games";
import { useToast } from "@/components/Toast";
import { logEvent } from "@/utils/observability/log";
import {
  failureKindForStatus,
  failureKindOf,
  LoadError,
} from "@/utils/loadError";
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
    );
  }

  return res.json();
};

const parseParticipants = (
  participants: ChallongeParticipantWrapper[],
): PlayerInfo[] => {
  const players: PlayerInfo[] = participants
    .map(({ participant: p }) => ({
      id: String(p.id),
      entrantId: String(p.id),
      name: p.name,
      gamerTag: p.name,
      characters: [{ id: EMPTY_CHARACTER_ID, alt: 0 as const }],
      placement: p.final_rank ?? p.seed ?? 0,
      prefix: undefined,
      twitter: undefined,
      country: undefined,
    }))
    .sort((a, b) => a.placement - b.placement);

  return assignPlacementsToPlayers(players);
};

const parseTournamentInfo = (
  tournament: ChallongeResponse["tournament"],
): TournamentInfo => {
  return {
    tournamentName: tournament.name,
    eventName: tournament.game_name || "",
    date: tournament.started_at
      ? new Date(tournament.started_at).toISOString()
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
      playerDispatch({ type: "FETCH_PLAYERS_SUCCESS", payload: paddedPlayers });
      logEvent("tournament_load", {
        tournament_platform: "challonge",
        player_count: playerCount,
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
