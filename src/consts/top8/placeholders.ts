export enum LayoutPlaceholder {
  PLAYER_PLACEMENT = "<🥇>",
  TOURNAMENT_NAME = "<📝>",
  EVENT_NAME = "<🎮>",
  TOURNAMENT_DATE = "<📅>",
  TOURNAMENT_LOCATION = "<🌍>",
  TOURNAMENT_CITY = "<🏙️>",
  TOURNAMENT_STATE = "<🏙️🏙️>",
  TOURNAMENT_COUNTRY = "<🏙️🏙️🏙️>",
  ENTRANTS = "<👥>",
  PLAYER_NAME = "<👤>",
  PLAYER_TAG = "<🏷️>",
  PLAYER_PREFIX = "<🎭>",
  PLAYER_TWITTER = "<🐦>",
}

export const PlaceholderLabel: Record<LayoutPlaceholder, string> = {
  [LayoutPlaceholder.PLAYER_PLACEMENT]: "Player Placement",
  [LayoutPlaceholder.TOURNAMENT_NAME]: "Tournament Name",
  [LayoutPlaceholder.EVENT_NAME]: "Event Name",
  [LayoutPlaceholder.TOURNAMENT_DATE]: "Tournament Date",
  [LayoutPlaceholder.TOURNAMENT_LOCATION]:
    "Tournament Location (City, State, Country)",
  [LayoutPlaceholder.TOURNAMENT_CITY]: "Tournament City",
  [LayoutPlaceholder.TOURNAMENT_STATE]: "Tournament State",
  [LayoutPlaceholder.TOURNAMENT_COUNTRY]: "Tournament Country",
  [LayoutPlaceholder.ENTRANTS]: "# of Entrants",
  [LayoutPlaceholder.PLAYER_NAME]: "Player Name (w/ Prefix)",
  [LayoutPlaceholder.PLAYER_TAG]: "Player Tag",
  [LayoutPlaceholder.PLAYER_PREFIX]: "Player Prefix",
  [LayoutPlaceholder.PLAYER_TWITTER]: "Twitter Handle",
};
