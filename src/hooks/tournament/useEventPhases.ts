import { useCachedLoad } from "@/hooks/useCachedLoad";
import { fetchEventPhases } from "@/utils/tournament/fetchEvent";

// An event's phases and their pools, first phase to last.
export const useEventPhases = (eventId: string | null) =>
  useCachedLoad(eventId ? `event-phases:${eventId}` : null, () =>
    fetchEventPhases(eventId!),
  );
