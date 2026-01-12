import { PlayerInfo } from "@/types/top8/Player";

const DEFAULT_PLAYER: PlayerInfo = {
  id: "0",
  entrantId: "0",
  name: "Player Name",
  characters: [{ id: "1293", alt: 0 }],
  placement: 0,
  gamerTag: "Player Name",
  prefix: "",
};

export const getPlacements = (playerCount: number): number[] => {
  const placements: number[] = [];

  for (let i = 0; i < Math.min(4, playerCount); i++) {
    placements.push(i + 1);
  }

  let currentPlacement = 5;
  let groupSize = 2;
  let groupsAtThisSize = 0;

  while (placements.length < playerCount) {
    for (let i = 0; i < groupSize && placements.length < playerCount; i++) {
      placements.push(currentPlacement);
    }

    currentPlacement += groupSize;
    groupsAtThisSize++;

    if (groupsAtThisSize === 2) {
      groupSize *= 2;
      groupsAtThisSize = 0;
    }
  }

  return placements;
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
