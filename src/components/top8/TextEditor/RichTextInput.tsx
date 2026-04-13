import { useRef, useMemo, useEffect, useLayoutEffect, useState } from "react";
import cn from "classnames";

import {
  DesignPlaceholder,
  PlaceholderLabel,
} from "@/consts/top8/placeholders";

import styles from "./RichTextInput.module.scss";

// --- Types ---

type Segment =
  | { type: "text"; value: string }
  | { type: "placeholder"; value: string };

// --- Segment parsing ---

const PLACEHOLDER_REGEX = /<[^>]+>/g;

function parseSegments(value: string): Segment[] {
  const segments: Segment[] = [];
  const regex = new RegExp(PLACEHOLDER_REGEX);
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(value)) !== null) {
    segments.push({ type: "text", value: value.slice(lastIndex, match.index) });
    segments.push({ type: "placeholder", value: match[0] });
    lastIndex = regex.lastIndex;
  }

  segments.push({ type: "text", value: value.slice(lastIndex) });
  return segments;
}

function serialize(segments: Segment[]): string {
  return segments.map((s) => s.value).join("");
}

// --- Text measurement via Canvas (no DOM element needed) ---

let measureCtx: CanvasRenderingContext2D | null = null;

function getTextWidth(text: string, font: string): number {
  if (!measureCtx) {
    measureCtx = document.createElement("canvas").getContext("2d");
  }
  if (!measureCtx) return text.length * 8;
  measureCtx.font = font;
  return Math.ceil(measureCtx.measureText(text).width);
}

function getFontFromElement(el: HTMLElement): string {
  const s = getComputedStyle(el);
  return s.font || `${s.fontWeight} ${s.fontSize} ${s.fontFamily}`;
}

// --- TextSegment ---

type TextSegmentProps = {
  value: string;
  index: number;
  isSole: boolean;
  placeholder: string;
  inputRefs: { current: (HTMLInputElement | null)[] };
  focusedIndexRef: { current: number };
  cursorRef: { current: number };
  onChange: (text: string) => void;
  onBackspaceAtStart: () => void;
  onDeleteAtEnd: () => void;
  onArrowLeft: () => void;
  onArrowRight: () => void;
};

const TextSegment = ({
  value,
  index,
  isSole,
  placeholder,
  inputRefs,
  focusedIndexRef,
  cursorRef,
  onChange,
  onBackspaceAtStart,
  onDeleteAtEnd,
  onArrowLeft,
  onArrowRight,
}: TextSegmentProps) => {
  const localRef = useRef<HTMLInputElement>(null);
  const spanRef = useRef<HTMLSpanElement>(null);
  const fontRef = useRef("");

  // Imperatively set width — no state, no extra re-render
  useLayoutEffect(() => {
    if (isSole || !spanRef.current) return;
    if (!fontRef.current && localRef.current) {
      fontRef.current = getFontFromElement(localRef.current);
    }
    const w =
      value && fontRef.current
        ? getTextWidth(value, fontRef.current) + 8
        : 6;
    spanRef.current.style.flexBasis = `${w}px`;
  }, [value, isSole]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const start = input.selectionStart ?? 0;
    const end = input.selectionEnd ?? 0;
    const hasSelection = start !== end;

    if (e.key === "Backspace" && start === 0 && !hasSelection) {
      e.preventDefault();
      onBackspaceAtStart();
    } else if (e.key === "Delete" && start === value.length && !hasSelection) {
      e.preventDefault();
      onDeleteAtEnd();
    } else if (e.key === "ArrowLeft" && start === 0 && !hasSelection) {
      e.preventDefault();
      onArrowLeft();
    } else if (
      e.key === "ArrowRight" &&
      start === value.length &&
      !hasSelection
    ) {
      e.preventDefault();
      onArrowRight();
    }
  };

  return (
    <span
      ref={spanRef}
      className={cn(styles.textSegment, { [styles.sole]: isSole })}
    >
      <input
        ref={(el) => {
          inputRefs.current[index] = el;
          localRef.current = el;
        }}
        type="text"
        className={styles.textInput}
        value={value}
        placeholder={isSole ? placeholder : undefined}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => {
          focusedIndexRef.current = index;
        }}
        onSelect={(e) => {
          cursorRef.current =
            (e.target as HTMLInputElement).selectionStart ?? 0;
        }}
        onKeyDown={handleKeyDown}
      />
    </span>
  );
};

