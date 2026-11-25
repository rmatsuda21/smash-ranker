import { useCachedLoad } from "@/hooks/useCachedLoad";
import { useAuthUser } from "@/store/authStore";
import type { TournamentEvent } from "@/types/tournament/Tournament";
import { fetchEventOverview } from "@/utils/tournament/fetchEvent";

// Top 8, its sets and, for a logged-in player who entered, their own run.
// Loaded again when the user logs in or out, since the run is part of it.
export const useEventOverview = (event: TournamentEvent | null) => {
  const userId = useAuthUser()?.id ?? null;
  return useCachedLoad(
    event ? `event-overview:${event.id}:${userId ?? "anon"}` : null,
    () => fetchEventOverview(event!.id, { isTeams: event!.isTeams, userId }),
    { mayChange: () => event!.status !== "finished" },
  );
};
