import * as fabric from "fabric";

import { defaultOptions } from "@/consts/top8/defaultFabricOptions";
import { playerObjIds } from "@/consts/top8/playerObjIds";
import { Player, Result } from "@/types/top8/Result";
import { drawSVG } from "@/utils/top8/drawSVG";

const SHADOW_OFFSET = 5;
const FRAME_WIDTH = 200;

export const getCharacterImage = ({
  characterId,
  alt = 0,
  type = "main",
}: {
  characterId: string;
  alt: Player["alt"];
  type?: "main" | "stock";
}) =>
  `https://res.cloudinary.com/dzyfrrrcj/image/upload${
    type === "stock" ? "/f_webp" : ""
  }/smash_ranker/${characterId}/${type}/${alt}.png`;

export const generateGraphic = async (
  canvas: fabric.Canvas,
  result: Result
) => {
  for (let j = 0; j < 2; j++) {
    for (let i = 0; i < 4; i++) {
      await drawPlayer(canvas, result[i + j * 4], {
        left: (FRAME_WIDTH + 50) * i + 50,
        top: 300 * j + 50,
      });
    }
  }
};

const drawPlayer = async (
  canvas: fabric.Canvas,
  player: Player,
  options?: Partial<fabric.GroupProps>
) => {
  // Draw frame
  const frame = await drawSVG("/top8/frame.svg", {
    id: playerObjIds.frame,
  });
  frame.scaleToWidth(FRAME_WIDTH);
  frame.set({
    top: 0,
    left: 0,
  });

  // Draw character
  const img = await fabric.FabricImage.fromURL(
    getCharacterImage({
      characterId: player.character,
      alt: player.alt,
    }),
    {
      crossOrigin: "anonymous",
    }
  );
  img.scaleToWidth(FRAME_WIDTH - 20);
  img.set({
    id: playerObjIds.mainImage,
    left: 0,
    top: frame.getScaledHeight() / 2 - img.getScaledHeight() / 2,
  });

  const backdrop = await img.clone();
  backdrop.filters = [
    new fabric.filters.BlendColor({
      color: "red",
      mode: "tint",
      alpha: 1,
    }),
  ];
  backdrop.applyFilters();
  backdrop.set({
    id: playerObjIds.backdropImage,
    left: backdrop.left + SHADOW_OFFSET,
    top: backdrop.top + SHADOW_OFFSET,
  });
  const imageGroup = new fabric.Group([backdrop, img], {
    id: playerObjIds.character,
  });

  // Draw name
  const text = new fabric.Textbox(player.name, {
    fontSize: 20,
    width: frame.getScaledWidth(),
    fill: "white",
    top: frame.getScaledHeight() + 10,
    left: frame.getScaledWidth() / 2,
    originX: "center",
    textAlign: "center",
    fontStyle: "bold",
    fontFamily: "Rampart One",
    id: playerObjIds.name,
  });

  const group = new fabric.Group([imageGroup, frame, text], {
    id: player.id,
    playerId: player.id,
    playerName: player.name,
    characterId: player.character,
    placement: player.placement,
    alt: 0,
    name: playerObjIds.mainGroup,
    ...defaultOptions,
    ...options,
  });

  canvas.add(group);
};
