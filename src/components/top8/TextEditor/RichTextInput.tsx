import { useRef } from "react";
import cn from "classnames";
import { useLingui } from "@lingui/react";

import {
  DesignPlaceholder,
  PlaceholderLabel,
} from "@/consts/top8/placeholders";

import {
  domToOffset,
  offsetToDom,
  pillAround,
  writeSelection,
} from "./richText/dom";
import {
  charBoundary,
  isToken,
  unitsToValue,
  wordBoundary,
} from "./richText/model";
import { type Press, useNativeEditing } from "./richText/useNativeEditing";
import { useRichTextModel } from "./richText/useRichTextModel";

import styles from "./RichTextInput.module.scss";

// A single-line text field whose value can contain placeholder tokens
// (`<📝>`, `<📅>`, ...). It is one contenteditable element: plain text is
// text nodes, each token is an atomic, non-editable pill.
//
// The browser is used for two things only: moving the caret through text,
// and IME composition. Every edit (typing, deleting, paste, cut, undo) is
// cancelled in `beforeinput` and applied to a model instead; the DOM is then
// rewritten from the model and the caret put back by hand. Browsers disagree
// about editing next to non-editable elements, so none of that is left to
// them.
//
// The model is a list of units: a unit is one UTF-16 code unit of text or
// one whole token. Caret positions are offsets into that list.
//
// The DOM inside the editor is owned by this code, not by React: React
// renders an empty div and never reconciles its children.
//
// The pieces, in `richText/`:
//   model.ts             the value as a list of units, and caret boundaries
//   dom.ts               model <-> DOM, browser selection <-> model offsets
//   useRichTextModel.ts  state, edits, undo history, sync with `value`
//   useNativeEditing.ts  beforeinput / input / composition / selectionchange
// This file has the React event handlers (keys, clipboard, mouse) and the
// markup.

// Width of the × hit area at the trailing end of a pill, and of the empty
// gutter at its leading end. Both match the CSS.
const PILL_REMOVE_WIDTH = 18;
const PILL_GUTTER_WIDTH = 3;

type Props = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  "aria-label"?: string;
};

export const RichTextInput = ({
  value,
  onChange,
  className,
  placeholder = "Enter text...",
  "aria-label": ariaLabel,
}: Props) => {
  const { i18n } = useLingui();
  const editorRef = useRef<HTMLDivElement>(null);
  const lastPressRef = useRef<Press | null>(null);

  const model = useRichTextModel({
    editorRef,
    value,
    onChange,
    locale: i18n.locale,
  });
  const composingRef = useNativeEditing({ editorRef, model, lastPressRef });

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.nativeEvent.isComposing || composingRef.current) return;
    const el = editorRef.current;
    if (!el) return;
    const mod = e.metaKey || e.ctrlKey;
    const key = e.key.toLowerCase();

    if (e.key === "Enter") {
      e.preventDefault();
      return;
    }
    if (mod && !e.altKey && (key === "z" || key === "y")) {
      e.preventDefault();
      e.stopPropagation();
      model.stepHistory(key === "y" || e.shiftKey ? "redo" : "undo");
      return;
    }
    // Rich-text shortcuts would otherwise wrap the text in <b>/<i>/<u>.
    if (mod && ["b", "i", "u"].includes(key)) {
      e.preventDefault();
      return;
    }

    // Backspace and Delete are handled here as well as in `beforeinput`, so
    // they never depend on how a browser reports them.
    if ((e.key === "Backspace" || e.key === "Delete") && !e.ctrlKey) {
      const backward = e.key === "Backspace";
      e.preventDefault();
      if (e.metaKey) model.deleteFrom((units) => (backward ? 0 : units.length));
      else if (e.altKey)
        model.deleteFrom((units, offset) =>
          wordBoundary(units, offset, backward),
        );
      else
        model.deleteFrom((units, offset) =>
          charBoundary(units, offset, backward),
        );
      return;
    }

    // Left/Right next to a pill: step over it as one unit (Shift extends the
    // selection over it). Movement through text is left to the browser.
    const isArrow = e.key === "ArrowLeft" || e.key === "ArrowRight";
    if (!isArrow || mod || e.altKey) return;
    const selection = window.getSelection();
    if (!selection?.focusNode || !el.contains(selection.focusNode)) return;
    // A plain arrow with a selection collapses it.
    if (!selection.isCollapsed && !e.shiftKey) return;

    const backward = e.key === "ArrowLeft";
    const units = model.getUnits();
    const focus = domToOffset(
      el,
      selection.focusNode,
      selection.focusOffset,
      backward ? "after" : "before",
    );
    if (!isToken(units[backward ? focus - 1 : focus])) return;

    e.preventDefault();
    const point = offsetToDom(el, backward ? focus - 1 : focus + 1);
    if (e.shiftKey) selection.extend(point.node, point.offset);
    else selection.collapse(point.node, point.offset);
  };

  // Copy and cut carry the raw value (tokens included), so pasting it back
  // restores the pills.
  const handleCopy = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const sel = model.currentSel();
    if (sel.start === sel.end) return;
    e.preventDefault();
    e.clipboardData.setData(
      "text/plain",
      unitsToValue(model.getUnits(), sel.start, sel.end),
    );
  };

  const handleCut = (e: React.ClipboardEvent<HTMLDivElement>) => {
    handleCopy(e);
    if (e.defaultPrevented) model.insertAtSelection("", "other");
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain").replace(/[\r\n]+/g, " ");
    model.insertAtSelection(text, "other");
  };

  // Pills are atomic: a press never puts the caret inside one.
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    lastPressRef.current = { x: e.clientX, at: performance.now() };
    if (pillAround(e.target as Node)) e.preventDefault();
  };

  // Clicking a pill selects it; clicking its × (drawn at its trailing end)
  // removes it; clicking the empty gutter before it puts the caret there.
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = editorRef.current;
    const pill = pillAround(e.target as Node);
    if (!el || !pill) return;

    el.focus();
    const start = domToOffset(el, pill, 0, "before");
    const rect = pill.getBoundingClientRect();
    if (e.clientX >= rect.right - PILL_REMOVE_WIDTH) {
      model.replaceRange(start, start + 1, "", "other");
    } else if (e.clientX < rect.left + PILL_GUTTER_WIDTH) {
      writeSelection(el, { start, end: start });
    } else {
      writeSelection(el, { start, end: start + 1 });
    }
  };

  // A chip reached with the keyboard has taken focus out of the editor, so
  // go back to where the caret was first.
  const handleInsertToken = (token: DesignPlaceholder) => {
    model.focusAtLastSelection();
    model.insertAtSelection(token, "other");
  };

  // A press on the gaps between chips would blur the editor, which hides
  // the insert row until the click lands. Keep focus where it is.
  const keepFocus = (e: React.MouseEvent) => e.preventDefault();

  const chips = PlaceholderLabel.tournamentEntries();

  return (
    <div className={cn(styles.richTextInput, className)}>
      <div
        ref={editorRef}
        className={styles.editor}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline={false}
        aria-label={ariaLabel}
        aria-placeholder={placeholder}
        data-placeholder={placeholder}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        enterKeyHint="done"
        onKeyDown={handleKeyDown}
        onCopy={handleCopy}
        onCut={handleCut}
        onPaste={handlePaste}
        onMouseDown={handleMouseDown}
        onClick={handleClick}
        onDragStart={(e) => e.preventDefault()}
        onDrop={(e) => e.preventDefault()}
      />
      <div className={styles.chipBar} onMouseDown={keepFocus}>
        {chips.map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={styles.chip}
            onClick={() => handleInsertToken(key)}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
};
