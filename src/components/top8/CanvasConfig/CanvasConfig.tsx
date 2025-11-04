import { Button, TextField } from "@radix-ui/themes";
import { useState } from "react";
import Konva from "konva";

type Props = {
  stageRef: React.RefObject<Konva.Stage | null>;
};

export const CanvasConfig = ({ stageRef }: Props) => {
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

      <Button
        onClick={() => {
          if (!stageRef.current) return;

          const dataURL = stageRef.current.toDataURL({
            pixelRatio: 2, // double resolution
          });

          const link = document.createElement("a");
          link.download = filename;
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
