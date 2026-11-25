import { useCachedLoad } from "@/hooks/useCachedLoad";
import type { TournamentEvent } from "@/types/tournament/Tournament";
import { fetchEventPhases } from "@/utils/tournament/fetchEvent";

// An event's phases and their pools, first phase to last.
export const useEventPhases = (event: TournamentEvent) =>
  useCachedLoad(`event-phases:${event.id}`, () => fetchEventPhases(event.id), {
    mayChange: () => event.status !== "finished",
  });
