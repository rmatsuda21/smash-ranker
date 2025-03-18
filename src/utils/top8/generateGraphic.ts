import * as fabric from "fabric";

import { drawSVG } from "@/utils/top8/drawSVG";

const SHADOW_OFFSET = 5;
const FRAME_WIDTH = 200;

export const generateGraphic = async (canvas: fabric.Canvas) => {
  for (let j = 0; j < 2; j++) {
    for (let i = 0; i < 4; i++) {
      await drawPlayer(canvas, {
        selectable: false,
        hoverCursor: "default",
        left: (FRAME_WIDTH + 50) * i + 50,
        top: 300 * j + 50,
      });
    }
  }
};

const drawPlayer = async (
  canvas: fabric.Canvas,
  options?: Partial<fabric.GroupProps>
) => {
  const frame = await drawSVG("/top8/frame.svg");
  frame.scaleToWidth(FRAME_WIDTH);
  frame.set({
    top: 0,
    left: 0,
  });

  const img = await fabric.FabricImage.fromURL(
    "https://ssb.wiki.gallery/images/thumb/6/6a/Jigglypuff_SSBU.png/500px-Jigglypuff_SSBU.png",
    {
      crossOrigin: "anonymous",
    }
  );
  img.scaleToWidth(FRAME_WIDTH);
  img.set({
    id: "image",
    left: 0,
    top: frame.getScaledHeight() / 2 - img.getScaledHeight() / 2,
  });

  const backdrop = await img.clone();

  backdrop.filters = [
    new fabric.filters.BlendColor({
      color: "red",
      mode: "multiply",
      alpha: 1,
    }),
  ];
  backdrop.applyFilters();
  backdrop.set({
    left: backdrop.left + SHADOW_OFFSET,
    top: backdrop.top + SHADOW_OFFSET,
  });
  const imageGroup = new fabric.Group([backdrop, img], {
    selectable: false,
    hoverCursor: "default",
    id: "image",
  });

  const group = new fabric.Group([imageGroup, frame], options);
  canvas.add(group);
};
