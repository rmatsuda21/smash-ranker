import * as fabric from "fabric";

import { drawSVG } from "@/utils/top8/drawSVG";

export const generateGraphic = async (canvas: fabric.Canvas) => {
  for (let j = 0; j < 2; j++) {
    for (let i = 0; i < 4; i++) {
      await drawPlayer(canvas, {
        selectable: false,
        hoverCursor: "default",
        left: 175 * i + 50,
        top: 350 * j + 50,
      });
    }
  }
};

const drawPlayer = async (
  canvas: fabric.Canvas,
  options?: Partial<fabric.GroupProps>
) => {
  const frame = await drawSVG("/top8/frame.svg");
  const rect = new fabric.Rect({
    width: 100,
    height: 100,
    fill: "grey",
    left: 25,
    top: 50,
  });

  const group = new fabric.Group([frame, rect], options);
  canvas.add(group);
};
