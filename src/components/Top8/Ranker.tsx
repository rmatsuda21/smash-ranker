import * as fabric from "fabric";
import { useRef, useState } from "react";

import { Canvas } from "@/components/Top8/Canvas";
import { CanvasConfig } from "@/components/Top8/CanvasConfig";
import { useFetchTop8 } from "@/hooks/useFetchTop8";
import { Button, Heading, TextField } from "@radix-ui/themes";

import styles from "@/components/styles/Top8/Ranker.module.scss";

export const Ranker = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const { top8, fetching, error } = useFetchTop8(
    "tournament/genesis-9-1/event/ultimate-singles"
  );

  const [filename, setFilename] = useState("");

  if (fetching) return <div>Loading...</div>;
  if (!top8 || error)
    return <div>{error ? <h1>{error.message}</h1> : <h1>Error</h1>}</div>;

  console.log(top8);

  return (
    <div className={styles.root}>
      <h1>Ranker</h1>

      <div className={styles.canvasContainer}>
        <Canvas ref={canvasRef} setCanvas={setCanvas} result={top8} />
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
      <Button
        onClick={() => {
          // get all objects in canvas
          const objects = canvas?.getObjects();
          // search from object with id "image"
          const img = objects?.find((obj) => obj.id === "image");
          (img as fabric.FabricImage)
            .setSrc(
              "https://ssb.wiki.gallery/images/thumb/6/6a/Jigglypuff_SSBU.png/500px-Jigglypuff_SSBU.png",
              {
                crossOrigin: "anonymous",
              }
            )
            .then(() => {
              canvas?.requestRenderAll();
            });
        }}
      >
        Replace Img
      </Button>
    </div>
  );
};
