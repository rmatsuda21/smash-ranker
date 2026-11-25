import { hiveeEventDate } from "@/utils/hivee/date";
import { t } from "@lingui/core/macro";

import { useToast } from "@/components/Toast";
import { slugToUrl } from "@/consts/platforms";
import { assetRepository } from "@/db/repository";
import { usePlayerStore } from "@/store/playerStore";
import { useTournamentStore } from "@/store/tournamentStore";
import type {
  HiveeEvent,
  HiveeProgram,
  HiveeStandings,
} from "@/types/hivee/Hivee";
import type { CharacerData, PlayerInfo } from "@/types/top8/Player";
import type { TournamentInfo } from "@/types/top8/Tournament";
import { getGameForHiveeContent } from "@/utils/games";
import {
  fetchHiveeCompletedMatches,
  fetchHiveeEvent,
  fetchHiveeStandings,
  resolveHiveeSlug,
} from "@/utils/hivee/api";
import {
  countHiveeCharacters,
  orderStandings,
  pickFinalProgram,
} from "@/utils/hivee/programs";
import { logEvent, logWarning } from "@/utils/observability/log";
import {
  getPlacements,
  padPlayersWithBlanks,
} from "@/utils/top8/samplePlayers";
import { EMPTY_CHARACTER_ID } from "@/consts/top8/characters";

const IDB_IMAGES_BASE_URL = "/idb-images/";

// Hivee's images allow any origin, so the icon is fetched as it is and kept
// in IndexedDB like the other platforms' icons.
const storeIcon = async (imageUrl: string): Promise<string | undefined> => {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) return undefined;

    const data = await response.blob();
    const id = crypto.randomUUID();
    const src = `${IDB_IMAGES_BASE_URL}${id}`;
    await assetRepository.put({
      id,
      src,
      fileName: `hivee-icon-${id}`,
      data,
      date: new Date(),
    });
    return src;
  } catch (error) {
    logWarning("hivee image fetch failed", {
      area: "hivee-image-store",
      tournament_platform: "hivee",
      image_url: imageUrl,
      error: error instanceof Error ? error.message : String(error),
    });
    return undefined;
  }
};

const toPlayers = (
  standings: HiveeStandings,
  characters: Map<string, CharacerData[]>,
  playerCount: number,
): PlayerInfo[] => {
  const rows = orderStandings(standings.rows).slice(0, playerCount);
  const slotPlacements = getPlacements(rows.length);

  return rows.map((row, index) => {
    const name = row.display_name ?? "";
    return {
      id: row.participant_id,
      entrantId: row.participant_id,
      name,
      gamerTag: name,
      characters: characters.get(row.participant_id) ?? [
        { id: EMPTY_CHARACTER_ID, alt: 0 as const },
      ],
      // Someone still in the bracket has no placement yet.
      placement: row.placement ?? slotPlacements[index],
      prefix: undefined,
      twitter: undefined,
      country: undefined,
    };
  });
};

const toTournamentInfo = (
  event: HiveeEvent,
  program: HiveeProgram,
  standings: HiveeStandings,
  slug: string,
  iconSrc: string | undefined,
): TournamentInfo => ({
  tournamentName: event.title,
  eventName: program.title,
  date: hiveeEventDate(event) || new Date().toISOString(),
  location: {
    state: event.prefecture_name ?? "",
    country: event.country?.toUpperCase() ?? "",
  },
  entrants: standings.rows.length,
  url: slugToUrl("hivee", slug),
  iconSrc,
  startggId: event.id,
});

export const useFetchHivee = () => {
  const playerDispatch = usePlayerStore((state) => state.dispatch);
  const tournamentDispatch = useTournamentStore((state) => state.dispatch);
  const { showToast } = useToast();

  const fetchHivee = async (slug: string, playerCount: number = 8) => {
    playerDispatch({ type: "FETCH_PLAYERS" });

    try {
      const { eventId, programId } = await resolveHiveeSlug(slug);
      const event = await fetchHiveeEvent(eventId);

      // A link to a qualifier loads the bracket its top finishers went on
      // to, whose standings are the event's final placements.
      const program = pickFinalProgram(event.programs, programId, {
        startedOnly: true,
      });
      if (!program) throw new Error(t`This event has no bracket to load.`);

      const iconUrl = event.community.icon_url ?? event.cover_image_url;
      const [standings, matches, iconSrc] = await Promise.all([
        fetchHiveeStandings(program.id),
        // Characters are a bonus: the graphic loads without them.
        fetchHiveeCompletedMatches(eventId).catch(() => []),
        iconUrl ? storeIcon(iconUrl) : undefined,
      ]);

      if (standings.rows.length === 0) {
        throw new Error(t`This event has no standings yet.`);
      }

      // The placements cover every phase listed, so the characters do too.
      const phaseIds = new Set(
        standings.phases.map((phase) => phase.program_id),
      );
      phaseIds.add(program.id);
      const characters = countHiveeCharacters(
        matches.filter(
          (match) => match.program_id && phaseIds.has(match.program_id),
        ),
      );

      tournamentDispatch({
        type: "SET_TOURNAMENT_INFO",
        payload: toTournamentInfo(event, program, standings, slug, iconSrc),
      });
      const game = getGameForHiveeContent(program.content);
      if (game) tournamentDispatch({ type: "SET_GAME", payload: game.id });

      const players = toPlayers(standings, characters, playerCount);
      playerDispatch({
        type: "FETCH_PLAYERS_SUCCESS",
        payload: padPlayersWithBlanks(players, playerCount),
      });
      logEvent("tournament_load", {
        tournament_platform: "hivee",
        player_count: playerCount,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : t`Failed to fetch Hivee tournament`;
      // Don't Sentry-capture: most failures here are user-input errors (a
      // private event, a mistyped link).
      playerDispatch({ type: "FETCH_PLAYERS_FAIL", payload: message });
      showToast(message, { variant: "error" });
      logEvent("tournament_fetch_fail", {
        tournament_platform: "hivee",
        tournament_slug: slug,
      });
    }
  };

  return { fetchHivee };
};
