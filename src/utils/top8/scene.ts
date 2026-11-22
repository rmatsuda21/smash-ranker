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
import { evaluateElementCondition } from "@/utils/top8/evaluateElementCondition";
import { layoutPlayerTable, placeInColumns } from "@/utils/top8/playerTable";

type CanvasSize = Design["canvasSize"];

/** Height the design reserves for a tournament icon that this tournament
 *  doesn't have. Players move up by it and the canvas shrinks by it. */
export const getUnusedIconSpace = (
  tournamentIconSpace: Design["tournamentIconSpace"],
  iconSrc: TournamentInfo["iconSrc"],
): number => (tournamentIconSpace && !iconSrc ? tournamentIconSpace : 0);

/** The design's collapsible band, when the winner has nothing to put in it
 *  and it is therefore taken out of the layout. */
export const getCollapsedBand = (
  band: Design["collapsibleBand"],
  players: PlayerInfo[],
): Design["collapsibleBand"] =>
  band && !evaluateElementCondition(band.conditions, { player: players[0] })
    ? band
    : undefined;

/** Moves what sits at or below a collapsed band up by its height. Returns
 *  `items` itself when nothing moves. */
const closeBand = <T extends { position?: { x: number; y: number } }>(
  items: T[],
  band: Design["collapsibleBand"],
): T[] => {
  if (!band || !items.some((item) => (item.position?.y ?? 0) >= band.y)) {
    return items;
  }
  return items.map((item) =>
    item.position && item.position.y >= band.y
      ? {
          ...item,
          position: { x: item.position.x, y: item.position.y - band.height },
        }
      : item,
  );
};

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
  playerTable?: Design["playerTable"],
  collapsibleBand?: Design["collapsibleBand"],
): PlayerDesign[] => {
  const laidOut = dynamicPlayerHeight
    ? computeDynamicPlayerLayout(
        basePlayer,
        playerSlots,
        players,
        dynamicPlayerHeight,
        fontFamily,
        -unusedIconSpace,
      ).configs
    : mergePlayerSlots(basePlayer, playerSlots, -unusedIconSpace);
  const configs = closeBand(
    laidOut,
    getCollapsedBand(collapsibleBand, players),
  );

  if (!playerTable) return configs;

  const layout = layoutPlayerTable(playerTable, configs, players, fontFamily);
  return configs.map((config) => ({
    ...config,
    elements: placeInColumns(config.elements, layout, playerTable.gap, true),
  }));
};

/** The tournament layer's elements, with those that belong to a column of
 *  the design's player table (its headers) placed over that column. Returns
 *  `elements` itself for a design without a table. */
export const getTournamentElements = (
  elements: ElementConfig[] | undefined,
  design: Pick<
    Design,
    "basePlayer" | "players" | "playerTable" | "collapsibleBand"
  >,
  players: PlayerInfo[],
  fontFamily?: string,
): ElementConfig[] | undefined => {
  const { playerTable } = design;
  if (!elements) return elements;

  const closed = closeBand(
    elements,
    getCollapsedBand(design.collapsibleBand, players),
  );
  if (!playerTable) return closed;

  const layout = layoutPlayerTable(
    playerTable,
    mergePlayerSlots(design.basePlayer, design.players),
    players,
    fontFamily,
  );
  return placeInColumns(closed, layout, playerTable.gap);
};

/** Canvas size after dynamic player height has grown the players that occupy
 *  a slot and unused tournament icon space has been taken out. Returns
 *  `design.canvasSize` itself when nothing changes. */
export const getEffectiveCanvasSize = (
  design: Pick<
    Design,
    | "canvasSize"
    | "basePlayer"
    | "players"
    | "dynamicPlayerHeight"
    | "collapsibleBand"
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
  const collapsed =
    getCollapsedBand(design.collapsibleBand, players)?.height ?? 0;
  const delta = growth - unusedIconSpace - collapsed;

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
