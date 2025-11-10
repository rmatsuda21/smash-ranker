import { useEffect, useState } from "react";
import { Button, TextField } from "@radix-ui/themes";

import { CharacterSelect } from "@/components/top8/CharacterSelect/CharacterSelect";
import { CharacterAltRadio } from "@/components/top8/CharacterAltRadio/CharacterAltRadio";
import { usePlayerStore } from "@/store/playerStore";
import { PlayerInfo } from "@/types/top8/Result";

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
  const [alt, setAlt] = useState<PlayerInfo["alt"]>(selectedPlayer?.alt || 0);

  useEffect(() => {
    if (selectedPlayer) {
      setName(selectedPlayer.name);
      setCharacterId(selectedPlayer.characterId);
      setAlt(selectedPlayer.alt);
    } else {
      setName("");
      setCharacterId("");
      setAlt(0);
    }
  }, [selectedPlayer]);

  const handleSave = () => {
    if (!selectedPlayer) return;
    const player = {
      id: selectedPlayer.id,
      alt,
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
      <CharacterAltRadio
        characterId={characterId}
        selectedAlt={alt}
        onAltChange={setAlt}
        disabled={!selectedPlayer}
      />

      <Button onClick={handleSave}>Save</Button>
    </div>
  );
};
