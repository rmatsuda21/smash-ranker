import { RiDeleteBin6Fill } from "react-icons/ri";
import { FaPlus } from "react-icons/fa6";
import cn from "classnames";

import { CharacerData } from "@/types/top8/Player";
import { GameId } from "@/types/Game";
import { getCharImgUrl } from "@/utils/top8/getCharImgUrl";
import { GAMES } from "@/consts/games";

import styles from "./CharacterList.module.scss";

type Props = {
  characters?: CharacerData[];
  onCharactersChange: (characters: CharacerData[]) => void;
  selectedIndex: number;
  setSelectedIndex: (index: number) => void;
  disabled?: boolean;
  // The game a newly added character comes from.
  game: GameId;
};

export const CharacterList = ({
  characters,
  onCharactersChange,
  selectedIndex,
  setSelectedIndex,
  disabled = false,
  game,
}: Props) => {
  const addCharacter = () => {
    if (!characters) return;
    onCharactersChange([
      ...characters,
      { id: GAMES[game].defaultCharacterId, alt: 0 },
    ]);
    setSelectedIndex(characters.length);
  };

  const removeCharacter = (index: number) => {
    if (!characters || characters.length <= 1) return;
    onCharactersChange(characters.filter((_, i) => i !== index));
  };

  const handleSelect = (index: number) => {
    if (selectedIndex === index) {
      removeCharacter(index);
    } else {
      setSelectedIndex(index);
    }
  };

  return (
    <div className={styles.wrapper}>
      <button disabled={disabled} onClick={addCharacter}>
        <FaPlus />
      </button>
      {characters?.map((char, i) => (
        <button
          key={`${char.id}-${i}`}
          className={cn(styles.button, {
            [styles.selected]: selectedIndex === i,
            [styles.only]: characters?.length === 1,
          })}
          onClick={() => handleSelect(i)}
        >
          <img
            src={getCharImgUrl({
              characterId: char.id,
              alt: char.alt,
              type: "stock",
            })}
          />
          <div className={styles.delete}>
            <RiDeleteBin6Fill />
          </div>
        </button>
      ))}
    </div>
  );
};
