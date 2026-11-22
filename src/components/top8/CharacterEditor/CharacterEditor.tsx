import { memo, useEffect, useMemo, useState } from "react";
import isEqual from "lodash/isEqual";

import { CharacterSelect } from "@/components/top8/CharacterEditor/CharacterSelect/CharacterSelect";
import { CharacterAltPicker } from "@/components/top8/CharacterEditor/CharacterAltPicker/CharacterAltPicker";
import { CharacterList } from "@/components/top8/CharacterEditor/CharacterList/CharacterList";
import { GameSwitch } from "@/components/shared/GameSwitch/GameSwitch";
import { RenderStyleSwitch } from "@/components/shared/RenderStyleSwitch/RenderStyleSwitch";
import { usePlayerStore } from "@/store/playerStore";
import { CharacerData } from "@/types/top8/Player";
import { useTournamentStore } from "@/store/tournamentStore";
import { withRenderStyle } from "@/utils/top8/renderStyle";

import styles from "./CharacterEditor.module.scss";

type Props = {
  className?: string;
  characters: CharacerData[];
  onCharactersChange: (characters: CharacerData[]) => void;
  disabled?: boolean;
};

const CharacterEditorComponent = ({
  characters,
  onCharactersChange: emitCharacters,
  disabled = false,
}: Props) => {
  const game = useTournamentStore((state) => state.game);
  const tournamentDispatch = useTournamentStore((state) => state.dispatch);
  const renderStyle = usePlayerStore((state) => state.renderStyle);
  const playerDispatch = usePlayerStore((state) => state.dispatch);
  const [characterIndex, setCharacterIndex] = useState(0);
  // The parent shows these characters before the store has seen them, so
  // they leave here already carrying the render style, as the store would
  // stamp them. Without it the costume picker falls back to the standard
  // list for a moment after every change.
  const onCharactersChange = (next: CharacerData[]) =>
    emitCharacters(next.map((c) => withRenderStyle(c, renderStyle)));
  const selectedCharacter = useMemo(
    () => characters[characterIndex],
    [characters, characterIndex],
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
        i === characterIndex ? { id: characterId, alt: 0 } : char,
      ),
    );
  };

  const onAltChange = (alt: CharacerData["alt"]) => {
    if (!selectedCharacter) return;

    onCharactersChange(
      characters.map((char, i) =>
        i === characterIndex ? { id: selectedCharacter.id, alt } : char,
      ),
    );
  };

  return (
    <div className={styles.wrapper}>
      <GameSwitch
        value={game}
        onChange={(value) =>
          tournamentDispatch({ type: "SET_GAME", payload: value })
        }
      />
      <RenderStyleSwitch
        game={game}
        value={renderStyle}
        onChange={(value) =>
          playerDispatch({ type: "SET_RENDER_STYLE", payload: value })
        }
      />
      <CharacterList
        characters={characters}
        onCharactersChange={onCharactersChange}
        selectedIndex={characterIndex}
        setSelectedIndex={setCharacterIndex}
        disabled={disabled}
        game={game}
      />
      <CharacterSelect
        selectedCharacter={selectedCharacter}
        onValueChange={onCharacterChange}
        disabled={disabled}
        game={game}
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
  },
);
