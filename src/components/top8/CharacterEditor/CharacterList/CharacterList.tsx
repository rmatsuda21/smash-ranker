import cn from "classnames";

import { CharacerData } from "@/types/top8/PlayerTypes";
import { getCharImgUrl } from "@/utils/top8/getCharImgUrl";

import styles from "./CharacterList.module.scss";

type Props = {
  characters?: CharacerData[];
  onCharactersChange: (characters: CharacerData[]) => void;
  selectedIndex: number;
  setSelectedIndex: (index: number) => void;
  disabled?: boolean;
};

export const CharacterList = ({
  characters,
  onCharactersChange,
  selectedIndex,
  setSelectedIndex,
  disabled = false,
}: Props) => {
  const addCharacter = () => {
    if (!characters) return;
    onCharactersChange([...characters, { id: "1293", alt: 0 }]);
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
        </button>
      ))}
      <button disabled={disabled} onClick={addCharacter}>
        +
      </button>
    </div>
  );
};
