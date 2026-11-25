import { useCachedLoad } from "@/hooks/useCachedLoad";
import { fetchEventUpsets } from "@/utils/tournament/fetchEvent";

// The event's upsets against its top seeds, biggest first. Waits for the
// overview, which says where the seeding is.
export const useEventUpsets = (
  eventId: string | null,
  seedPhaseId: string | null,
) =>
  useCachedLoad(eventId && seedPhaseId ? `event-upsets:${eventId}` : null, () =>
    fetchEventUpsets(eventId!, seedPhaseId!),
  );
