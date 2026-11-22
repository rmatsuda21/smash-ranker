import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLingui } from "@lingui/react/macro";

import { getCharacter } from "@/utils/top8/characterCatalog";
import { getTierCharacterImageUrl } from "@/utils/tierlist/characterImage";
import { getCharacterDisplayName } from "@/utils/top8/getCharacterName";
import { useTierListStore } from "@/store/tierListStore";
import { ImageDisplayMode } from "@/types/tierlist/TierList";
import { useTopLayer } from "@/hooks/useTopLayer";
import { TooltipButton } from "@/components/shared/Tooltip/TooltipButton";

import styles from "./AltPicker.module.scss";

// Gap kept between the picker and the edge of the screen.
const EDGE_MARGIN = 8;

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
  const { t, i18n } = useLingui();
  const dispatch = useTierListStore((s) => s.dispatch);
  const character = useTierListStore((s) => s.characters[instanceId]);
  const ref = useRef<HTMLDivElement>(null);

  const charData = character ? getCharacter(character.characterId) : undefined;
  const altCount = charData?.alts ?? 8;

  // "manual", not "auto": this opens on right-click, and native light dismiss
  // would close it again on the release of that same click.
  useTopLayer(ref);

  // Opens at the pointer at its full size; when that would run off the
  // screen it is moved back in rather than squeezed.
  const [placement, setPlacement] = useState(position);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    const clamp = (value: number, size: number, viewport: number) =>
      Math.max(EDGE_MARGIN, Math.min(value, viewport - size - EDGE_MARGIN));
    setPlacement({
      x: clamp(position.x, width, window.innerWidth),
      y: clamp(position.y, height, window.innerHeight),
    });
  }, [position, altCount]);

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
      popover="manual"
      className={styles.picker}
      style={{ top: placement.y, left: placement.x }}
    >
      <div className={styles.title}>
        {getCharacterDisplayName(charData.id, i18n.locale)}
      </div>
      <div className={styles.alts}>
        {Array.from({ length: altCount }, (_, i) => (
          <TooltipButton
            key={i}
            className={styles.altButton}
            data-active={character.alt === i || undefined}
            onClick={() => {
              dispatch({ type: "SET_CHARACTER_ALT", instanceId, alt: i });
              onClose();
            }}
            tooltip={charData.altNames?.[i] ?? t`Alt ${i}`}
            tooltipIsLabel
          >
            <img
              src={getTierCharacterImageUrl(
                character.characterId,
                i,
                imageMode,
              )}
              alt={charData.altNames?.[i] ?? t`Alt ${i}`}
              width={40}
              height={40}
              draggable={false}
            />
          </TooltipButton>
        ))}
      </div>
    </div>,
    document.body,
  );
};
