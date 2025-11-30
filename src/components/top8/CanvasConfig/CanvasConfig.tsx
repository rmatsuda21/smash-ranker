import { Button, TextField } from "@radix-ui/themes";
import { useState } from "react";

import { FontSelect } from "@/components/top8/CanvasConfig/FontSelect/FontSelect";
import { useCanvasStore } from "@/store/canvasStore";

export const CanvasConfig = () => {
  const [filename, setFilename] = useState("");
  const stageRef = useCanvasStore((state) => state.stageRef);

  return (
    <div>
      <label htmlFor="name">Filename:</label>
      <TextField.Root
        type="text"
        name="filename"
        value={filename}
        onChange={(event) => {
          setFilename(event.currentTarget.value);
        }}
        placeholder="ranker.png"
      />
      <FontSelect />

      <Button
        disabled={!stageRef}
        onClick={() => {
          if (!stageRef) return;

          const dataURL = stageRef.toDataURL({
            pixelRatio: 1,
          });

          const link = document.createElement("a");
          link.download = filename || "ranker.png";
          link.href = dataURL;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }}
      >
        Download
      </Button>
    </div>
  );
};
