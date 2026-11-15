/**
 * Pure derivations from a design plus player data to what actually gets
 * drawn. Every render path (desktop canvas, mobile canvas, template previews,
 * the preview generator) goes through these, so they cannot drift apart.
 */
import type { Design, ElementConfig, PlayerDesign } from "@/types/top8/Design";
import type { PlayerInfo } from "@/types/top8/Player";
import {
  computeDynamicPlayerLayout,
  computePlayerHeightDelta,
  mergePlayerSlots,
} from "@/utils/top8/dynamicPlayerHeight";

type CanvasSize = Design["canvasSize"];

/** Per-slot player layout: base player merged with the slot's overrides,
 *  grown and shifted when the design opts into dynamic player height. */
export const getPlayerConfigs = (
  basePlayer: Design["basePlayer"],
  playerSlots: Design["players"],
  dynamicPlayerHeight: Design["dynamicPlayerHeight"],
  players: PlayerInfo[],
): PlayerDesign[] => {
  if (dynamicPlayerHeight) {
    return computeDynamicPlayerLayout(
      basePlayer,
      playerSlots,
      players,
      dynamicPlayerHeight,
    ).configs;
  }
  return mergePlayerSlots(basePlayer, playerSlots);
};

/** Canvas size after dynamic player height has grown the players that occupy
 *  a slot. Returns `canvasSize` itself when nothing grows. */
export const getEffectiveCanvasSize = (
  canvasSize: CanvasSize,
  dynamicPlayerHeight: Design["dynamicPlayerHeight"],
  slotCount: number,
  players: PlayerInfo[],
): CanvasSize => {
  if (!dynamicPlayerHeight) return canvasSize;

  let totalDelta = 0;
  for (let i = 0; i < Math.min(slotCount, players.length); i++) {
    totalDelta += computePlayerHeightDelta(
      dynamicPlayerHeight,
      players[i].characters?.length ?? 0,
    );
  }

  if (totalDelta === 0) return canvasSize;
  return { width: canvasSize.width, height: canvasSize.height + totalDelta };
};

/** Stretches full-height background rects when the canvas has grown. */
export const fitBackgroundToCanvas = (
  elements: ElementConfig[],
  originalHeight: number,
  effectiveHeight: number,
): ElementConfig[] => {
  if (effectiveHeight === originalHeight) return elements;

  return elements.map((el) =>
    el.type === "rect" && el.size?.height === originalHeight
      ? { ...el, size: { ...el.size, height: effectiveHeight } }
      : el,
  );
};

/** Indices of the players that occupy a slot, in paint order. */
export const getPlayerPaintOrder = (
  playerCount: number,
  slotCount: number,
  reverseZOrder: boolean | undefined,
): number[] => {
  const order = Array.from(
    { length: Math.min(playerCount, slotCount) },
    (_, index) => index,
  );
  return reverseZOrder ? order.reverse() : order;
};
