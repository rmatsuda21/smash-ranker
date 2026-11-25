import { useCachedLoad } from "@/hooks/useCachedLoad";
import type { TournamentEvent } from "@/types/tournament/Tournament";
import { fetchPool } from "@/utils/tournament/fetchEvent";

// The given brackets (pools), in the order asked for: each one's finished
// sets and placements. One for a bracket or a round robin pool; one per
// round for a Swiss stage held as a phase per round.
export const usePools = (event: TournamentEvent, groupIds: string[]) =>
  useCachedLoad(
    groupIds.length > 0 ? `pools:${groupIds.join(",")}` : null,
    () => Promise.all(groupIds.map(fetchPool)),
    { mayChange: () => event.status !== "finished" },
  );
