import * as fabric from "fabric";
import { useRef, useState } from "react";

import { Canvas } from "@/components/Top8/Canvas";
import { CanvasConfig } from "@/components/Top8/CanvasConfig";
import { Button, Heading, TextField } from "@radix-ui/themes";

import styles from "./ranker.module.scss";

export const Ranker = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);

  const [filename, setFilename] = useState("");

  return (
    <div className={styles.root}>
      <h1>Ranker</h1>

      <div className={styles.canvasContainer}>
        <Canvas ref={canvasRef} setCanvas={setCanvas} />
      </div>

      <div>
        <Heading as="h2">Canvas Config</Heading>
        <CanvasConfig canvas={canvas!} />
      </div>

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
          if (canvas) {
            const dataURL = canvas.toDataURL({
              format: "png",
              quality: 10,
              multiplier: 2,
            });

            const a = document.createElement("a");
            a.href = dataURL;
            a.download = `${filename || "ranker"}.png`;
            a.click();
          }
        }}
      >
        Download
      </Button>
      <Button
        onClick={() => {
          console.log(canvas?.toJSON());
        }}
      >
        See
      </Button>
      <Button
        onClick={() => {
          // TODO: Implement undo/redo
          console.log(canvas?.toJSON());
        }}
      >
        Undo
      </Button>
    </div>
  );
};
