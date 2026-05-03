import { PlayerInfo } from "@/types/top8/Player";
import { getPlacements } from "@/utils/placements";

export { getPlacements };

const DEFAULT_PLAYER: PlayerInfo = {
  id: "0",
  entrantId: "0",
  name: "Player Name",
  characters: [{ id: "1293", alt: 0 }],
  placement: 0,
  gamerTag: "Player Name",
  prefix: "",
};

export const createBlankPlayer = (placement: number): PlayerInfo => ({
  id: `blank-${crypto.randomUUID()}`,
  entrantId: "",
  name: "",
  characters: [],
  placement,
  gamerTag: "",
  prefix: "",
  twitter: "",
  country: "",
});

export const assignPlacementsToPlayers = (
  players: PlayerInfo[],
): PlayerInfo[] => {
  if (players.length === 0) return players;
  const placements = getPlacements(players.length);
  return players.map((player, index) => ({
    ...player,
    placement: placements[index],
  }));
};

export const createSamplePlayers = (count: number): PlayerInfo[] => {
  const placements = getPlacements(count);

  const players: PlayerInfo[] = new Array(count)
    .fill(DEFAULT_PLAYER)
    .map((player, index) => ({
      ...player,
      name: `Player ${index + 1}`,
      gamerTag: `Player ${index + 1}`,
      id: index.toString(),
      entrantId: index.toString(),
      placement: placements[index],
      twitter: undefined,
    }));

  if (players.length > 0) {
    players[0] = {
      ...players[0],
      name: "Reo M",
      gamerTag: "Reo M",
      entrantId: "69",
      id: "420",
      twitter: "chikyunojin",
      country: "JP",
    };
  }

  return players;
};
