import { useRef, useState } from "react";
import { Trans } from "@lingui/react/macro";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";

import { LabelFont, TitleAlign } from "@/types/tierlist/TierList";

import styles from "./TierListTitle.module.scss";

type Props = {
  title: string;
  labelFont: LabelFont;
  titleAlign: TitleAlign;
  onChangeTitle: (title: string) => void;
};

export const TierListTitle = ({ title, labelFont, titleAlign, onChangeTitle }: Props) => {
  const { _ } = useLingui();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    setEditValue(title);
    setIsEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const handleSubmit = () => {
    const trimmed = editValue.trim();
    if (trimmed !== title) {
      onChangeTitle(trimmed);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSubmit();
    if (e.key === "Escape") setIsEditing(false);
  };

  const alignToJustify = { left: "flex-start", center: "center", right: "flex-end" } as const;

  const fontStyle: React.CSSProperties = {
    fontFamily: labelFont.family,
    fontSize: labelFont.size * 1.5,
    fontWeight: labelFont.weight,
    justifyContent: alignToJustify[titleAlign],
  };

  if (isEditing) {
    return (
      <div className={styles.titleContainer} style={fontStyle}>
        <input
          ref={inputRef}
          className={styles.input}
          style={{ textAlign: titleAlign }}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSubmit}
          onKeyDown={handleKeyDown}
          placeholder={_(msg`Enter title`)}
          maxLength={100}
          autoFocus
        />
      </div>
    );
  }

  if (!title) {
    return (
      <div
        className={styles.placeholder}
        style={fontStyle}
        onClick={handleClick}
        data-export-ignore
      >
        <Trans>Click to add title</Trans>
      </div>
    );
  }

  return (
    <div className={styles.titleContainer} style={fontStyle} onClick={handleClick} title={_(msg`Click to edit title`)}>
      {title}
    </div>
  );
};
