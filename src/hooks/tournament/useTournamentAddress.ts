import { useCachedLoad } from "@/hooks/useCachedLoad";
import { resolveTournamentSlug } from "@/utils/tournament/fetchTournament";

// The ids behind a start.gg tournament slug. `data` is null with status
// "done" when start.gg has no such tournament.
export const useTournamentAddress = (slug: string | null) =>
  useCachedLoad(slug ? `tournament-slug:${slug}` : null, () =>
    resolveTournamentSlug(slug!),
  );
