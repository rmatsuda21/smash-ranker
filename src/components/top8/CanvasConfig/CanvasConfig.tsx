import { Button, TextField } from "@radix-ui/themes";
import { useState } from "react";

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

      <Button
        onClick={() => {
          // TODO: Implement download
        }}
      >
        Download
      </Button>
    </div>
  );
};
