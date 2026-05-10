import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import cn from "classnames";

import {
  getMatchers,
  insertTokenAt,
  updateMatchesAfterEdit,
  type AnalysisContext,
  type TokenMatch,
} from "@/utils/social/tokenAnalysis";

import styles from "./TokenHighlightEditor.module.scss";

export type TokenHighlightEditorHandle = {
  insertToken: (token: string) => void;
  focus: () => void;
};

type Props = {
  text: string;
  matches: TokenMatch[];
  onChange: (next: { text: string; matches: TokenMatch[] }) => void;
  ctx: AnalysisContext;
  className?: string;
  textareaClassName?: string;
  placeholder?: string;
  ariaLabel?: string;
  spellCheck?: boolean;
  /** Returns a human-readable label for a token's tooltip. */
  getTokenLabel?: (token: string) => string;
};

type HoverState = {
  matchIdx: number;
  /** Token element offset relative to the wrapper (px). */
  top: number;
  left: number;
};

const renderHighlighted = (
  text: string,
  matches: TokenMatch[],
  hoveredIdx: number | null,
): ReactNode[] => {
  const sorted = [...matches]
    .map((m, originalIdx) => ({ ...m, originalIdx }))
    .sort((a, b) => a.start - b.start);
  const out: ReactNode[] = [];
  let cursor = 0;
  let key = 0;
  for (const m of sorted) {
    if (m.start < cursor || m.start > text.length) continue;
    if (m.start > cursor) {
      out.push(<span key={`t${key++}`}>{text.slice(cursor, m.start)}</span>);
    }
    out.push(
      <span
        key={`m${key++}`}
        className={cn(styles.token, {
          [styles.tokenHovered]: hoveredIdx === m.originalIdx,
        })}
        data-match-index={m.originalIdx}
      >
        {text.slice(m.start, m.end)}
      </span>,
    );
    cursor = m.end;
  }
  if (cursor < text.length) {
    out.push(<span key={`t${key++}`}>{text.slice(cursor)}</span>);
  }
  // Trailing newline guard: a textarea reserves an extra line when text ends
  // in `\n`; mirror that in the overlay so heights stay aligned.
  if (text.endsWith("\n")) {
    out.push(<span key="trail">&#8203;</span>);
  }
  return out;
};

const autoGrow = (el: HTMLTextAreaElement) => {
  el.style.height = "auto";
  el.style.height = `${el.scrollHeight}px`;
};

export const TokenHighlightEditor = forwardRef<
  TokenHighlightEditorHandle,
  Props
>(
  (
    {
      text,
      matches,
      onChange,
      ctx,
      className,
      textareaClassName,
      placeholder,
      ariaLabel,
      spellCheck = false,
      getTokenLabel,
    },
    forwardedRef,
  ) => {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const overlayRef = useRef<HTMLDivElement>(null);
    const composingRef = useRef(false);
    const rafIdRef = useRef<number | null>(null);
    /**
     * Mirror of the textarea's caret while it's focused. We need this
     * because opening the "Insert variable" dropdown shifts focus to the
     * dropdown's button — and some browsers reset `selectionStart` to 0 on
     * that blur, so reading it inside `insertToken` lands the token at the
     * top of the post. By snapshotting on every selectionchange / focus
     * event we keep a reliable "last cursor" to insert at.
     */
    const lastSelectionRef = useRef<{ start: number; end: number }>({
      start: 0,
      end: 0,
    });
    const [hover, setHover] = useState<HoverState | null>(null);

    const matchers = useMemo(() => getMatchers(ctx), [ctx]);

    const labelFor = getTokenLabel ?? ((token: string) => `{{${token}}}`);

    useLayoutEffect(() => {
      if (textareaRef.current) autoGrow(textareaRef.current);
    }, [text]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newText = e.target.value;
      if (composingRef.current) {
        onChange({ text: newText, matches });
        return;
      }
      const newMatches = updateMatchesAfterEdit(
        text,
        matches,
        newText,
        matchers,
      );
      onChange({ text: newText, matches: newMatches });
    };

    const handleCompositionEnd = (
      e: React.CompositionEvent<HTMLTextAreaElement>,
    ) => {
      composingRef.current = false;
      const newText = e.currentTarget.value;
      const newMatches = updateMatchesAfterEdit(
        text,
        matches,
        newText,
        matchers,
      );
      onChange({ text: newText, matches: newMatches });
    };

    const handleScroll = () => {
      const ta = textareaRef.current;
      const overlay = overlayRef.current;
      if (!ta || !overlay) return;
      overlay.scrollTop = ta.scrollTop;
      overlay.scrollLeft = ta.scrollLeft;
    };

    useEffect(() => {
      const ta = textareaRef.current;
      if (!ta) return;
      const onCompStart = () => {
        composingRef.current = true;
      };
      ta.addEventListener("compositionstart", onCompStart);
      return () => {
        ta.removeEventListener("compositionstart", onCompStart);
      };
    }, []);

    useEffect(() => {
      return () => {
        if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current);
      };
    }, []);

    /**
     * Hover detection. The textarea sits on top of the overlay so token
     * spans never receive native pointer events. Approach: mousemove on the
     * wrapper (the textarea bubbles to it) → for each token <span> in the
     * overlay, walk its line-fragment rects with `getClientRects()` and test
     * whether the mouse is inside any of them. This works regardless of
     * stacking and handles wrapped tokens correctly. Throttled to once per
     * animation frame.
     */
    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      const { clientX, clientY } = e;
      if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = requestAnimationFrame(() => {
        rafIdRef.current = null;
        const wrapper = wrapperRef.current;
        const overlay = overlayRef.current;
        if (!wrapper || !overlay) return;

        const tokenEls = overlay.querySelectorAll<HTMLElement>(
          "[data-match-index]",
        );
        let foundIdx: number | null = null;
        let foundRect: DOMRect | null = null;
        for (const el of tokenEls) {
          const rects = el.getClientRects();
          for (let i = 0; i < rects.length; i++) {
            const r = rects[i];
            if (
              clientX >= r.left &&
              clientX <= r.right &&
              clientY >= r.top &&
              clientY <= r.bottom
            ) {
              const idx = Number.parseInt(el.dataset.matchIndex ?? "", 10);
              if (!Number.isNaN(idx)) {
                foundIdx = idx;
                foundRect = r;
              }
              break;
            }
          }
          if (foundIdx !== null) break;
        }

        if (foundIdx === null || !foundRect) {
          setHover((prev) => (prev === null ? prev : null));
          return;
        }

        const wrapperRect = wrapper.getBoundingClientRect();
        const next: HoverState = {
          matchIdx: foundIdx,
          top: foundRect.top - wrapperRect.top,
          left: foundRect.left - wrapperRect.left + foundRect.width / 2,
        };
        setHover((prev) => {
          if (
            prev &&
            prev.matchIdx === next.matchIdx &&
            prev.top === next.top &&
            prev.left === next.left
          ) {
            return prev;
          }
          return next;
        });
      });
    };

    const handleMouseLeave = () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      setHover(null);
    };

    useImperativeHandle(forwardedRef, () => ({
      insertToken: (token: string) => {
        const ta = textareaRef.current;
        // Prefer the live caret if focused, otherwise fall back to the last
        // known position before the caller (e.g. the variable picker)
        // stole focus. Clamp to current text length so a stale ref past
        // the end can't crash insertTokenAt.
        const live = ta && document.activeElement === ta ? ta.selectionStart : null;
        const cursorRaw = live ?? lastSelectionRef.current.start;
        const cursor = Math.max(0, Math.min(cursorRaw, text.length));
        const result = insertTokenAt(text, matches, token, ctx, cursor);
        onChange({ text: result.text, matches: result.matches });
        // Update the cached selection so the next insert without focus is
        // also positioned correctly.
        lastSelectionRef.current = {
          start: result.cursorAfter,
          end: result.cursorAfter,
        };
        requestAnimationFrame(() => {
          if (!ta) return;
          ta.focus();
          ta.setSelectionRange(result.cursorAfter, result.cursorAfter);
        });
      },
      focus: () => textareaRef.current?.focus(),
    }));

    const hoveredMatch = hover ? matches[hover.matchIdx] : null;
    const tooltipLabel = hoveredMatch ? labelFor(hoveredMatch.token) : null;

    return (
      <div
        ref={wrapperRef}
        className={cn(styles.wrapper, className)}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div ref={overlayRef} className={styles.overlay} aria-hidden="true">
          {renderHighlighted(text, matches, hover?.matchIdx ?? null)}
        </div>
        <textarea
          ref={textareaRef}
          className={cn(styles.textarea, textareaClassName)}
          value={text}
          placeholder={placeholder}
          aria-label={ariaLabel}
          spellCheck={spellCheck}
          onChange={handleChange}
          onCompositionEnd={handleCompositionEnd}
          onScroll={handleScroll}
          onSelect={(e) => {
            const target = e.currentTarget;
            lastSelectionRef.current = {
              start: target.selectionStart ?? 0,
              end: target.selectionEnd ?? 0,
            };
          }}
          onKeyUp={(e) => {
            const target = e.currentTarget;
            lastSelectionRef.current = {
              start: target.selectionStart ?? 0,
              end: target.selectionEnd ?? 0,
            };
          }}
          onClick={(e) => {
            const target = e.currentTarget;
            lastSelectionRef.current = {
              start: target.selectionStart ?? 0,
              end: target.selectionEnd ?? 0,
            };
          }}
          onBlur={(e) => {
            // Snapshot caret position at the moment of blur so an inserted
            // token after the user clicks the variable picker still lands
            // where they were typing.
            const target = e.currentTarget;
            lastSelectionRef.current = {
              start: target.selectionStart ?? 0,
              end: target.selectionEnd ?? 0,
            };
          }}
          rows={2}
        />
        {hover && tooltipLabel && (
          <div
            className={styles.tooltip}
            role="tooltip"
            style={{ top: hover.top, left: hover.left }}
          >
            {tooltipLabel}
          </div>
        )}
      </div>
    );
  },
);
TokenHighlightEditor.displayName = "TokenHighlightEditor";
