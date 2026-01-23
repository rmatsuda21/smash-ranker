export enum RenderCondition {
  BACKGROUND_IMG = "<🖼️>",
  TOURNAMENT_ICON = "<🎨>",
  HAS_ALT_CHARACTERS = "<🎮🎮>",
  NOT = "!",
}

export const RenderConditionLabel: Record<RenderCondition, string> = {
  [RenderCondition.BACKGROUND_IMG]: "Background Image",
  [RenderCondition.TOURNAMENT_ICON]: "Tournament Icon",
  [RenderCondition.HAS_ALT_CHARACTERS]: "Has Alt Characters",
  [RenderCondition.NOT]: "Not",
};
