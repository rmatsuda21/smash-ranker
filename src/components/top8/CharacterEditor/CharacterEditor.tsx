import { memo, useEffect, useMemo, useState } from "react";
import isEqual from "lodash/isEqual";

import { CharacterSelect } from "@/components/top8/CharacterEditor/CharacterSelect/CharacterSelect";
import { CharacterAltPicker } from "@/components/top8/CharacterEditor/CharacterAltPicker/CharacterAltPicker";
import { CharacterList } from "@/components/top8/CharacterEditor/CharacterList/CharacterList";
import { CharacerData } from "@/types/top8/Player";

import styles from "./CharacterEditor.module.scss";

type Props = {
  className?: string;
  characters: CharacerData[];
  onCharactersChange: (characters: CharacerData[]) => void;
  disabled?: boolean;
};

const CharacterEditorComponent = ({
  characters,
  onCharactersChange,
  disabled = false,
}: Props) => {
  const [characterIndex, setCharacterIndex] = useState(0);
  const selectedCharacter = useMemo(
    () => characters[characterIndex],
    [characters, characterIndex]
  );

  useEffect(() => {
    if (characterIndex >= characters.length) {
      setCharacterIndex(0);
    }
  }, [characters, characterIndex]);

  const onCharacterChange = (characterId: string) => {
    if (characters.length === 0) {
      onCharactersChange([{ id: characterId, alt: 0 }]);
      return;
    }

    onCharactersChange(
      characters.map((char, i) =>
        i === characterIndex ? { id: characterId, alt: 0 } : char
      )
    );
  };

  const onAltChange = (alt: CharacerData["alt"]) => {
    if (!selectedCharacter) return;

    onCharactersChange(
      characters.map((char, i) =>
        i === characterIndex ? { id: selectedCharacter.id, alt } : char
      )
    );
  };

  return (
    <div className={styles.wrapper}>
      <CharacterList
        characters={characters}
        onCharactersChange={onCharactersChange}
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
    </div>
  );
};

export const CharacterEditor = memo(
  CharacterEditorComponent,
  (prevProps, nextProps) => {
    return (
      isEqual(prevProps.characters, nextProps.characters) &&
      prevProps.disabled === nextProps.disabled &&
      prevProps.onCharactersChange === nextProps.onCharactersChange &&
      prevProps.className === nextProps.className
    );
  }
);
