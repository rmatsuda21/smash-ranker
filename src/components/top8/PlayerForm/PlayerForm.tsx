import { useEffect, useState } from "react";
import { Button, TextField } from "@radix-ui/themes";

import { PlayerInfo } from "@/types/top8/Result";
import { CharacterSelect } from "@/components/top8/CharacterSelect/CharacterSelect";

type Props = {
  selectedPlayer: PlayerInfo | null;
  updatePlayer: (player: PlayerInfo) => void;
  className?: string;
};

export const PlayerForm = ({
  selectedPlayer,
  updatePlayer,
  className,
}: Props) => {
  const [name, setName] = useState(selectedPlayer?.name || "");
  const [character, setCharacter] = useState(selectedPlayer?.character || "");

  useEffect(() => {
    if (selectedPlayer) {
      setName(selectedPlayer.name);
      setCharacter(selectedPlayer.character);
    } else {
      setName("");
      setCharacter("");
    }
  }, [selectedPlayer]);

  return (
    <div className={className}>
      <TextField.Root
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Player Name"
        disabled={!selectedPlayer}
      />
      <CharacterSelect
        characterId={character}
        onValueChange={setCharacter}
        disabled={!selectedPlayer}
      />
      <Button
        onClick={() => {
          if (!selectedPlayer) return;
          updatePlayer({
            ...selectedPlayer,
            name,
            character,
          });
        }}
      >
        Save
      </Button>
    </div>
  );
};
