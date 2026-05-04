import { useRef, useState } from "react";
import {
  FaArrowDown,
  FaArrowUp,
  FaGear,
  FaPalette,
  FaTrash,
} from "react-icons/fa6";
import { Trans } from "@lingui/react/macro";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";

import { ColorInput } from "@/components/shared/ColorInput/ColorInput";
import { Popover } from "@/components/shared/Popover/Popover";
import { useTierListStore } from "@/store/tierListStore";

import styles from "./TierSettings.module.scss";

type Props = {
  tierId: string;
  tierIndex: number;
  tierCount: number;
  color: string;
};

export const TierSettings = ({
  tierId,
  tierIndex,
  tierCount,
  color,
}: Props) => {
  const { _ } = useLingui();
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dispatch = useTierListStore((s) => s.dispatch);

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
  };

  const handleDelete = () => {
    dispatch({ type: "REMOVE_TIER", tierId });
    setIsOpen(false);
  };

  const handleMoveUp = () => {
    dispatch({
      type: "MOVE_TIER",
      fromIndex: tierIndex,
      toIndex: tierIndex - 1,
    });
  };

  const handleMoveDown = () => {
    dispatch({
      type: "MOVE_TIER",
      fromIndex: tierIndex,
      toIndex: tierIndex + 1,
    });
  };

  return (
    <>
      <button
        ref={buttonRef}
        className={styles.gearButton}
        onClick={handleToggle}
        aria-label={_(msg`Tier settings`)}
      >
        <FaGear size={14} />
      </button>

      <Popover
        anchorRef={buttonRef}
        open={isOpen}
        onClose={() => setIsOpen(false)}
        placement="bottom-start"
        offset={4}
        minWidth={168}
        className={styles.popover}
      >
        <div className={styles.colorRow}>
          <FaPalette size={12} />
          <span>
            <Trans>Color</Trans>
          </span>
          <ColorInput
            color={color}
            onChange={(c) =>
              dispatch({ type: "RECOLOR_TIER", tierId, color: c })
            }
            className={styles.colorInput}
          />
        </div>
        <button
          className={styles.menuItem}
          onClick={handleMoveUp}
          disabled={tierIndex === 0}
        >
          <FaArrowUp size={12} /> <Trans>Move Up</Trans>
        </button>
        <button
          className={styles.menuItem}
          onClick={handleMoveDown}
          disabled={tierIndex === tierCount - 1}
        >
          <FaArrowDown size={12} /> <Trans>Move Down</Trans>
        </button>
        <button
          className={styles.menuItem}
          onClick={handleDelete}
          data-danger
        >
          <FaTrash size={12} /> <Trans>Delete</Trans>
        </button>
      </Popover>
    </>
  );
};
