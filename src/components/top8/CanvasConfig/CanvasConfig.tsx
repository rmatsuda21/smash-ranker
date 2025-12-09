import { Button } from "@radix-ui/themes";
import { useState } from "react";

import { FontSelect } from "@/components/top8/CanvasConfig/FontSelect/FontSelect";
import { useCanvasStore } from "@/store/canvasStore";
import { usePlayerStore } from "@/store/playerStore";
import { useTournamentStore } from "@/store/tournamentStore";
import { Input } from "@/components/shared/Input/Input";

type Props = {
  className?: string;
};

export const CanvasConfig = ({ className }: Props) => {
  const [filename, setFilename] = useState("");
  const stageRef = useCanvasStore((state) => state.stageRef);
  const dispatch = usePlayerStore((state) => state.dispatch);
  const tournamentDispatch = useTournamentStore((state) => state.dispatch);

  return (
    <div className={className}>
      <Input
        label="Filename"
        id="filename"
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
          dispatch({ type: "CLEAR_SELECTED_PLAYER" });
          tournamentDispatch({ type: "CLEAR_SELECTED_ELEMENT" });

          const downloadImage = () => {
            const dataURL = stageRef.toDataURL({
              pixelRatio: 2,
            });

            const link = document.createElement("a");
            link.download = filename || "ranker.png";
            link.href = dataURL;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          };

          setTimeout(downloadImage, 0);
        }}
      >
        Download
      </Button>
    </div>
  );
};
