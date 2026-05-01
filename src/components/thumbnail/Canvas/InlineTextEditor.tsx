import { useEffect, useMemo, useRef, useState } from "react";

import { TextElement } from "@/types/thumbnail/ThumbnailDesign";
import { computeAutoFitFontSize } from "@/utils/thumbnail/measureText";

import styles from "./InlineTextEditor.module.scss";

export type WorldTransform = {
  x: number;
  y: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
};

type Props = {
  element: TextElement;
  worldTransform: WorldTransform;
  onCommit: (text: string) => void;
  onCancel: () => void;
};

export const InlineTextEditor = ({
  element,
  worldTransform,
  onCommit,
  onCancel,
}: Props) => {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = useState(element.text);

  useEffect(() => {
    const ta = ref.current;
    if (!ta) return;
    ta.focus();
    ta.select();
  }, []);

  const effectiveFontSize = useMemo(() => {
    if (!element.autoFit) return element.fontSize;
    return computeAutoFitFontSize({ ...element, text });
  }, [element, text]);

  const commit = () => {
    onCommit(text);
  };

  const isBold = element.fontStyle.includes("bold");
  const isItalic = element.fontStyle.includes("italic");

  const fontStyles: React.CSSProperties = {
    fontFamily: element.fontFamily,
    fontSize: `${effectiveFontSize}px`,
    fontWeight: isBold ? "bold" : "normal",
    fontStyle: isItalic ? "italic" : "normal",
    color: element.fill,
    letterSpacing: element.letterSpacing
      ? `${element.letterSpacing}px`
      : "0",
    lineHeight: element.lineHeight ?? 1,
    textAlign: element.align,
  };

  // Use the WORLD (canvas-space) transform for positioning. Element coords are
  // local to the parent group; only world coords match the canvas overlay.
  const transform =
    `rotate(${worldTransform.rotation}deg) ` +
    `scale(${worldTransform.scaleX}, ${worldTransform.scaleY})`;

  const verticalAlign =
    element.verticalAlign ?? (element.autoFit ? "middle" : "top");
  const flexAlign =
    verticalAlign === "top"
      ? "flex-start"
      : verticalAlign === "bottom"
        ? "flex-end"
        : "center";

  return (
    <div
      className={styles.wrapper}
      style={{
        left: `${worldTransform.x}px`,
        top: `${worldTransform.y}px`,
        width: `${element.width}px`,
        height: `${element.height}px`,
        transform,
        transformOrigin: "top left",
        opacity: element.opacity,
        alignItems: flexAlign,
      }}
    >
      <textarea
        ref={ref}
        value={text}
        onChange={(e) => setText(e.target.value)}
        className={styles.editor}
        style={fontStyles}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            commit();
          } else if (e.key === "Escape") {
            e.preventDefault();
            onCancel();
          }
        }}
      />
    </div>
  );
};
