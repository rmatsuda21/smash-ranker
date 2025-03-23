import * as fabric from "fabric";

import { playerObjIds } from "@/consts/top8/playerObjIds";
import { Player } from "@/types/top8/Result";
import { getCharacterImage } from "@/utils/top8/generateGraphic";

export const redrawPlayer = async ({
  playerObj,
  player,
}: {
  playerObj: fabric.FabricObject;
  player: Player;
}) => {
  const canvas = playerObj?.canvas;
  if (!playerObj || !canvas) return;

  const objects = playerObj._objects;

  // Set name
  const nameObj = objects.find((obj) => obj.id === playerObjIds.name);
  if (!nameObj) return;
  nameObj.set({ text: player.name });

  // Set character
  const characterObj = objects.find((obj) => obj.id === playerObjIds.character);
  if (!characterObj) return;
  const mainImage = characterObj._objects.find(
    (obj) => obj.id === playerObjIds.mainImage
  ) as fabric.FabricImage;
  if (!mainImage) return;

  const src = getCharacterImage({
    characterId: player.character,
    alt: player.alt,
  });

  // Redraw backdrop
  const backdrop = characterObj._objects.find(
    (obj) => obj.id === playerObjIds.backdropImage
  ) as fabric.FabricImage;
  if (!backdrop) return;

  await Promise.all([
    mainImage.setSrc(src, {
      crossOrigin: "anonymous",
    }),
    backdrop.setSrc(src, {
      crossOrigin: "anonymous",
    }),
  ]);

  mainImage.dirty = true;
  backdrop.dirty = true;

  mainImage.set({ src });
  backdrop.set({
    src,
  });

  playerObj.set({
    playerName: player.name,
    characterId: player.character,
    alt: player.alt,
  });

  canvas?.renderAll();
};
