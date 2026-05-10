import { PlayerInfo } from "@/types/top8/Player";
import { SocialPlatform } from "@/types/social/SocialTemplate";
import { TournamentInfo } from "@/types/top8/Tournament";

const TOKEN_REGEX = /\{\{([^}]+)\}\}/g;
const MEDAL_BY_PLACEMENT = ["🥇", "🥈", "🥉"] as const;

const normalizeTwitter = (handle: string) =>
  handle.startsWith("@") ? handle : `@${handle}`;

const handleFor = (player: PlayerInfo, platform: SocialPlatform): string => {
  // Bluesky has no handle data source we trust to @-mention, so fall back
  // to the display name. Same fallback for X when no twitter is set.
  if (platform === "x" && player.twitter) {
    return normalizeTwitter(player.twitter);
  }
  return player.name || player.gamerTag;
};

const formatList = (
  players: PlayerInfo[],
  platform: SocialPlatform,
  topN: number,
): string => {
  return players
    .slice(0, topN)
    .map((player, idx) => {
      const place = idx + 1;
      const prefix = MEDAL_BY_PLACEMENT[idx] ?? `${place}.`;
      return `${prefix} ${handleFor(player, platform)}`;
    })
    .join("\n");
};

type ResolveContext = {
  players: PlayerInfo[];
  tournament: Partial<TournamentInfo>;
  platform: SocialPlatform;
  defaultTopN?: number;
};

export const resolveSocialTemplate = (
  template: string,
  ctx: ResolveContext,
): string => {
  const sortedPlayers = [...ctx.players].sort(
    (a, b) => a.placement - b.placement,
  );
  const defaultTopN = ctx.defaultTopN ?? 3;

  return template.replace(TOKEN_REGEX, (_match, rawToken: string) => {
    const token = rawToken.trim();

    if (token === "tournament.name") return ctx.tournament.tournamentName ?? "";
    if (token === "tournament.url") return ctx.tournament.url ?? "";
    if (token === "tournament.date") return ctx.tournament.date ?? "";

    if (token === "winners.list") {
      return formatList(sortedPlayers, ctx.platform, defaultTopN);
    }

    const listMatch = token.match(/^winners\.list:(\d+)$/);
    if (listMatch) {
      return formatList(sortedPlayers, ctx.platform, Number(listMatch[1]));
    }

    const playerMatch = token.match(/^winner(\d+)\.(handle|tag|name)$/);
    if (playerMatch) {
      const idx = Number(playerMatch[1]) - 1;
      const player = sortedPlayers[idx];
      if (!player) return "";
      if (playerMatch[2] === "name") return player.name;
      if (playerMatch[2] === "tag") return player.gamerTag || player.name;
      return handleFor(player, ctx.platform);
    }

    return "";
  });
};
