import { useEffect, useState } from "react";
import { Button, TextField } from "@radix-ui/themes";

import { CharacterSelect } from "@/components/top8/CharacterSelect/CharacterSelect";
import { usePlayerStore } from "@/store/playerStore";

type Props = {
  className?: string;
};

export const PlayerForm = ({ className }: Props) => {
  const { players, selectedPlayerIndex, dispatch } = usePlayerStore();
  const selectedPlayer = players[selectedPlayerIndex];

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

  const handleSave = () => {
    if (!selectedPlayer) return;
    const player = {
      id: selectedPlayer.id,
      alt: selectedPlayer.alt,
      name,
      characterId,
    };

    dispatch({
      type: "UPDATE_PLAYER",
      payload: { index: selectedPlayerIndex, player },
    });
  };

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
      <Button onClick={handleSave}>Save</Button>
    </div>
  );
};
