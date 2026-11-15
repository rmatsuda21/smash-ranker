import { type RefObject, useEffect, useRef } from "react";

import { domToOffset, pillAround, readSelection, writeSelection } from "./dom";
import { charBoundary, wordBoundary } from "./model";
import type { RichTextModel } from "./useRichTextModel";

// How long after a press a caret that lands inside a pill is put on the side
// that was pressed.
const PRESS_WINDOW_MS = 500;

export type Press = { x: number; at: number };

type Options = {
  editorRef: RefObject<HTMLDivElement | null>;
  model: RichTextModel;
  /** Where the last press landed, to tell which side of a pill it was on. */
  lastPressRef: RefObject<Press | null>;
};

// The editor's native listeners. `beforeinput` is where edits are cancelled
// and sent to the model (React's synthetic `beforeinput` is not the real
// event); `input` and the composition events read back what the browser
// wrote on its own; `selectionchange` only fires on the document.
//
// Returns a ref that is true while an IME composition is in progress.
export const useNativeEditing = ({
  editorRef,
  model,
  lastPressRef,
}: Options) => {
  const composingRef = useRef(false);

  // The listeners are added once; they reach the current model through this.
  const modelRef = useRef(model);
  modelRef.current = model;

  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;

    const onBeforeInput = (e: InputEvent) => {
      const h = modelRef.current;
      const type = e.inputType;
      // An IME owns the DOM while it composes; the result is read back when
      // it finishes.
      if (e.isComposing || composingRef.current || type.includes("Composition"))
        return;

      const lineStart = () => 0;
      const lineEnd = (units: string[]) => units.length;

      switch (type) {
        case "insertText":
        case "insertReplacementText":
        case "insertFromYank": {
          e.preventDefault();
          const text = (
            e.data ??
            e.dataTransfer?.getData("text/plain") ??
            ""
          ).replace(/[\r\n]+/g, " ");
          h.insertAtSelection(text, "type");
          return;
        }
        case "deleteContentBackward":
          e.preventDefault();
          h.deleteFrom((units, offset) => charBoundary(units, offset, true));
          return;
        case "deleteContentForward":
          e.preventDefault();
          h.deleteFrom((units, offset) => charBoundary(units, offset, false));
          return;
        case "deleteWordBackward":
          e.preventDefault();
          h.deleteFrom((units, offset) => wordBoundary(units, offset, true));
          return;
        case "deleteWordForward":
          e.preventDefault();
          h.deleteFrom((units, offset) => wordBoundary(units, offset, false));
          return;
        case "deleteSoftLineBackward":
        case "deleteHardLineBackward":
          e.preventDefault();
          h.deleteFrom(lineStart);
          return;
        case "deleteSoftLineForward":
        case "deleteHardLineForward":
          e.preventDefault();
          h.deleteFrom(lineEnd);
          return;
        case "deleteContent":
        case "deleteByCut":
        case "deleteByDrag":
          e.preventDefault();
          h.deleteFrom((_, offset) => offset, "other");
          return;
        case "historyUndo":
          e.preventDefault();
          h.stepHistory("undo");
          return;
        case "historyRedo":
          e.preventDefault();
          h.stepHistory("redo");
          return;
        default:
          // Single line, plain text: no line breaks, formatting or drops.
          // Paste arrives through the `paste` event instead.
          if (
            type === "insertParagraph" ||
            type === "insertLineBreak" ||
            type.startsWith("insertFrom") ||
            type.startsWith("format")
          ) {
            e.preventDefault();
          }
        // Anything else is left to the browser and read back on `input`.
      }
    };

    // Only reached for changes the browser made itself.
    const onInput = () => {
      const h = modelRef.current;
      h.adoptDom(!composingRef.current);
    };

    const onCompositionStart = () => {
      modelRef.current.pushHistory("other");
      composingRef.current = true;
    };
    const onCompositionEnd = () => {
      composingRef.current = false;
      modelRef.current.adoptDom(true);
    };

    const onSelectionChange = () => {
      const selection = window.getSelection();
      if (!selection || composingRef.current) return;
      const inside =
        selection.rangeCount > 0 &&
        el.contains(selection.getRangeAt(0).commonAncestorContainer);

      if (inside) {
        // A caret must never rest inside a pill, where typing does nothing.
        // If a browser puts it there, move it to the side that was pressed,
        // or after the pill when it got there some other way.
        const trapped = selection.isCollapsed
          ? pillAround(selection.focusNode)
          : null;
        if (trapped) {
          const press = lastPressRef.current;
          const rect = trapped.getBoundingClientRect();
          const before =
            press !== null &&
            performance.now() - press.at < PRESS_WINDOW_MS &&
            press.x < rect.left + rect.width / 2;
          const offset = domToOffset(
            el,
            trapped,
            0,
            before ? "before" : "after",
          );
          writeSelection(el, { start: offset, end: offset });
          return; // Setting the selection fires this handler again.
        }
        const sel = readSelection(el);
        if (sel) modelRef.current.rememberSelection(sel);
      }

      // Mark pills that sit wholly inside the selection, so a selected pill
      // looks selected.
      const active =
        inside && document.activeElement === el && !selection.isCollapsed;
      el.querySelectorAll<HTMLElement>("[data-token]").forEach((pill) => {
        const selected = Boolean(active && selection.containsNode(pill, false));
        pill.toggleAttribute("data-selected", selected);
      });
    };

    el.addEventListener("beforeinput", onBeforeInput);
    el.addEventListener("input", onInput);
    el.addEventListener("compositionstart", onCompositionStart);
    el.addEventListener("compositionend", onCompositionEnd);
    document.addEventListener("selectionchange", onSelectionChange);
    return () => {
      el.removeEventListener("beforeinput", onBeforeInput);
      el.removeEventListener("input", onInput);
      el.removeEventListener("compositionstart", onCompositionStart);
      el.removeEventListener("compositionend", onCompositionEnd);
      document.removeEventListener("selectionchange", onSelectionChange);
    };
  }, [editorRef, lastPressRef]);

  return composingRef;
};
