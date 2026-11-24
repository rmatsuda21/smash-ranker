import { i18n } from "@lingui/core";
import { msg } from "@lingui/core/macro";
import type { MessageDescriptor } from "@lingui/core";

export enum DesignPlaceholder {
  // Tournament placeholders
  TOURNAMENT_NAME = "<📝>",
  EVENT_NAME = "<🎮>",
  TOURNAMENT_DATE = "<📅>",
  /** The date as MM/DD/YYYY. */
  TOURNAMENT_DATE_NUMERIC = "<📅🔢>",
  TOURNAMENT_LOCATION = "<🌍>",
  TOURNAMENT_CITY = "<🏙️>",
  TOURNAMENT_STATE = "<🏙️🏙️>",
  TOURNAMENT_COUNTRY = "<🏙️🏙️🏙️>",
  TOURNAMENT_URL = "<🔗>",
  ENTRANTS = "<👥>",
  // Player placeholders
  PLAYER_PLACEMENT = "<🥇>",
  /** The English ordinal suffix of the placement: st, nd, rd, th. */
  PLAYER_PLACEMENT_SUFFIX = "<🥇🔤>",
  PLAYER_COUNTRY = "<🎌>",
  PLAYER_NAME = "<👤>",
  PLAYER_TAG = "<🏷️>",
  PLAYER_PREFIX = "<🎭>",
  PLAYER_TWITTER = "<🐦>",
  // Doubles: the player's teammate
  TEAMMATE_COUNTRY = "<🎌2>",
  TEAMMATE_NAME = "<👤2>",
  TEAMMATE_TAG = "<🏷️2>",
  TEAMMATE_PREFIX = "<🎭2>",
  TEAMMATE_TWITTER = "<🐦2>",
}

const TournamentPlaceholderMessages: Partial<
  Record<DesignPlaceholder, MessageDescriptor>
> = {
  [DesignPlaceholder.TOURNAMENT_NAME]: msg`Tournament Name`,
  [DesignPlaceholder.EVENT_NAME]: msg`Event Name`,
  [DesignPlaceholder.TOURNAMENT_DATE]: msg`Tournament Date`,
  [DesignPlaceholder.TOURNAMENT_DATE_NUMERIC]: msg`Tournament Date (MM/DD/YYYY)`,
  [DesignPlaceholder.TOURNAMENT_LOCATION]: msg`Tournament Full Address`,
  [DesignPlaceholder.TOURNAMENT_CITY]: msg`Tournament City`,
  [DesignPlaceholder.TOURNAMENT_STATE]: msg`Tournament State`,
  [DesignPlaceholder.TOURNAMENT_COUNTRY]: msg`Tournament Country`,
  [DesignPlaceholder.TOURNAMENT_URL]: msg`Tournament URL`,
  [DesignPlaceholder.ENTRANTS]: msg`# of Entrants`,
};

const PlayerPlaceholderMessages: Partial<
  Record<DesignPlaceholder, MessageDescriptor>
> = {
  [DesignPlaceholder.PLAYER_PLACEMENT]: msg`Player Placement`,
  [DesignPlaceholder.PLAYER_PLACEMENT_SUFFIX]: msg`Player Placement Suffix (st, nd, rd, th)`,
  [DesignPlaceholder.PLAYER_COUNTRY]: msg`Player Country`,
  [DesignPlaceholder.PLAYER_NAME]: msg`Player Name (w/ Prefix)`,
  [DesignPlaceholder.PLAYER_TAG]: msg`Player Tag`,
  [DesignPlaceholder.PLAYER_PREFIX]: msg`Player Prefix`,
  [DesignPlaceholder.PLAYER_TWITTER]: msg`Twitter Handle`,
  [DesignPlaceholder.TEAMMATE_COUNTRY]: msg`Teammate Country`,
  [DesignPlaceholder.TEAMMATE_NAME]: msg`Teammate Name (w/ Prefix)`,
  [DesignPlaceholder.TEAMMATE_TAG]: msg`Teammate Tag`,
  [DesignPlaceholder.TEAMMATE_PREFIX]: msg`Teammate Prefix`,
  [DesignPlaceholder.TEAMMATE_TWITTER]: msg`Teammate Twitter Handle`,
};

const AllPlaceholderMessages: Record<DesignPlaceholder, MessageDescriptor> = {
  ...TournamentPlaceholderMessages,
  ...PlayerPlaceholderMessages,
} as Record<DesignPlaceholder, MessageDescriptor>;

export const PlaceholderLabel = {
  get(placeholder: DesignPlaceholder): string {
    return i18n._(AllPlaceholderMessages[placeholder]);
  },
  entries(): [DesignPlaceholder, string][] {
    return Object.entries(AllPlaceholderMessages).map(([key, desc]) => [
      key as DesignPlaceholder,
      i18n._(desc),
    ]);
  },
  tournamentEntries(): [DesignPlaceholder, string][] {
    return Object.entries(TournamentPlaceholderMessages).map(([key, desc]) => [
      key as DesignPlaceholder,
      i18n._(desc),
    ]);
  },
  playerEntries(): [DesignPlaceholder, string][] {
    return Object.entries(PlayerPlaceholderMessages).map(([key, desc]) => [
      key as DesignPlaceholder,
      i18n._(desc),
    ]);
  },
};
