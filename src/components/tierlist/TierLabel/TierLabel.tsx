import { useRef, useState } from "react";
import cn from "classnames";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";

import { LabelFont, TierListLayout } from "@/types/tierlist/TierList";

import styles from "./TierLabel.module.scss";

type Props = {
  name: string;
  color: string;
  layout: TierListLayout;
  labelFont: LabelFont;
  extraStyle?: React.CSSProperties;
  onRename: (name: string) => void;
};

export const TierLabel = ({ name, color, layout, labelFont, extraStyle, onRename }: Props) => {
  const { _ } = useLingui();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(name);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    setEditValue(name);
    setIsEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const handleSubmit = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== name) {
      onRename(trimmed);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSubmit();
    if (e.key === "Escape") setIsEditing(false);
  };

  return (
    <div
      className={cn(styles.label, layout === "top" && styles.topLabel, layout === "fancy" && styles.fancyLabel)}
      style={{
        backgroundColor: color,
        fontFamily: labelFont.family,
        fontSize: labelFont.size,
        fontWeight: labelFont.weight,
        ...extraStyle,
      }}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          className={styles.input}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSubmit}
          onKeyDown={handleKeyDown}
          maxLength={30}
          autoFocus
        />
      ) : (
        <span className={styles.text} onClick={handleClick} title={_(msg`Click to rename`)}>
          {name}
        </span>
      )}
    </div>
  );
};
