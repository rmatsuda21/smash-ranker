import { getTierCharacterImageUrl } from "@/utils/tierlist/characterImage";
import { ImageDisplayMode, TierCharacter } from "@/types/tierlist/TierList";

import styles from "./CharacterImage.module.scss";

type Props = {
  character: TierCharacter;
  imageMode: ImageDisplayMode;
  size?: number;
};

export const CharacterImage = ({ character, imageMode, size = 48 }: Props) => {
  const url = getTierCharacterImageUrl(
    character.characterId,
    character.alt,
    imageMode,
  );

  return (
    <img
      className={styles.image}
      // CORS-enabled so the export can draw this element onto a canvas
      // without tainting it. Must come before `src`.
      crossOrigin="anonymous"
      src={url}
      alt={character.characterId}
      width={size}
      height={size}
      draggable={false}
      loading="lazy"
    />
  );
};
