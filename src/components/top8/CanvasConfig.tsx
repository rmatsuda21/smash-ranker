import * as fabric from "fabric";
import { useState } from "react";

import { setCanvasEditable } from "@/utils/top8/setCanvasEditable";
import { Checkbox, Flex } from "@radix-ui/themes";

export const CanvasConfig = ({ canvas }: { canvas: fabric.Canvas }) => {
  const [snap, setSnap] = useState(true);
  const [editable, setEditable] = useState(false);

  return (
    <>
      <Flex align="center" gap="2" pt="3">
        Angle Snap
        <Checkbox
          checked={snap}
          onClick={() => {
            setSnap((prev) => !prev);
            canvas?.forEachObject((obj) => {
              obj.snapAngle = snap ? 0 : 45;
            });

            canvas?.requestRenderAll();
          }}
        />
      </Flex>

      <Flex align="center" gap="2" pb="5">
        Edit
        <Checkbox
          checked={editable}
          onClick={() => {
            setEditable((prev) => {
              const isEditable = !prev;

              if (canvas) setCanvasEditable(canvas, isEditable);

              return isEditable;
            });
          }}
        />
      </Flex>
    </>
  );
};
