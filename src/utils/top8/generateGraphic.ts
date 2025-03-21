import * as fabric from "fabric";

import { drawSVG } from "@/utils/top8/drawSVG";
import { Player, Result } from "@/types/top8/Result";
import { defaultOptions } from "@/consts/Top8/defaultFabricOptions";

const SHADOW_OFFSET = 5;
const FRAME_WIDTH = 200;

const getCharacterImage = (
  character: string,
  alt: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 = 0
) =>
  `https://res.cloudinary.com/dzyfrrrcj/image/upload/smash_ranker/${character}/main/${alt}.png`;

export const generateGraphic = async (
  canvas: fabric.Canvas,
  result: Result,
  onPlayerSelected: (obj: fabric.FabricObject) => void
) => {
  for (let j = 0; j < 2; j++) {
    for (let i = 0; i < 4; i++) {
      await drawPlayer(canvas, result[i + j * 4], onPlayerSelected, {
        left: (FRAME_WIDTH + 50) * i + 50,
        top: 300 * j + 50,
      });
    }
  }
};

const drawPlayer = async (
  canvas: fabric.Canvas,
  player: Player,
  onPlayerSelected: (obj: fabric.FabricObject) => void,
  options?: Partial<fabric.GroupProps>
) => {
  // Draw frame
  const frame = await drawSVG("/top8/frame.svg");
  frame.scaleToWidth(FRAME_WIDTH);
  frame.set({
    top: 0,
    left: 0,
  });

  // Draw character
  const img = await fabric.FabricImage.fromURL(
    getCharacterImage(player.character),
    {
      crossOrigin: "anonymous",
    }
  );
  img.scaleToWidth(FRAME_WIDTH - 20);
  img.set({
    id: "image",
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
    left: backdrop.left + SHADOW_OFFSET,
    top: backdrop.top + SHADOW_OFFSET,
  });
  const imageGroup = new fabric.Group([backdrop, img], {
    id: "image",
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
    fontFamily: "Comic Sans MS",
    id: "name",
  });

  const group = new fabric.Group([imageGroup, frame, text], {
    id: player.id,
    ...defaultOptions,
    ...options,
  });

  // TODO: Make player clicking let you edit the player info
  group.on("mousedown", (e) => {
    if (!e.target) return;

    onPlayerSelected(e.target);
  });

  canvas.add(group);
};
