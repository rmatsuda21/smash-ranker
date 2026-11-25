import { CharacerData, PlayerInfo } from "@/types/top8/Player";
import { getPlacements } from "@/utils/placements";

import { noCharacters } from "@/utils/top8/playerCharacters";

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
  characters: noCharacters(),
  placement,
  gamerTag: "",
  prefix: "",
  twitter: "",
  country: "",
});

/** `players` followed by blank players (with the placement of their slot)
 *  up to `targetCount`. Returns `players` itself when it is long enough. */
export const padPlayersWithBlanks = (
  players: PlayerInfo[],
  targetCount: number,
): PlayerInfo[] => {
  if (players.length >= targetCount) return players;

  const placements = getPlacements(targetCount);
  const padded = [...players];
  for (let i = players.length; i < targetCount; i++) {
    padded.push(createBlankPlayer(placements[i]));
  }
  return padded;
};

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

type SampleEntry = {
  tag: string;
  prefix?: string;
  country?: string;
  characters: string[];
  /** Costume of each character, in the order of `characters`. */
  alts?: CharacerData["alt"][];
};

const REO: SampleEntry = { tag: "Reo M", country: "JP", characters: ["1293"] };

// Top players and the characters they are known for.
const PROS = {
  acola: { tag: "あcola", prefix: "ZETA", country: "JP", characters: ["1766"] },
  sparg0: {
    tag: "Sparg0",
    prefix: "FaZe",
    country: "MX",
    characters: ["1275", "1795"],
    alts: [5, 1],
  },
  miya: { tag: "Miya", country: "JP", characters: ["1405"], alts: [5] },
  mkleo: {
    tag: "MkLeo",
    prefix: "LG",
    country: "MX",
    characters: ["1453", "1539"],
  },
  hurt: {
    tag: "Hurt",
    prefix: "E36",
    country: "JP",
    characters: ["1331"],
    alts: [3],
  },
  light: { tag: "Light", country: "US", characters: ["1286"], alts: [6] },
  zackray: {
    tag: "Zackray",
    country: "JP",
    characters: ["1323", "1453"],
    alts: [7, 5],
  },
  asimo: { tag: "Asimo", country: "JP", characters: ["1327"] },
  yoshidora: {
    tag: "Yoshidora",
    country: "JP",
    characters: ["1338"],
    alts: [2],
  },
  neo: { tag: "Neo", country: "JP", characters: ["1276"], alts: [3] },
  muteace: { tag: "MuteAce", country: "US", characters: ["1317"] },
  tea: {
    tag: "Tea",
    prefix: "ZETA",
    country: "JP",
    characters: ["1846", "1315"],
    alts: [7, 0],
  },
  doramigi: {
    tag: "Doramigi",
    prefix: "AREA310",
    country: "JP",
    characters: ["1747"],
  },
  zomba: { tag: "Zomba", prefix: "CTG", country: "US", characters: ["1323"] },
  shuton: {
    tag: "Shuton",
    prefix: "RC",
    country: "JP",
    characters: ["1314", "1795"],
    alts: [1, 0],
  },
} satisfies Record<string, SampleEntry>;

// Made-up players for the slots after the pros, up to the 32 the ranker keeps.
const FILLERS: SampleEntry[] = [
  { tag: "Lumen", prefix: "ARC", country: "US", characters: ["1777"] },
  { tag: "Sable", country: "MX", characters: ["1332"] },
  { tag: "ふたりのきわみ", prefix: "TKO", country: "FR", characters: ["1846"] },
  { tag: "Dusk", characters: ["1337", "1302"] },
  { tag: "Piko", prefix: "ARC", country: "CA", characters: ["1319", "1318"] },
  { tag: "Brask", country: "US", characters: ["1747"] },
  { tag: "Onyx", prefix: "NVX", country: "KR", characters: ["1340"] },
  { tag: "Vanta", country: "US", characters: ["1316"] },
  { tag: "Tenkey", prefix: "SDJ", country: "JP", characters: ["1326", "1409"] },
  { tag: "そらまめ", country: "JP", characters: ["1295"] },
  { tag: "Marlo", prefix: "LYS", country: "DE", characters: ["1406"] },
  { tag: "Juno", country: "GB", characters: ["1271"] },
  { tag: "Halo", country: "AU", characters: ["1320"] },
  { tag: "Moss", prefix: "LYS", country: "US", characters: ["1321"] },
  { tag: "Zephyr", country: "US", characters: ["1285"] },
  { tag: "Bolt", prefix: "SDJ", country: "JP", characters: ["1305"] },
  { tag: "Cinder", country: "BR", characters: ["1410"] },
  { tag: "Rook", country: "GB", characters: ["1287"] },
  { tag: "Mika", prefix: "KMO", country: "JP", characters: ["1292"] },
  { tag: "Wren", country: "NL", characters: ["1897"] },
];

