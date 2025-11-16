import { useState } from "react";

import { CharacterSelect } from "@/components/top8/CharacterEditor/CharacterSelect/CharacterSelect";
import { CharacterAltPicker } from "@/components/top8/CharacterEditor/CharacterAltPicker/CharacterAltPicker";
import { CharacterList } from "@/components/top8/CharacterEditor/CharacterList/CharacterList";
import { CharacerData, PlayerInfo } from "@/types/top8/Player";

type Props = {
  className?: string;
  player?: PlayerInfo;
  updatePlayer: (player: PlayerInfo) => void;
  disabled?: boolean;
};

export const CharacterEditor = ({
  player,
  updatePlayer,
  disabled = false,
}: Props) => {
  const [characterIndex, setCharacterIndex] = useState(0);
  const selectedCharacter = player?.characters[characterIndex];

  const onCharacterChange = (characterId: string) => {
    if (!player) return;
    updatePlayer({
      ...player,
      characters: player.characters.map((char, i) =>
        i === characterIndex ? { id: characterId, alt: 0 } : char
      ),
    });
  };

  const onAltChange = (alt: CharacerData["alt"]) => {
    if (!player || !selectedCharacter) return;
    updatePlayer({
      ...player,
      characters: player.characters.map((char, i) =>
        i === characterIndex ? { id: selectedCharacter.id, alt } : char
      ),
    });
  };

  return (
    <>
      <CharacterList
        player={player}
        updatePlayer={updatePlayer}
        selectedIndex={characterIndex}
        setSelectedIndex={setCharacterIndex}
        disabled={disabled}
      />
      <CharacterSelect
        selectedCharacter={selectedCharacter}
        onValueChange={onCharacterChange}
        disabled={disabled}
      />
      <CharacterAltPicker
        selectedCharacter={selectedCharacter}
        onAltChange={onAltChange}
        disabled={disabled}
      />
    </>
  );
};
