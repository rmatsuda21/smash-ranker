import { t } from "@lingui/core/macro";

import type {
  HiveeEntrant,
  HiveeEvent,
  HiveeMatch,
  HiveeProgram,
  HiveeStandings,
} from "@/types/hivee/Hivee";
import {
  fetchHiveeCompletedMatches,
  fetchHiveeEntrants,
  fetchHiveeEvent,
  fetchHiveeStandings,
  resolveHiveeSlug,
} from "@/utils/hivee/api";
import { pickFinalProgram } from "@/utils/hivee/programs";

// Everything the player recap reads from a Hivee event. Hivee has no
// per-player endpoint: a player's run is cut out of the event's matches.
export type HiveeEventData = {
  event: HiveeEvent;
  // The program whose standings are the placements (see `pickFinalProgram`).
  program: HiveeProgram;
  standings: HiveeStandings;
  entrants: HiveeEntrant[];
  matches: HiveeMatch[];
};

const load = async (slug: string): Promise<HiveeEventData> => {
  const { eventId, programId } = await resolveHiveeSlug(slug);
  const event = await fetchHiveeEvent(eventId);
  const program = pickFinalProgram(event.programs, programId, {
    startedOnly: true,
  });
  if (!program) throw new Error(t`This event has no bracket to load.`);

  const [standings, entrants, matches] = await Promise.all([
    fetchHiveeStandings(program.id),
    fetchHiveeEntrants(eventId),
    fetchHiveeCompletedMatches(eventId),
  ]);
  return { event, program, standings, entrants, matches };
};

// The event loaded last is kept, so picking one player after another costs
// no requests (the limit is 60 a minute). `fresh` reads it again.
let cached: { slug: string; data: Promise<HiveeEventData> } | null = null;

export const loadHiveeEventData = (
  slug: string,
  { fresh = false }: { fresh?: boolean } = {},
): Promise<HiveeEventData> => {
  if (!fresh && cached?.slug === slug) return cached.data;
  const data = load(slug);
  cached = { slug, data };
  data.catch(() => {
    if (cached?.data === data) cached = null;
  });
  return data;
};
