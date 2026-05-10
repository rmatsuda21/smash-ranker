import {
  forwardRef,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import cn from "classnames";

import styles from "./TokenHighlightEditor.module.scss";

export type PlainTextEditorHandle = {
  focus: () => void;
};

type Props = {
  text: string;
  onChange: (text: string) => void;
  className?: string;
  placeholder?: string;
  ariaLabel?: string;
  spellCheck?: boolean;
};

type LinkMatch = {
  start: number;
  end: number;
  type: "handle" | "url";
};

/**
 * Matches both protocol'd URLs (`https://example.com/path`) and bare ones
 * (`start.gg/tournament/...`, `example.com`). Requires:
 *  - one or more `word.` segments
 *  - a 2–24 letter TLD (rules out `1.0`, `e.g.`, `i.e.` etc.)
 *  - optionally a `/path` to next whitespace
 * The leading negative lookbehind keeps it from matching mid-word text.
 */
const URL_RE =
  /(?<![\w@])(?:https?:\/\/)?(?:[\w-]+\.)+[a-zA-Z]{2,24}(?:\/\S*)?/g;
// X-style handles: leading @ (preceded by non-word/non-@), 2–15 word chars.
const HANDLE_RE = /(?<![\w@])@\w{2,15}\b/g;

const findLinks = (text: string): LinkMatch[] => {
  const out: LinkMatch[] = [];

  URL_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = URL_RE.exec(text)) !== null) {
    out.push({ start: m.index, end: m.index + m[0].length, type: "url" });
  }

  HANDLE_RE.lastIndex = 0;
  while ((m = HANDLE_RE.exec(text)) !== null) {
    const start = m.index;
    const end = start + m[0].length;
    const overlaps = out.some((x) => start < x.end && end > x.start);
    if (!overlaps) out.push({ start, end, type: "handle" });
  }

  return out.sort((a, b) => a.start - b.start);
};

const renderHighlighted = (text: string, matches: LinkMatch[]): ReactNode[] => {
  const out: ReactNode[] = [];
  let cursor = 0;
  let key = 0;
  for (const m of matches) {
    if (m.start < cursor || m.start > text.length) continue;
    if (m.start > cursor) {
      out.push(<span key={`t${key++}`}>{text.slice(cursor, m.start)}</span>);
    }
    out.push(
      <span key={`l${key++}`} className={styles.link}>
        {text.slice(m.start, m.end)}
      </span>,
    );
    cursor = m.end;
  }
  if (cursor < text.length) {
    out.push(<span key={`t${key++}`}>{text.slice(cursor)}</span>);
  }
  if (text.endsWith("\n")) {
    out.push(<span key="trail">&#8203;</span>);
  }
  return out;
};

const autoGrow = (el: HTMLTextAreaElement) => {
  el.style.height = "auto";
  el.style.height = `${el.scrollHeight}px`;
};

/**
 * Plain-mode editor with X-style live link styling. Uses the same
 * overlay+transparent-textarea pattern as TokenHighlightEditor: the
 * textarea is the input source of truth (cursor, selection, IME), the
 * overlay below paints the visible text with link spans colored to match
 * the platform.
 */
export const PlainTextEditor = forwardRef<PlainTextEditorHandle, Props>(
  (
    { text, onChange, className, placeholder, ariaLabel, spellCheck = false },
    forwardedRef,
  ) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const overlayRef = useRef<HTMLDivElement>(null);

    const matches = useMemo(() => findLinks(text), [text]);

    useLayoutEffect(() => {
      if (textareaRef.current) autoGrow(textareaRef.current);
    }, [text]);

    useImperativeHandle(forwardedRef, () => ({
      focus: () => textareaRef.current?.focus(),
    }));

    const handleScroll = () => {
      const ta = textareaRef.current;
      const overlay = overlayRef.current;
      if (!ta || !overlay) return;
      overlay.scrollTop = ta.scrollTop;
      overlay.scrollLeft = ta.scrollLeft;
    };

    return (
      <div className={cn(styles.wrapper, className)}>
        <div ref={overlayRef} className={styles.overlay} aria-hidden="true">
          {renderHighlighted(text, matches)}
        </div>
        <textarea
          ref={textareaRef}
          className={cn(styles.textarea)}
          value={text}
          placeholder={placeholder}
          aria-label={ariaLabel}
          spellCheck={spellCheck}
          onChange={(e) => onChange(e.target.value)}
          onScroll={handleScroll}
          rows={2}
        />
      </div>
    );
  },
);
PlainTextEditor.displayName = "PlainTextEditor";
