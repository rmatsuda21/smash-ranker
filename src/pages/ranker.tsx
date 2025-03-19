import * as fabric from "fabric";
import Cookies from "js-cookie";
import { useRef, useState } from "react";
import { cacheExchange, Client, fetchExchange, Provider } from "urql";

import { Canvas } from "@/components/Top8/Canvas";
import { CanvasConfig } from "@/components/Top8/CanvasConfig";
import { COOKIES } from "@/consts/cookies";
import { Button, Heading, TextField } from "@radix-ui/themes";

import styles from "./ranker.module.scss";
import { QueryTest } from "@/components/Top8/QueryTest";

const client = new Client({
  url: "https://api.start.gg/gql/alpha",
  exchanges: [cacheExchange, fetchExchange],
  fetchOptions: () => {
    const cookie = Cookies.get(COOKIES.STARTGG_TOKEN);
    const token = cookie || import.meta.env.VITE_START_GG_TOKEN;

    return {
      headers: { authorization: token ? `Bearer ${token}` : "" },
    };
  },
});

export const Ranker = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);

  const [filename, setFilename] = useState("");

  return (
    <Provider value={client}>
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

        <QueryTest />
      </div>
    </Provider>
  );
};
