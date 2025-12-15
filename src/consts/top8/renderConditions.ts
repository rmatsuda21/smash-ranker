export enum RenderCondition {
  BACKGROUND_IMG = "<🖼️>",
  TOURNAMENT_ICON = "<🎨>",
  NOT = "!",
}

export const RenderConditionLabel: Record<RenderCondition, string> = {
  [RenderCondition.BACKGROUND_IMG]: "Background Image",
  [RenderCondition.TOURNAMENT_ICON]: "Tournament Icon",
  [RenderCondition.NOT]: "Not",
};