// --- PillSegment ---

type PillSegmentProps = {
  value: string;
  onDelete: () => void;
};

const PillSegment = ({ value, onDelete }: PillSegmentProps) => {
  const label = PlaceholderLabel.get(value as DesignPlaceholder) || value;

  return (
    <button
      type="button"
      className={styles.pill}
      onClick={onDelete}
      onMouseDown={(e) => e.preventDefault()}
    >
      {label}
      <span className={styles.removeIcon}>×</span>
    </button>
  );
};

// --- RichTextInput ---

type Props = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
};

export const RichTextInput = ({
  value: propValue,
  onChange,
  className,
  placeholder = "Enter text...",
}: Props) => {
  // Local state for instant re-renders (prop updates are debounced by parent)
  const [localValue, setLocalValue] = useState(propValue);

  // Sync from prop when it changes externally (undo/redo, load tournament)
  const lastPropRef = useRef(propValue);
  if (propValue !== lastPropRef.current) {
    lastPropRef.current = propValue;
    if (propValue !== localValue) {
      setLocalValue(propValue);
    }
  }

  const updateValue = (newVal: string) => {
    setLocalValue(newVal);
    onChange(newVal);
  };

  const segments = useMemo(() => parseSegments(localValue), [localValue]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const pendingFocusRef = useRef<{ index: number; cursor: number } | null>(
    null
  );
  const focusedIndexRef = useRef(0);
  const cursorRef = useRef(0);

  const isSingleTextSegment = segments.length === 1;

  const textCount = useMemo(
    () => segments.filter((s) => s.type === "text").length,
    [segments]
  );

  // Apply pending focus after render
  useEffect(() => {
    const pending = pendingFocusRef.current;
    if (pending) {
      pendingFocusRef.current = null;
      const input = inputRefs.current[pending.index];
      if (input) {
        input.focus();
        input.setSelectionRange(pending.cursor, pending.cursor);
      }
    }
  });

  // Trim refs array when text count decreases
  useEffect(() => {
    inputRefs.current.length = textCount;
  }, [textCount]);

  // Find segment array index for a given text input index
  const getSegIndex = (textInputIndex: number): number => {
    let count = 0;
    for (let i = 0; i < segments.length; i++) {
      if (segments[i].type === "text") {
        if (count === textInputIndex) return i;
        count++;
      }
    }
    return -1;
  };

  const handleTextChange = (segIndex: number, newText: string) => {
    const newSegments = segments.map((seg, i) =>
      i === segIndex ? { ...seg, value: newText } : seg
    );
    updateValue(serialize(newSegments));
  };

  const handleDeletePill = (segIndex: number) => {
    const prevText = segments[segIndex - 1];
    const nextText = segments[segIndex + 1];
    if (!prevText || !nextText) return;

    const cursorPos = prevText.value.length;
    const mergedText = prevText.value + nextText.value;

    const newSegments = [
      ...segments.slice(0, segIndex - 1),
      { type: "text" as const, value: mergedText },
      ...segments.slice(segIndex + 2),
    ];

    updateValue(serialize(newSegments));

    // Find text input index for the merged segment
    let textIndex = 0;
    for (let i = 0; i < segIndex - 1; i++) {
      if (segments[i].type === "text") textIndex++;
    }
    pendingFocusRef.current = { index: textIndex, cursor: cursorPos };
  };

  const handleBackspaceAtStart = (textInputIndex: number) => {
    const segIndex = getSegIndex(textInputIndex);
    if (segIndex < 2) return;

    const prevPill = segments[segIndex - 1];
    if (prevPill.type !== "placeholder") return;

    const prevText = segments[segIndex - 2];
    const cursorPos = prevText.value.length;
    const mergedText = prevText.value + segments[segIndex].value;

    const newSegments = [
      ...segments.slice(0, segIndex - 2),
      { type: "text" as const, value: mergedText },
      ...segments.slice(segIndex + 1),
    ];

    updateValue(serialize(newSegments));
    pendingFocusRef.current = {
      index: textInputIndex - 1,
      cursor: cursorPos,
    };
  };

  const handleDeleteAtEnd = (textInputIndex: number) => {
    const segIndex = getSegIndex(textInputIndex);
    if (segIndex === -1 || segIndex + 2 >= segments.length) return;

    const nextPill = segments[segIndex + 1];
    if (nextPill.type !== "placeholder") return;

    const cursorPos = segments[segIndex].value.length;
    const nextText = segments[segIndex + 2];
    const mergedText = segments[segIndex].value + nextText.value;

    const newSegments = [
      ...segments.slice(0, segIndex),
      { type: "text" as const, value: mergedText },
      ...segments.slice(segIndex + 3),
    ];

    updateValue(serialize(newSegments));
    pendingFocusRef.current = { index: textInputIndex, cursor: cursorPos };
  };

  const handleArrowLeft = (textInputIndex: number) => {
    if (textInputIndex > 0) {
      const prev = inputRefs.current[textInputIndex - 1];
      if (prev) {
        prev.focus();
        const len = prev.value.length;
        prev.setSelectionRange(len, len);
      }
    }
  };

  const handleArrowRight = (textInputIndex: number) => {
    if (textInputIndex < textCount - 1) {
      const next = inputRefs.current[textInputIndex + 1];
      if (next) {
        next.focus();
        next.setSelectionRange(0, 0);
      }
    }
  };

  const handleInsertChip = (chipValue: DesignPlaceholder) => {
    const textInputIndex = Math.min(
      focusedIndexRef.current,
      textCount - 1
    );
    const segIndex = getSegIndex(textInputIndex);
    if (segIndex === -1) return;

    const seg = segments[segIndex];
    const cursor = Math.min(cursorRef.current, seg.value.length);
    const textBefore = seg.value.slice(0, cursor);
    const textAfter = seg.value.slice(cursor);

    const newSegments = [
      ...segments.slice(0, segIndex),
      { type: "text" as const, value: textBefore },
      { type: "placeholder" as const, value: chipValue },
      { type: "text" as const, value: textAfter },
      ...segments.slice(segIndex + 1),
    ];

    updateValue(serialize(newSegments));
    pendingFocusRef.current = { index: textInputIndex + 1, cursor: 0 };
  };

  const handleStripClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      const lastInput = inputRefs.current[textCount - 1];
      if (lastInput) {
        lastInput.focus();
        const len = lastInput.value.length;
        lastInput.setSelectionRange(len, len);
      }
    }
  };

  const chips = PlaceholderLabel.tournamentEntries();
  let textInputIndex = 0;

  return (
    <div className={cn(styles.richTextInput, className)}>
      <div className={styles.tokenStrip} onClick={handleStripClick}>
        {segments.map((seg, i) => {
          if (seg.type === "placeholder") {
            return (
              <PillSegment
                key={`p${i}`}
                value={seg.value}
                onDelete={() => handleDeletePill(i)}
              />
            );
          }
          const idx = textInputIndex++;
          return (
            <TextSegment
              key={`t${i}`}
              value={seg.value}
              index={idx}
              isSole={isSingleTextSegment}
              placeholder={placeholder}
              inputRefs={inputRefs}
              focusedIndexRef={focusedIndexRef}
              cursorRef={cursorRef}
              onChange={(text) => handleTextChange(i, text)}
              onBackspaceAtStart={() => handleBackspaceAtStart(idx)}
              onDeleteAtEnd={() => handleDeleteAtEnd(idx)}
              onArrowLeft={() => handleArrowLeft(idx)}
              onArrowRight={() => handleArrowRight(idx)}
            />
          );
        })}
      </div>
      <div className={styles.chipBar}>
        {chips.map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={styles.chip}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => handleInsertChip(key)}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
};
