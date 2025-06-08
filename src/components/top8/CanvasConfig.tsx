import { useState } from "react";

import { Checkbox, Flex } from "@radix-ui/themes";
import { Graphic } from "@/js/top8/Graphic";

export const CanvasConfig = ({ graphic }: { graphic: Graphic }) => {
  const [snap, setSnap] = useState(true);
  const [editable, setEditable] = useState(false);

  const canvas = graphic.canvas;

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

              if (canvas) graphic.setCanvasEditable(isEditable);

              return isEditable;
            });
          }}
        />
      </Flex>
    </>
  );
};
