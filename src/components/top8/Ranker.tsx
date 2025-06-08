import { useEffect, useState } from "react";
import cn from "classnames";

import { Canvas } from "@/components/top8/Canvas";
import { CanvasConfig } from "@/components/top8/CanvasConfig";
import { useFetchTop8 } from "@/hooks/top8/useFetchTop8";
import { Button, Heading, TextField } from "@radix-ui/themes";

import styles from "@/components/styles/Top8/Ranker.module.scss";
import { PlayerConfig } from "./PlayerConfig";
import { Graphic } from "@/js/top8/Graphic";
import { CanvasEvents } from "@/types/top8/Canvas";
import { Player } from "@/js/top8/Player";

export const Ranker = () => {
  const [graphic, setGraphic] = useState<Graphic | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  const { top8, fetching, error } = useFetchTop8(
    "tournament/genesis-9-1/event/ultimate-singles"
  );

  const onPlayerSelected: CanvasEvents["onPlayerSelected"] = (obj) => {
    if (!obj.selected[0].playerInfo) return;

    const player = graphic?.findPlayer(obj.selected[0].playerInfo?.id);
    if (player) setSelectedPlayer(player);
  };

  useEffect(() => {
    if (graphic) {
      graphic.setCanvasEvents({
        onPlayerSelected,
        onPlayerCleared: () => setSelectedPlayer(null),
      });
    }
  }, [graphic]);

  const [filename, setFilename] = useState("");

  if (fetching) return <div>Loading...</div>;
  if (!top8 || error)
    return <div>{error ? <h1>{error.message}</h1> : <h1>Error</h1>}</div>;

  return (
    <div className={styles.root}>
      <div
        className={cn(styles.playerConfig, {
          [styles.open]: true,
        })}
      >
        {selectedPlayer && graphic && (
          <PlayerConfig player={selectedPlayer} graphic={graphic} />
        )}
      </div>
      <div className={styles.content}>
        <h1>Ranker</h1>

        <div className={styles.canvasContainer}>
          <Canvas
            setGraphic={setGraphic}
            onPlayerSelected={onPlayerSelected}
            result={top8}
          />
        </div>

        <div>
          <Heading as="h2">Canvas Config</Heading>
          {graphic?.canvas && <CanvasConfig graphic={graphic} />}
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
            graphic?.downloadGraphic(filename || "ranker.png");
          }}
        >
          Download
        </Button>
        <Button
          onClick={() => {
            console.log(graphic?.canvas.toJSON());
          }}
        >
          See
        </Button>
        <Button
          onClick={() => {
            // TODO: Implement undo/redo
            console.log(graphic?.canvas.toJSON());
          }}
        >
          Undo
        </Button>
        {/* <Button
          onClick={() => {
            // Find object with id "name" from selectedPlayer
            if (!selectedPlayer || !graphic) return;

            const objects = selectedPlayer._objects;

            const nameTxt = objects.find((obj) => obj.id === "name");
            if (!nameTxt) return;

            nameTxt.set({ text: "New Name" });

            graphic?.canvas.renderAll();
          }}
        >
          Replace Name
        </Button> */}
      </div>
    </div>
  );
};
