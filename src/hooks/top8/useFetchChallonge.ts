import { t } from "@lingui/core/macro";
import { PlayerInfo } from "@/types/top8/Player";
import { TournamentInfo } from "@/types/top8/Tournament";
import { usePlayerStore } from "@/store/playerStore";
import { useTournamentStore } from "@/store/tournamentStore";
import {
  assignPlacementsToPlayers,
  createBlankPlayer,
  getPlacements,
} from "@/utils/top8/samplePlayers";
import { EMPTY_CHARACTER_ID } from "@/consts/top8/characters";

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

const fetchChallongeTournament = async (slug: string): Promise<ChallongeResponse> => {
  const res = await fetch(
    `/api/challonge?slug=${encodeURIComponent(slug)}`,
  );

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || t`Challonge API error: ${res.status}`);
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

const padPlayersWithBlanks = (
  players: PlayerInfo[],
  targetCount: number,
): PlayerInfo[] => {
  if (players.length >= targetCount) return players;

  const placements = getPlacements(targetCount);
  const padded = [...players];

  for (let i = players.length; i < targetCount; i++) {
    padded.push(createBlankPlayer(placements[i]));
  }

  return padded;
};

export const useFetchChallonge = () => {
  const playerDispatch = usePlayerStore((state) => state.dispatch);
  const tournamentDispatch = useTournamentStore((state) => state.dispatch);

  const fetchChallonge = async (slug: string, playerCount: number = 8) => {
    playerDispatch({ type: "FETCH_PLAYERS" });

    try {
      const data = await fetchChallongeTournament(slug);

      const tournamentInfo = parseTournamentInfo(data.tournament);
      tournamentDispatch({
        type: "SET_TOURNAMENT_INFO",
        payload: tournamentInfo,
      });

      const players = parseParticipants(data.tournament.participants ?? []);
      const paddedPlayers = padPlayersWithBlanks(players, playerCount);
      playerDispatch({ type: "FETCH_PLAYERS_SUCCESS", payload: paddedPlayers });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t`Failed to fetch Challonge tournament`;
      console.error("Challonge fetch error:", error);
      playerDispatch({ type: "FETCH_PLAYERS_FAIL", payload: message });
      alert(message);
    }
  };

  return { fetchChallonge };
};
