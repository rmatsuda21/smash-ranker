import { useEffect, useState } from "react";
import { Button, TextField } from "@radix-ui/themes";

import { PlayerInfo } from "@/types/top8/Result";
import { CharacterSelect } from "@/components/top8/CharacterSelect/CharacterSelect";

type Props = {
  selectedPlayer: PlayerInfo | null;
  updatePlayer: (index: number, player: PlayerInfo) => void;
  index?: number;
  className?: string;
};

export const PlayerForm = ({
  selectedPlayer,
  index,
  updatePlayer,
  className,
}: Props) => {
  const [name, setName] = useState(selectedPlayer?.name || "");
  const [characterId, setCharacterId] = useState(
    selectedPlayer?.characterId || ""
  );

  useEffect(() => {
    if (selectedPlayer) {
      setName(selectedPlayer.name);
      setCharacterId(selectedPlayer.characterId);
    } else {
      setName("");
      setCharacterId("");
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
        selectedCharacterId={characterId}
        onValueChange={setCharacterId}
        disabled={!selectedPlayer}
      />
      <Button
        onClick={() => {
          if (!selectedPlayer || index === undefined) return;
          updatePlayer(index, {
            id: selectedPlayer.id,
            alt: selectedPlayer.alt,
            name,
            characterId: characterId,
          });
        }}
      >
        Save
      </Button>
    </div>
  );
};
