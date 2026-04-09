import { getCharImgUrl } from "@/utils/top8/getCharImgUrl";
import { ImageDisplayMode, TierCharacter } from "@/types/tierlist/TierList";

import styles from "./CharacterImage.module.scss";

type Props = {
  character: TierCharacter;
  imageMode: ImageDisplayMode;
  size?: number;
};

export const CharacterImage = ({ character, imageMode, size = 48 }: Props) => {
  const url = getCharImgUrl({
    characterId: character.characterId,
    alt: character.alt,
    type: imageMode,
  });

  return (
    <img
      className={styles.image}
      src={url}
      alt={character.characterId}
      width={size}
      height={size}
      draggable={false}
      loading="lazy"
    />
  );
};
