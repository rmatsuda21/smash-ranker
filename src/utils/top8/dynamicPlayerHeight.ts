import type { Design, ElementConfig, PlayerDesign } from "@/types/top8/Design";
import type { PlayerInfo } from "@/types/top8/Player";

type DynamicHeightConfig = NonNullable<Design["dynamicPlayerHeight"]>;

export function computePlayerHeightDelta(
  config: DynamicHeightConfig,
  characterCount: number,
): number {
  if (characterCount <= config.maxPerRow) return 0;
  const rows = Math.ceil(characterCount / config.maxPerRow);
  return (rows - 1) * (config.rowHeight + config.gap);
}

/**
 * Recursively patch element tree, increasing heights for specific elements
 * identified by id or type+fill. Only clones nodes on the mutation path.
 */
function patchPlayerElements(
  elements: ElementConfig[],
  heightDelta: number,
): ElementConfig[] {
  let changed = false;
  const result = elements.map((el) => {
    // Root rect with fill "primary" — increase height
    if (
      el.type === "rect" &&
      "fill" in el &&
      el.fill === "primary" &&
      el.size?.height
    ) {
      changed = true;
      return {
        ...el,
        size: { ...el.size, height: el.size.height + heightDelta },
      };
    }

    // flexGroup id "main" — increase height + recurse
    if (el.type === "flexGroup" && el.id === "main" && el.size?.height) {
      const patchedChildren = patchPlayerElements(el.elements, heightDelta);
      changed = true;
      return {
        ...el,
        size: { ...el.size, height: el.size.height + heightDelta },
        elements: patchedChildren,
      };
    }

    // flexGroup id "characterImageGroup" — increase height + recurse
    if (
      el.type === "flexGroup" &&
      el.id === "characterImageGroup" &&
      el.size?.height
    ) {
      const patchedChildren = patchPlayerElements(el.elements, heightDelta);
      changed = true;
      return {
        ...el,
        size: { ...el.size, height: el.size.height + heightDelta },
        elements: patchedChildren,
      };
    }

    // customAltCharacterImage id "altCharacterImage" — increase height
    if (
      el.type === "customAltCharacterImage" &&
      el.id === "altCharacterImage" &&
      el.size?.height
    ) {
      changed = true;
      return {
        ...el,
        size: { ...el.size, height: el.size.height + heightDelta },
      };
    }

    return el;
  });

  return changed ? result : elements;
}

export function computeDynamicPlayerLayout(
  basePlayer: PlayerDesign,
  playerOverrides: Partial<PlayerDesign>[],
  players: PlayerInfo[],
  dynamicHeight: DynamicHeightConfig,
): { configs: PlayerDesign[]; totalHeightDelta: number } {
  let cumulativeDelta = 0;
  const configs: PlayerDesign[] = [];

  for (let i = 0; i < playerOverrides.length; i++) {
    const merged: PlayerDesign = { ...basePlayer, ...playerOverrides[i] };
    const player = players[i];
    const characterCount = player?.characters?.length ?? 0;
    const delta = computePlayerHeightDelta(dynamicHeight, characterCount);

    if (delta > 0) {
      merged.elements = patchPlayerElements(merged.elements, delta);
      merged.size = {
        ...merged.size,
        height: merged.size.height + delta,
      };
    }

    if (cumulativeDelta > 0) {
      merged.position = {
        ...merged.position,
        y: merged.position.y + cumulativeDelta,
      };
    }

    configs.push(merged);
    cumulativeDelta += delta;
  }

  return { configs, totalHeightDelta: cumulativeDelta };
}
