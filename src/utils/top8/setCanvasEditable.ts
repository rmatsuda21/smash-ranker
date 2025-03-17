import * as fabric from "fabric";

const EDIT_CURSOR = "pointer";

export const setCanvasEditable = (canvas: fabric.Canvas, editable: boolean) => {
  canvas.forEachObject((obj) => {
    if (obj.locked) {
      return;
    }

    obj.selectable = editable;
    obj.hoverCursor = !editable ? "default" : EDIT_CURSOR;
  });

  canvas.selection = editable;
  canvas.discardActiveObject();
  canvas.requestRenderAll();
};
