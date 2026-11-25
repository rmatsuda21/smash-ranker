import { hiveeEventDate } from "@/utils/hivee/date";
import { t } from "@lingui/core/macro";

import { HIVEE_CHARACTER_IDS } from "@/consts/hivee/characters";
import type { HiveeMatchSlot } from "@/types/hivee/Hivee";
import type { ThumbnailSet } from "@/types/thumbnail/Thumbnail";
import { getGameForHiveeContent } from "@/utils/games";
import {
  fetchHiveeCompletedMatches,
  fetchHiveeEvent,
  fetchHiveeStandings,
  resolveHiveeSlug,
} from "@/utils/hivee/api";
import {
  hiveeMatchTime,
  hiveeRoundText,
  makeTop8Test,
  pickFinalProgram,
} from "@/utils/hivee/programs";
import type { ThumbnailEventMeta } from "@/utils/thumbnail/fetchEventSets";
import { makeSide } from "@/utils/thumbnail/match";
import { isKnownCharacter } from "@/utils/top8/characterCatalog";

// The character a player used most in the match, in the costume entered
// with it. Empty when none was entered.
const mostPlayed = (
  slot: HiveeMatchSlot,
): { characterId: string; alt: number } => {
  const counts = new Map<string, { count: number; alt: number }>();
  for (const { code, color } of slot.characters) {
    const id = HIVEE_CHARACTER_IDS[code];
    if (!id || !isKnownCharacter(id)) continue;
    const entry = counts.get(id) ?? { count: 0, alt: 0 };
    entry.count += 1;
    if (color !== null && color >= 0 && color <= 7) entry.alt = color;
    counts.set(id, entry);
  }
  const [top] = [...counts].sort((a, b) => b[1].count - a[1].count);
  return top
    ? { characterId: top[0], alt: top[1].alt }
    : { characterId: "", alt: 0 };
};

// A Hivee event's finished matches as thumbnail sets, newest first. Hivee
// returns them all at once, so there is nothing more to load afterwards.
export const fetchHiveeThumbnailEvent = async (
  slug: string,
): Promise<{ meta: ThumbnailEventMeta; sets: ThumbnailSet[] }> => {
  const { eventId, programId } = await resolveHiveeSlug(slug);
  const event = await fetchHiveeEvent(eventId);
  const program = pickFinalProgram(event.programs, programId, {
    startedOnly: true,
  });
  if (!program) throw new Error(t`This event has no bracket to load.`);

  const [matches, standings] = await Promise.all([
    fetchHiveeCompletedMatches(eventId),
    // Only the top 8 marks need the placements.
    fetchHiveeStandings(program.id).catch(() => null),
  ]);

  // The bracket and the qualifiers that fed it; a side bracket's matches
  // are left to a link to the side bracket.
  const covered = new Set(
    standings?.phases.map((phase) => phase.program_id) ?? [],
  );
  covered.add(program.id);
  const programs = new Map(event.programs.map((entry) => [entry.id, entry]));
  const isTop8 = makeTop8Test(program, matches, standings?.rows ?? []);

  const sets = matches
    .filter(
      (match) =>
        match.program_id !== null &&
        covered.has(match.program_id) &&
        match.slots.length === 2 &&
        match.slots.every((slot) => slot.participant_id && slot.display_name),
    )
    .sort((a, b) => hiveeMatchTime(b) - hiveeMatchTime(a))
    .map((match): ThumbnailSet => {
      const [first, second] = match.slots.map((slot) =>
        makeSide({ name: slot.display_name ?? "", ...mostPlayed(slot) }),
      );
      const onStream = !!match.stream_url;
      const top8 = isTop8(match);
      return {
        id: match.id,
        sides: [first, second],
        round: hiveeRoundText(match, programs.get(match.program_id ?? "")),
        onStream,
        top8,
        included: onStream || top8,
      };
    });

  return {
    meta: {
      tournamentId: event.id,
      tournamentName: event.title,
      eventName: program.title,
      date: hiveeEventDate(event),
      iconUrl: event.community.icon_url ?? event.cover_image_url ?? "",
      game: getGameForHiveeContent(program.content)?.id ?? null,
    },
    sets,
  };
};
