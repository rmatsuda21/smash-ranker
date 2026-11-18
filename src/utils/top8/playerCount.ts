import type { Design, DynamicPlayerCount } from "@/types/top8/Design";
import { fitBackgroundToCanvas } from "@/utils/top8/scene";

export const clampPlayerCount = (
  { min, max }: DynamicPlayerCount,
  count: number,
): number => Math.max(min, Math.min(max, Math.round(count)));

/**
 * The design with `count` player slots (clamped to the design's range).
 * Existing slots are kept as they are; new ones continue the stack under the
 * last slot. Returns the same design when it has no `dynamicPlayerCount` or
 * already has that many slots.
 */
export const resizePlayerSlots = (design: Design, count: number): Design => {
  const config = design.dynamicPlayerCount;
  if (!config || !Number.isFinite(count)) return design;

  const current = design.players.length;
  const target = clampPlayerCount(config, count);
  if (target === current) return design;

  const players = design.players.slice(0, target);
  for (let index = players.length; index < target; index++) {
    const previous = players[index - 1]?.position ?? design.basePlayer.position;
    players.push({
      ...config.slotOverrides?.[index],
      id: `player-${index}`,
      position: {
        x: previous.x,
        y: index === 0 ? previous.y : previous.y + config.slotPitch,
      },
    });
  }

  const height =
    design.canvasSize.height + (target - current) * config.slotPitch;

  return {
    ...design,
    players,
    canvasSize: { ...design.canvasSize, height },
    background: {
      ...design.background,
      elements: fitBackgroundToCanvas(
        design.background.elements,
        design.canvasSize.height,
        height,
      ),
    },
  };
};
