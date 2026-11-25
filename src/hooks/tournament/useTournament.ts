import { useCachedLoad } from "@/hooks/useCachedLoad";
import { fetchTournament } from "@/utils/tournament/fetchTournament";

// A start.gg tournament by id. `data` is null with status "done" when
// start.gg has no such tournament.
export const useTournament = (id: string | null) =>
  useCachedLoad(id ? `tournament:${id}` : null, () => fetchTournament(id!));
