// One completed set from the user's history, from their side.
export type UserSet = {
  id: string;
  won: boolean;
  completedAt: number | null;
  // Games won by each side, when the score was reported as game counts.
  score: { mine: number; theirs: number } | null;
  opponent: { playerId: string | null; name: string };
  // Character ids the user picked, one per game with a recorded pick.
  characterIds: string[];
};
