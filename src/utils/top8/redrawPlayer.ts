import * as fabric from "fabric";

import { playerObjIds } from "@/consts/top8/playerObjIds";
import { Player } from "@/types/top8/Result";
import { getCharacterImage } from "@/utils/top8/generateGraphic";

// function loadImageSync(src: string): Promise<HTMLImageElement> {
//   return new Promise((resolve, reject) => {
//     const img = new Image();
//     img.crossOrigin = "anonymous"; // Ensure cross-origin compatibility
//     img.src = src;

//     img.onload = () => resolve(img); // Resolve when loaded
//     img.onerror = (err) => reject(err); // Reject on error
//   });
// }

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

  // Redraw backdrop
  const backdrop = characterObj._objects.find(
    (obj) => obj.id === playerObjIds.backdropImage
  ) as fabric.FabricImage;
  if (!backdrop) return;

  const src = getCharacterImage({
    characterId: player.character,
    alt: player.alt,
  });

  await Promise.all([
    mainImage.setSrc(src, {
      crossOrigin: "anonymous",
    }),
    backdrop.setSrc(src, {
      crossOrigin: "anonymous",
    }),
  ]);

  canvas?.renderAll();

  console.log(playerObj);

  const width = playerObj.width * playerObj.scaleX;

  mainImage.scaleToWidth(width);
  backdrop.scaleToWidth(width);

  mainImage.scaleToWidth(width);
  backdrop.scaleToWidth(width);

  playerObj.set({
    playerName: player.name,
    characterId: player.character,
    alt: player.alt,
  });

  canvas?.requestRenderAll();
};
