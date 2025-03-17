import * as fabric from "fabric";
import { useEffect } from "react";

import { drawSVG } from "@/utils/top8/drawSVG";
import { generateGraphic } from "@/utils/top8/generateGraphic";

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 675;

const configureCanvas = (canvas: fabric.Canvas) => {
  canvas.on("object:moving", (e) => {
    const obj = e.target;

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    const objWidth = obj.width * obj.scaleX;
    const objHeight = obj.height * obj.scaleY;

    obj.left = Math.max(0, Math.min(obj.left, canvasWidth - objWidth));
    obj.top = Math.max(0, Math.min(obj.top, canvasHeight - objHeight));
  });

  // TODO: Implement undo/redo
  // canvas.on("object:added", (e) => {
  //   undoStack.push(e.target.canvas?.toJSON());
  // });
};

const initCanvas = async (canvas: fabric.Canvas) => {
  // Draw background
  const background = await drawSVG("/top8/background.svg", {
    selectable: false,
    hoverCursor: "default",
    locked: true,
  });

  canvas.add(background);
};

export const Canvas = ({
  ref: canvasRef,
  setCanvas,
}: {
  ref: React.RefObject<HTMLCanvasElement | null>;
  setCanvas: (canvas: fabric.Canvas) => void;
}) => {
  useEffect(() => {
    const fabricCanvas = new fabric.Canvas(canvasRef.current!, {
      selection: false,
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      backgroundColor: "black",
    });

    configureCanvas(fabricCanvas);
    initCanvas(fabricCanvas);

    generateGraphic(fabricCanvas);

    setCanvas(fabricCanvas);

    return () => {
      fabricCanvas.dispose();
    };
  }, [canvasRef, setCanvas]);

  return <canvas ref={canvasRef} />;
};
