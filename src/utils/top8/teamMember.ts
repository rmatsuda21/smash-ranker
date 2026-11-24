import { PlayerInfo, TeamMember, TeammateInfo } from "@/types/top8/Player";

/** The player of the team that an element with this `member` draws:
 *  `undefined` for the teammate of a player who has none. */
export const getTeamMember = (
  player: PlayerInfo | undefined,
  member?: TeamMember,
): TeammateInfo | undefined =>
  member === "teammate" ? player?.teammate : player;
