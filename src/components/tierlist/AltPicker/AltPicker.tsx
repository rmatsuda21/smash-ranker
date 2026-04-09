import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

import { characters } from "@/consts/top8/ultCharacters.json";
import { getCharImgUrl } from "@/utils/top8/getCharImgUrl";
import { useTierListStore } from "@/store/tierListStore";
import { ImageDisplayMode } from "@/types/tierlist/TierList";

import styles from "./AltPicker.module.scss";

type Props = {
  instanceId: string;
  position: { x: number; y: number };
  imageMode: ImageDisplayMode;
  onClose: () => void;
};

export const AltPicker = ({
  instanceId,
  position,
  imageMode,
  onClose,
}: Props) => {
  const dispatch = useTierListStore((s) => s.dispatch);
  const character = useTierListStore((s) => s.characters[instanceId]);
  const ref = useRef<HTMLDivElement>(null);

  const charData = characters.find((c) => c.id === character?.characterId);
  const altCount = charData?.alts ?? 8;

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  if (!character || !charData) return null;

  return createPortal(
    <div
      ref={ref}
      className={styles.picker}
      style={{ top: position.y, left: position.x }}
    >
      <div className={styles.title}>{charData.name}</div>
      <div className={styles.alts}>
        {Array.from({ length: altCount }, (_, i) => (
          <button
            key={i}
            className={styles.altButton}
            data-active={character.alt === i || undefined}
            onClick={() => {
              dispatch({ type: "SET_CHARACTER_ALT", instanceId, alt: i });
              onClose();
            }}
            title={charData.altNames?.[i] ?? `Alt ${i}`}
          >
            <img
              src={getCharImgUrl({
                characterId: character.characterId,
                alt: i as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7,
                type: imageMode,
              })}
              alt={charData.altNames?.[i] ?? `Alt ${i}`}
              width={40}
              height={40}
              draggable={false}
            />
          </button>
        ))}
      </div>
    </div>,
    document.body
  );
};