const P = PROS;
// Each lineup is a different finishing order of the same players, with Reo M
// first, so previews of different templates don't all show the same bracket.
const LINEUPS: SampleEntry[][] = [
  [
    P.acola,
    P.sparg0,
    P.miya,
    P.mkleo,
    P.hurt,
    P.light,
    P.zackray,
    P.asimo,
    P.yoshidora,
    P.neo,
    P.muteace,
    P.tea,
    P.doramigi,
    P.zomba,
    P.shuton,
  ],
  [
    P.zackray,
    P.mkleo,
    P.asimo,
    P.yoshidora,
    P.acola,
    P.muteace,
    P.neo,
    P.hurt,
    P.sparg0,
    P.miya,
    P.light,
    P.shuton,
    P.zomba,
    P.tea,
    P.doramigi,
  ],
  [
    P.sparg0,
    P.hurt,
    P.light,
    P.neo,
    P.miya,
    P.yoshidora,
    P.asimo,
    P.acola,
    P.mkleo,
    P.zackray,
    P.muteace,
    P.doramigi,
    P.shuton,
    P.zomba,
    P.tea,
  ],
].map((pros) => [REO, ...pros, ...FILLERS]);

export const SAMPLE_LINEUP_COUNT = LINEUPS.length;

/** `count` sample players in finishing order. `lineup` picks one of
 *  `SAMPLE_LINEUP_COUNT` orders; Reo M is first in all of them. */
export const createSamplePlayers = (
  count: number,
  lineup = 0,
): PlayerInfo[] => {
  const placements = getPlacements(count);
  const cast = LINEUPS[lineup % LINEUPS.length];

  const players: PlayerInfo[] = new Array(count)
    .fill(DEFAULT_PLAYER)
    .map((player, index) => {
      const entry: SampleEntry | undefined = cast[index];
      const tag = entry?.tag ?? `Player ${index + 1}`;
      return {
        ...player,
        name: tag,
        gamerTag: tag,
        prefix: entry?.prefix ?? "",
        country: entry?.country ?? "",
        characters: entry
          ? entry.characters.map((id, i) => ({
              id,
              alt: entry.alts?.[i] ?? 0,
            }))
          : player.characters,
        id: index.toString(),
        entrantId: index.toString(),
        placement: placements[index],
        twitter: undefined,
      };
    });

  if (players.length > 0) {
    players[0] = {
      ...players[0],
      entrantId: "69",
      id: "420",
      twitter: "chikyunojin",
    };
  }

  return players;
};

/** `count` sample doubles teams in finishing order: the sample players taken
 *  two at a time, the second of each pair as the first one's teammate. */
export const createSampleTeams = (count: number, lineup = 0): PlayerInfo[] => {
  const placements = getPlacements(count);
  const players = createSamplePlayers(count * 2, lineup);

  return Array.from({ length: count }, (_, index) => {
    const player = players[index * 2];
    const { name, gamerTag, prefix, characters, country } =
      players[index * 2 + 1];

    return {
      ...player,
      name: `${player.gamerTag} / ${gamerTag}`,
      placement: placements[index],
      teammate: { name, gamerTag, prefix, characters, country },
    };
  });
};
