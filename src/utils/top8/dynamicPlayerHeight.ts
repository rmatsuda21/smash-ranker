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

type SlotLayout = {
  basePlayer: PlayerDesign;
  delta: number;
  offsetY: number;
  config: PlayerDesign;
};

// Last layout computed for each slot object. A slot whose inputs are
// unchanged gets the same config object back, so `Player` can tell at a
// glance that nothing changed instead of deep-comparing element trees.
const slotLayoutCache = new WeakMap<Partial<PlayerDesign>, SlotLayout>();

const layoutSlot = (
  basePlayer: PlayerDesign,
  slot: Partial<PlayerDesign>,
  delta: number,
  offsetY: number,
): PlayerDesign => {
  const cached = slotLayoutCache.get(slot);
  if (
    cached &&
    cached.basePlayer === basePlayer &&
    cached.delta === delta &&
    cached.offsetY === offsetY
  ) {
    return cached.config;
  }

  const config: PlayerDesign = { ...basePlayer, ...slot };

  if (delta > 0) {
    config.elements = patchPlayerElements(config.elements, delta);
    config.size = { ...config.size, height: config.size.height + delta };
  }

  if (offsetY > 0) {
    config.position = { ...config.position, y: config.position.y + offsetY };
  }

  slotLayoutCache.set(slot, { basePlayer, delta, offsetY, config });
  return config;
};

/** Base player merged with each slot's overrides, with no height changes. */
export const mergePlayerSlots = (
  basePlayer: PlayerDesign,
  playerOverrides: Partial<PlayerDesign>[],
): PlayerDesign[] =>
  playerOverrides.map((slot) => layoutSlot(basePlayer, slot, 0, 0));

export function computeDynamicPlayerLayout(
  basePlayer: PlayerDesign,
  playerOverrides: Partial<PlayerDesign>[],
  players: PlayerInfo[],
  dynamicHeight: DynamicHeightConfig,
): { configs: PlayerDesign[]; totalHeightDelta: number } {
  let cumulativeDelta = 0;
  const configs: PlayerDesign[] = [];

  for (let i = 0; i < playerOverrides.length; i++) {
    const characterCount = players[i]?.characters?.length ?? 0;
    const delta = computePlayerHeightDelta(dynamicHeight, characterCount);

    configs.push(
      layoutSlot(basePlayer, playerOverrides[i], delta, cumulativeDelta),
    );
    cumulativeDelta += delta;
  }

  return { configs, totalHeightDelta: cumulativeDelta };
}
