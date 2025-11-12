import { Button, TextField } from "@radix-ui/themes";
import { useState } from "react";
import Konva from "konva";

import { FontSelect } from "@/components/top8/FontSelect/FontSelect";

export const CanvasConfig = () => {
  const [filename, setFilename] = useState("");

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
        onClick={() => {
          const stageElement = document.getElementById("top8-canvas-stage");
          if (!stageElement) return;

          const stage = Konva.stages.find(
            (s) => s.container().id === "top8-canvas-stage"
          );
          if (!stage) return;

          const dataURL = stage.toDataURL({
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
