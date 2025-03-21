import * as fabric from "fabric";

export const setCanvasEditable = (canvas: fabric.Canvas, editable: boolean) => {
  canvas.forEachObject((obj) => {
    if (obj.locked) {
      return;
    }

    obj.locked = !editable;
    obj.lockMovementX = !editable;
    obj.lockMovementY = !editable;
    obj.lockScalingX = !editable;
    obj.lockScalingY = !editable;
    obj.lockRotation = !editable;
    obj.hasControls = editable;
  });

  canvas.selection = editable;
  canvas.discardActiveObject();
  canvas.requestRenderAll();
};
