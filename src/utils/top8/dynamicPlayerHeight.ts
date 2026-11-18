import type {
  DynamicPlayerHeight,
  ElementConfig,
  FlexGroupElementConfig,
  PlayerDesign,
} from "@/types/top8/Design";
import type { PlayerInfo } from "@/types/top8/Player";
import { measureWrappedFlexHeight } from "@/utils/top8/elementFactory/layout/flexLayout";

const findFlexGroup = (
  elements: ElementConfig[],
  id: string,
): FlexGroupElementConfig | undefined => {
  for (const el of elements) {
    if (el.type === "flexGroup" && el.id === id) return el;
    if ("elements" in el && el.elements) {
      const found = findFlexGroup(el.elements, id);
      if (found) return found;
    }
  }
  return undefined;
};

/**
 * How much taller than its configured height a player has to be drawn.
 * `fontFamily` only matters to wrap-based designs, whose line breaks depend
 * on measured text.
 */
export function computePlayerHeightDelta(
  config: DynamicPlayerHeight,
  playerConfig: PlayerDesign,
  player: PlayerInfo | undefined,
  fontFamily: string | undefined,
): number {
  if (!player) return 0;

  if ("wrapGroupId" in config) {
    const group = findFlexGroup(playerConfig.elements, config.wrapGroupId);
    if (!group) return 0;
    const height = measureWrappedFlexHeight(group, { player, fontFamily });
    return Math.max(0, Math.ceil(height - (group.size?.height ?? 0)));
  }

  const characterCount = player.characters?.length ?? 0;
  if (characterCount <= config.maxPerRow) return 0;
  const rows = Math.ceil(characterCount / config.maxPerRow);
  return (rows - 1) * (config.rowHeight + config.gap);
}

/** Wrap-based designs: top-level elements spanning the player's full height
 *  (backgrounds, highlights) grow with it. */
const growFullHeightElements = (
  elements: ElementConfig[],
  playerHeight: number,
  heightDelta: number,
): ElementConfig[] =>
  elements.map((el) =>
    el.size?.height === playerHeight
      ? { ...el, size: { ...el.size, height: playerHeight + heightDelta } }
      : el,
  );

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
  wrap: boolean;
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
  wrap = false,
): PlayerDesign => {
  const cached = slotLayoutCache.get(slot);
  if (
    cached &&
    cached.basePlayer === basePlayer &&
    cached.wrap === wrap &&
    cached.delta === delta &&
    cached.offsetY === offsetY
  ) {
    return cached.config;
  }

  const config: PlayerDesign = { ...basePlayer, ...slot };

  if (delta > 0) {
    config.elements = wrap
      ? growFullHeightElements(config.elements, config.size.height, delta)
      : patchPlayerElements(config.elements, delta);
    config.size = { ...config.size, height: config.size.height + delta };
  }

  if (offsetY !== 0) {
    config.position = { ...config.position, y: config.position.y + offsetY };
  }

  slotLayoutCache.set(slot, { basePlayer, wrap, delta, offsetY, config });
  return config;
};

/** Base player merged with each slot's overrides, with no height changes.
 *  `offsetY` moves every player down (negative: up). */
export const mergePlayerSlots = (
  basePlayer: PlayerDesign,
  playerOverrides: Partial<PlayerDesign>[],
  offsetY = 0,
): PlayerDesign[] =>
  playerOverrides.map((slot) => layoutSlot(basePlayer, slot, 0, offsetY));

export function computeDynamicPlayerLayout(
  basePlayer: PlayerDesign,
  playerOverrides: Partial<PlayerDesign>[],
  players: PlayerInfo[],
  dynamicHeight: DynamicPlayerHeight,
  fontFamily?: string,
  /** Moves every player down (negative: up) before any growth. */
  offsetY = 0,
): { configs: PlayerDesign[]; totalHeightDelta: number } {
  const wrap = "wrapGroupId" in dynamicHeight;
  let cumulativeDelta = 0;
  const configs: PlayerDesign[] = [];

  for (let i = 0; i < playerOverrides.length; i++) {
    const slot = playerOverrides[i];
    const delta = computePlayerHeightDelta(
      dynamicHeight,
      { ...basePlayer, ...slot },
      players[i],
      fontFamily,
    );

    configs.push(
      layoutSlot(basePlayer, slot, delta, offsetY + cumulativeDelta, wrap),
    );
    cumulativeDelta += delta;
  }

  return { configs, totalHeightDelta: cumulativeDelta };
}
