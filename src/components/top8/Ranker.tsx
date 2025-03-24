import * as fabric from "fabric";
import { useRef, useState } from "react";
import cn from "classnames";

import { Canvas } from "@/components/top8/Canvas";
import { CanvasConfig } from "@/components/top8/CanvasConfig";
import { useFetchTop8 } from "@/hooks/top8/useFetchTop8";
import { Button, Heading, TextField } from "@radix-ui/themes";

import styles from "@/components/styles/Top8/Ranker.module.scss";
import { PlayerConfig } from "./PlayerConfig";

export const Ranker = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [selectedPlayer, setSelectedPlayer] =
    useState<fabric.FabricObject | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  const { top8, fetching, error } = useFetchTop8(
    "tournament/genesis-9-1/event/ultimate-singles"
  );

  const [filename, setFilename] = useState("");

  if (fetching) return <div>Loading...</div>;
  if (!top8 || error)
    return <div>{error ? <h1>{error.message}</h1> : <h1>Error</h1>}</div>;

  const onPlayerSelected = (obj: fabric.FabricObject | null) => {
    setSelectedPlayer(obj);
    setSelectedPlayerId(obj?.id || "");
  };

  return (
    <div className={styles.root}>
      <div
        className={cn(styles.playerConfig, {
          [styles.open]: Boolean(selectedPlayer),
        })}
      >
        {selectedPlayer && <PlayerConfig playerObj={selectedPlayer} />}
      </div>
      <div className={styles.content}>
        <h1>Ranker {selectedPlayerId}</h1>

        <div className={styles.canvasContainer}>
          <Canvas
            ref={canvasRef}
            setCanvas={setCanvas}
            onPlayerSelected={onPlayerSelected}
            result={top8}
          />
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
            // Find object with id "name" from selectedPlayer
            if (!selectedPlayer || !canvas) return;

            const objects = selectedPlayer._objects;

            const nameTxt = objects.find((obj) => obj.id === "name");
            if (!nameTxt) return;

            nameTxt.set({ text: "New Name" });

            canvas.renderAll();
          }}
        >
          Replace Name
        </Button>
      </div>
    </div>
  );
};
