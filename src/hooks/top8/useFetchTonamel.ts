import { t } from "@lingui/core/macro";
import { PlayerInfo } from "@/types/top8/Player";
import { TournamentInfo } from "@/types/top8/Tournament";
import { usePlayerStore } from "@/store/playerStore";
import { useTournamentStore } from "@/store/tournamentStore";
import {
  assignPlacementsToPlayers,
  padPlayersWithBlanks,
} from "@/utils/top8/samplePlayers";
import { getMultiGroupError } from "@/consts/errors";
import { noCharacters } from "@/utils/top8/playerCharacters";
import { getGameForName } from "@/utils/games";
import { useToast } from "@/components/Toast";
import { logEvent, logWarning } from "@/utils/observability/log";
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
import {
  saveTournamentImage,
  tournamentImageName,
} from "@/utils/top8/tournamentImages";

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

const fetchTonamelCompetition = async (
  slug: string,
  playerCount: number,
): Promise<TonamelResponse> => {
  const res = await fetch(
    `/api/tonamel?slug=${encodeURIComponent(slug)}&playerCount=${playerCount}`,
  );

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new LoadError(
      body.error || t`Tonamel API error: ${res.status}`,
      failureKindForStatus(res.status),
      `tonamel ${res.status}`,
      requestIdOf(res),
    );
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
  characters: noCharacters(),
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
        toPlayerInfo(
          placement.displayName,
          placement.playerId,
          country,
          placement.place,
          index++,
        ),
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
const storeTonamelImage = async (
  imageUrl: string,
  competitionName: string,
): Promise<string | undefined> => {
  try {
    return await saveTournamentImage({
      platform: "tonamel",
      key: imageUrl,
      name: tournamentImageName(competitionName, "profile"),
      load: async () => {
        const proxyUrl = `/api/tonamel-image?url=${encodeURIComponent(imageUrl)}`;
        const response = await fetch(proxyUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.status}`);
        }
        return response.blob();
      },
    });
  } catch (error) {
    logWarning("tonamel image fetch failed", {
      area: "tonamel-image-store",
      tournament_platform: "tonamel",
      image_url: imageUrl,
      error: error instanceof Error ? error.message : String(error),
    });
    return undefined;
  }
};

const parseTournamentInfo = async (
  competition: TonamelCompetition,
  slug: string,
): Promise<TournamentInfo> => {
  const iconSrc = competition.imageUrl
    ? await storeTonamelImage(competition.imageUrl, competition.name)
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

export const useFetchTonamel = () => {
  const playerDispatch = usePlayerStore((state) => state.dispatch);
  const tournamentDispatch = useTournamentStore((state) => state.dispatch);
  const { showToast } = useToast();

  const fetchTonamel = async (slug: string, playerCount: number = 8) => {
    const loadId = beginTournamentLoad();
    playerDispatch({ type: "FETCH_PLAYERS" });

    try {
      const data = await fetchTonamelCompetition(slug, playerCount);
      if (!isCurrentTournamentLoad(loadId)) return;

      if (!data.competition) {
        throw new LoadError(t`Competition not found`, "not_found");
      }

      const blockCount = data.competition.blockCount ?? 0;
      if (blockCount > 1) {
        const errorMessage = getMultiGroupError();
        playerDispatch({ type: "FETCH_PLAYERS_FAIL", payload: errorMessage });
        showToast(errorMessage, { variant: "error" });
        logEvent("tournament_fetch_fail", {
          tournament_platform: "tonamel",
          failure_kind: "multi_group",
          tournament_slug: slug,
        });
        return;
      }

      const tournamentInfo = await parseTournamentInfo(data.competition, slug);
      if (!isCurrentTournamentLoad(loadId)) return;
      tournamentDispatch({
        type: "SET_TOURNAMENT_INFO",
        payload: tournamentInfo,
      });
      const game = getGameForName(data.competition.game?.name);
      if (game) tournamentDispatch({ type: "SET_GAME", payload: game.id });

      const players = parseParticipants(data.competition);
      const paddedPlayers = padPlayersWithBlanks(players, playerCount);
      playerDispatch({ type: "FETCH_PLAYERS_SUCCESS", payload: paddedPlayers });
      logEvent("tournament_load", {
        tournament_platform: "tonamel",
        player_count: playerCount,
      });
    } catch (error) {
      if (!isCurrentTournamentLoad(loadId)) return;
      const message =
        error instanceof Error
          ? error.message
          : t`Failed to fetch Tonamel tournament`;
      // Don't Sentry-capture: most failures here are user-input errors (bad
      // competition id). Real upstream Tonamel bugs land in api/tonamel.ts's
      // Sentry capture instead.
      playerDispatch({ type: "FETCH_PLAYERS_FAIL", payload: message });
      showToast(message, { variant: "error" });
      logEvent("tournament_fetch_fail", {
        tournament_platform: "tonamel",
        tournament_slug: slug,
        failure_kind: failureKindOf(error),
      });
    }
  };

  return { fetchTonamel };
};
