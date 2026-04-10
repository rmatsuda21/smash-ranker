import { t } from "@lingui/core/macro";
import { PlayerInfo } from "@/types/top8/Player";
import { TournamentInfo } from "@/types/top8/Tournament";
import { usePlayerStore } from "@/store/playerStore";
import { useTournamentStore } from "@/store/tournamentStore";
import { assetRepository } from "@/db/repository";
import {
  assignPlacementsToPlayers,
  createBlankPlayer,
  getPlacements,
} from "@/utils/top8/samplePlayers";
import { getMultiGroupError } from "@/consts/errors";
import { EMPTY_CHARACTER_ID } from "@/consts/top8/characters";
const IDB_IMAGES_BASE_URL = "/idb-images/";

interface TonamelPlacement {
  place: number;
  displayName: string;
  playerId: string;
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
  imageUrl: string;
  game: { name: string } | null;
  tournamentStyles?: string[];
  blockCount?: number;
  placements: TonamelPlacement[];
  participants: TonamelParticipant[];
}

interface TonamelResponse {
  competition: TonamelCompetition | null;
}

const fetchTonamelCompetition = async (slug: string): Promise<TonamelResponse> => {
  const res = await fetch(`/api/tonamel?slug=${encodeURIComponent(slug)}`);

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || t`Tonamel API error: ${res.status}`);
  }

  return res.json();
};

const toPlayerInfo = (
  displayName: string,
  playerId: string,
  country: string | undefined,
  placement: number,
  index: number,
): PlayerInfo => ({
  id: playerId || `tonamel-${index}`,
  entrantId: playerId || `tonamel-${index}`,
  name: displayName,
  gamerTag: displayName,
  characters: [{ id: EMPTY_CHARACTER_ID, alt: 0 as const }],
  placement,
  prefix: undefined,
  twitter: undefined,
  country,
});

const parseParticipants = (competition: TonamelCompetition): PlayerInfo[] => {
  const players: PlayerInfo[] = [];
  let index = 0;

  // Build countryCode lookup from participants
  const countryByPlayerId = new Map<string, string>();
  for (const p of competition.participants) {
    if (p.countryCode) countryByPlayerId.set(p.playerId, p.countryCode);
  }

  if (competition.placements.length > 0) {
    // Use placements from podium (already sorted by place)
    for (const placement of competition.placements) {
      if (players.length >= 8) break;
      const country = countryByPlayerId.get(placement.playerId);
      players.push(
        toPlayerInfo(placement.displayName, placement.playerId, country, placement.place, index++),
      );
    }
  } else {
    // Fall back to participants list (e.g., tournament still in progress)
    for (const p of competition.participants) {
      if (players.length >= 8) break;
      const displayName = p.gameCode || p.name;
      players.push(
        toPlayerInfo(displayName, p.playerId, p.countryCode, 0, index++),
      );
    }
  }

  return assignPlacementsToPlayers(players);
};

/** Fetch a Tonamel image via our proxy and store in IndexedDB to avoid CORS issues. */
const storeTonamelImage = async (imageUrl: string): Promise<string | undefined> => {
  try {
    const proxyUrl = `/api/tonamel-image?url=${encodeURIComponent(imageUrl)}`;
    const response = await fetch(proxyUrl);
    if (!response.ok) return undefined;

    const data = await response.blob();
    const id = crypto.randomUUID();
    const src = `${IDB_IMAGES_BASE_URL}${id}`;

    await assetRepository.put({
      id,
      src,
      fileName: `tonamel-icon-${id}`,
      data,
      date: new Date(),
    });

    return src;
  } catch {
    return undefined;
  }
};

const parseTournamentInfo = async (
  competition: TonamelCompetition,
  slug: string,
): Promise<TournamentInfo> => {
  const iconSrc = competition.imageUrl
    ? await storeTonamelImage(competition.imageUrl)
    : undefined;

  return {
    tournamentName: competition.name,
    eventName: competition.game?.name || "",
    date: competition.competitionStartAt
      ? new Date(competition.competitionStartAt * 1000).toISOString()
      : new Date().toISOString(),
    location: {},
    entrants: competition.currentEntry,
    url: `https://tonamel.com/competition/${slug}`,
    iconSrc,
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

export const useFetchTonamel = () => {
  const playerDispatch = usePlayerStore((state) => state.dispatch);
  const tournamentDispatch = useTournamentStore((state) => state.dispatch);

  const fetchTonamel = async (slug: string, playerCount: number = 8) => {
    playerDispatch({ type: "FETCH_PLAYERS" });

    try {
      const data = await fetchTonamelCompetition(slug);

      if (!data.competition) {
        throw new Error(t`Competition not found`);
      }

      const blockCount = data.competition.blockCount ?? 0;
      if (blockCount > 1) {
        const errorMessage = getMultiGroupError();
        playerDispatch({ type: "FETCH_PLAYERS_FAIL", payload: errorMessage });
        alert(errorMessage);
        return;
      }

      const tournamentInfo = await parseTournamentInfo(data.competition, slug);
      tournamentDispatch({
        type: "SET_TOURNAMENT_INFO",
        payload: tournamentInfo,
      });

      const players = parseParticipants(data.competition);
      const paddedPlayers = padPlayersWithBlanks(players, playerCount);
      playerDispatch({ type: "FETCH_PLAYERS_SUCCESS", payload: paddedPlayers });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t`Failed to fetch Tonamel tournament`;
      console.error("Tonamel fetch error:", error);
      playerDispatch({ type: "FETCH_PLAYERS_FAIL", payload: message });
      alert(message);
    }
  };

  return { fetchTonamel };
};
