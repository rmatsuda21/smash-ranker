/**
 * Pure derivations from a design plus player data to what actually gets
 * drawn. Every render path (desktop canvas, mobile canvas, template previews,
 * the preview generator) goes through these, so they cannot drift apart.
 */
import type { Design, ElementConfig, PlayerDesign } from "@/types/top8/Design";
import type { PlayerInfo } from "@/types/top8/Player";
import type { TournamentInfo } from "@/types/top8/Tournament";
import {
  computeDynamicPlayerLayout,
  mergePlayerSlots,
} from "@/utils/top8/dynamicPlayerHeight";

type CanvasSize = Design["canvasSize"];

/** Height the design reserves for a tournament icon that this tournament
 *  doesn't have. Players move up by it and the canvas shrinks by it. */
export const getUnusedIconSpace = (
  tournamentIconSpace: Design["tournamentIconSpace"],
  iconSrc: TournamentInfo["iconSrc"],
): number => (tournamentIconSpace && !iconSrc ? tournamentIconSpace : 0);

/** Per-slot player layout: base player merged with the slot's overrides,
 *  grown and shifted when the design opts into dynamic player height. */
export const getPlayerConfigs = (
  basePlayer: Design["basePlayer"],
  playerSlots: Design["players"],
  dynamicPlayerHeight: Design["dynamicPlayerHeight"],
  players: PlayerInfo[],
  fontFamily?: string,
  /** From `getUnusedIconSpace`. */
  unusedIconSpace = 0,
): PlayerDesign[] => {
  if (dynamicPlayerHeight) {
    return computeDynamicPlayerLayout(
      basePlayer,
      playerSlots,
      players,
      dynamicPlayerHeight,
      fontFamily,
      -unusedIconSpace,
    ).configs;
  }
  return mergePlayerSlots(basePlayer, playerSlots, -unusedIconSpace);
};

/** Canvas size after dynamic player height has grown the players that occupy
 *  a slot and unused tournament icon space has been taken out. Returns
 *  `design.canvasSize` itself when nothing changes. */
export const getEffectiveCanvasSize = (
  design: Pick<
    Design,
    "canvasSize" | "basePlayer" | "players" | "dynamicPlayerHeight"
  >,
  players: PlayerInfo[],
  fontFamily?: string,
  /** From `getUnusedIconSpace`. */
  unusedIconSpace = 0,
): CanvasSize => {
  const { canvasSize, dynamicPlayerHeight } = design;

  const growth = dynamicPlayerHeight
    ? computeDynamicPlayerLayout(
        design.basePlayer,
        design.players,
        players,
        dynamicPlayerHeight,
        fontFamily,
      ).totalHeightDelta
    : 0;
  const delta = growth - unusedIconSpace;

  if (delta === 0) return canvasSize;
  return { width: canvasSize.width, height: canvasSize.height + delta };
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
