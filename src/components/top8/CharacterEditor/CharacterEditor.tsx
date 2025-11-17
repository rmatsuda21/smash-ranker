import { memo, useEffect, useMemo, useState } from "react";

import { CharacterSelect } from "@/components/top8/CharacterEditor/CharacterSelect/CharacterSelect";
import { CharacterAltPicker } from "@/components/top8/CharacterEditor/CharacterAltPicker/CharacterAltPicker";
import { CharacterList } from "@/components/top8/CharacterEditor/CharacterList/CharacterList";
import { CharacerData, PlayerInfo } from "@/types/top8/Player";
import { isEqual } from "lodash";

type Props = {
  className?: string;
  player?: PlayerInfo;
  updatePlayer: (player: PlayerInfo) => void;
  disabled?: boolean;
};

const CharacterEditorComponent = ({
  player,
  updatePlayer,
  disabled = false,
}: Props) => {
  const [characterIndex, setCharacterIndex] = useState(0);
  const selectedCharacter = useMemo(
    () => player?.characters[characterIndex],
    [player?.characters]
  );

  useEffect(() => {
    setCharacterIndex(0);
  }, [player?.id]);

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

export const CharacterEditor = memo(
  CharacterEditorComponent,
  (prevProps, nextProps) => {
    return (
      isEqual(prevProps.player?.characters, nextProps.player?.characters) &&
      prevProps.disabled === nextProps.disabled &&
      prevProps.updatePlayer === nextProps.updatePlayer &&
      prevProps.className === nextProps.className
    );
  }
);
