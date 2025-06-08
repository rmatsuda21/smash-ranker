import * as fabric from "fabric";

export const defaultOptions: Partial<fabric.GroupProps> = {
  hoverCursor: "pointer",
  lockMovementX: true,
  lockMovementY: true,
  lockScalingX: true,
  lockScalingY: true,
  lockRotation: true,
  hasControls: false,
};
