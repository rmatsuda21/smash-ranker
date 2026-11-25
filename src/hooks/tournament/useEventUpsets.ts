import { useCachedLoad } from "@/hooks/useCachedLoad";
import type { TournamentEvent } from "@/types/tournament/Tournament";
import { fetchEventUpsets } from "@/utils/tournament/fetchEvent";

// The event's upsets against its top seeds, biggest first. Waits for the
// overview, which says where the seeding is.
export const useEventUpsets = (
  event: TournamentEvent,
  seedPhaseId: string | null,
) =>
  useCachedLoad(
    seedPhaseId ? `event-upsets:${event.id}` : null,
    () => fetchEventUpsets(event.id, seedPhaseId!),
    { mayChange: () => event.status !== "finished" },
  );
