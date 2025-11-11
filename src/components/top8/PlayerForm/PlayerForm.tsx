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

  const [gamerTag, setGamerTag] = useState(selectedPlayer?.gamerTag || "");
  const [prefix, setPrefix] = useState(selectedPlayer?.prefix || "");
  const [characterId, setCharacterId] = useState(
    selectedPlayer?.characterId || ""
  );
  const [alt, setAlt] = useState<PlayerInfo["alt"]>(selectedPlayer?.alt || 0);

  useEffect(() => {
    if (selectedPlayer) {
      setGamerTag(selectedPlayer.gamerTag);
      setPrefix(selectedPlayer.prefix || "");
      setCharacterId(selectedPlayer.characterId);
      setAlt(selectedPlayer.alt);
    } else {
      setGamerTag("");
      setPrefix("");
      setCharacterId("");
      setAlt(0);
    }
  }, [selectedPlayer]);

  const handleSave = () => {
    if (!selectedPlayer) return;
    const player = {
      ...selectedPlayer,
      alt,
      gamerTag,
      prefix,
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
        value={prefix}
        onChange={(e) => setPrefix(e.target.value)}
        placeholder="Prefix"
        disabled={!selectedPlayer}
      />
      <TextField.Root
        type="text"
        value={gamerTag}
        onChange={(e) => setGamerTag(e.target.value)}
        placeholder="Gamer Tag"
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
