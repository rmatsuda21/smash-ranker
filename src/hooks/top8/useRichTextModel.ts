import { type RefObject, useLayoutEffect, useRef } from "react";

import {
  readSelection,
  type Sel,
  serialize,
  toHtml,
  writeSelection,
} from "@/utils/top8/richText/dom";
import { toUnits, unitsToValue } from "@/utils/top8/richText/model";

// A stale echo of our own typing can arrive from the debounced parent while
// the user is still typing; within this window it is ignored.
const TYPING_ECHO_WINDOW_MS = 400;

// Consecutive edits of the same kind within this window undo as one step.
const HISTORY_MERGE_MS = 1000;
const HISTORY_LIMIT = 100;

// Rewrites the editor's children from the model.
const render = (el: HTMLElement, units: string[], pillClass: string) => {
  el.innerHTML = toHtml(units, pillClass);
  el.dataset.empty = String(units.length === 0);
};

type HistoryEntry = { units: string[]; sel: Sel };
export type EditKind = "type" | "delete" | "other";

type Options = {
  editorRef: RefObject<HTMLDivElement | null>;
  value: string;
  onChange: (value: string) => void;
  /** Pill labels are translated, so a locale change redraws them. */
  locale: string;
  /** CSS class for the pills the model draws. */
  pillClassName: string;
};

// Owns the editor's state: the model, the selection, and the undo history.
// Every edit goes through `replaceRange`, which rewrites the DOM from the
// model, puts the caret back and reports the new value.
export const useRichTextModel = ({
  editorRef,
  value,
  onChange,
  locale,
  pillClassName,
}: Options) => {
  // The model. `null` until the first render writes it.
  const unitsRef = useRef<string[] | null>(null);
  const valueRef = useRef<string | null>(null);
  // The selection as last seen inside the editor, so a chip reached with the
  // keyboard (which moves focus out of the editor) still inserts in place.
  const selRef = useRef<Sel>({ start: 0, end: 0 });

  const undoRef = useRef<HistoryEntry[]>([]);
  const redoRef = useRef<HistoryEntry[]>([]);
  const lastEditRef = useRef<{ kind: EditKind; at: number } | null>(null);

  const renderedLocaleRef = useRef(locale);
  const lastInputAtRef = useRef(0);
  const recentEmitsRef = useRef<string[]>([]);

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Everything below is written against refs, so these functions can be
  // rebuilt each render and still be used from listeners added once.
  const getUnits = () => unitsRef.current ?? [];

  const currentSel = (): Sel => {
    const el = editorRef.current;
    const max = getUnits().length;
    const sel = (el && readSelection(el)) ?? selRef.current;
    return { start: Math.min(sel.start, max), end: Math.min(sel.end, max) };
  };

  const emit = (next: string) => {
    if (next === valueRef.current) return;
    valueRef.current = next;
    lastInputAtRef.current = performance.now();
    recentEmitsRef.current = [...recentEmitsRef.current.slice(-19), next];
    onChangeRef.current(next);
  };

  // Writes a new model state to the DOM and reports it.
  const commit = (units: string[], sel: Sel) => {
    const el = editorRef.current;
    if (!el) return;
    unitsRef.current = units;
    selRef.current = sel;
    render(el, units, pillClassName);
    if (document.activeElement === el) writeSelection(el, sel);
    emit(unitsToValue(units));
  };

  const pushHistory = (kind: EditKind) => {
    const now = performance.now();
    const last = lastEditRef.current;
    const merges =
      kind !== "other" &&
      last?.kind === kind &&
      now - last.at < HISTORY_MERGE_MS;
    if (!merges) {
      undoRef.current = [
        ...undoRef.current.slice(-(HISTORY_LIMIT - 1)),
        { units: getUnits(), sel: currentSel() },
      ];
    }
    redoRef.current = [];
    lastEditRef.current = { kind, at: now };
  };

  // Replaces the units in [start, end) with `insert` (text and tokens) and
  // leaves the caret after what was inserted.
  const replaceRange = (
    start: number,
    end: number,
    insert: string,
    kind: EditKind,
  ) => {
    const units = getUnits();
    if (start === end && !insert) return;
    pushHistory(kind);

    // Re-parsed as a whole, so text that now spells a token becomes one.
    const head = unitsToValue(units, 0, start) + insert;
    const next = toUnits(head + unitsToValue(units, end));
    let caret = 0;
    for (let length = 0; caret < next.length && length < head.length; caret++) {
      length += next[caret].length;
    }
    commit(next, { start: caret, end: caret });
  };

  const insertAtSelection = (insert: string, kind: EditKind) => {
    const sel = currentSel();
    replaceRange(sel.start, sel.end, insert, kind);
  };

  const deleteFrom = (
    target: (units: string[], offset: number) => number,
    kind: EditKind = "delete",
  ) => {
    const sel = currentSel();
    if (sel.start !== sel.end) {
      replaceRange(sel.start, sel.end, "", kind);
      return;
    }
    const other = target(getUnits(), sel.start);
    replaceRange(
      Math.min(sel.start, other),
      Math.max(sel.start, other),
      "",
      kind,
    );
  };

  const stepHistory = (from: "undo" | "redo") => {
    const source = from === "undo" ? undoRef : redoRef;
    const target = from === "undo" ? redoRef : undoRef;
    const entry = source.current[source.current.length - 1];
    if (!entry) return;
    source.current = source.current.slice(0, -1);
    target.current = [
      ...target.current,
      { units: getUnits(), sel: currentSel() },
    ];
    lastEditRef.current = null;
    commit(entry.units, entry.sel);
  };

  // Takes the DOM as the truth: after an IME composition, or any change the
  // browser made that was not routed through the model.
  const adoptDom = (normalize: boolean) => {
    const el = editorRef.current;
    if (!el) return;
    const sel = readSelection(el);
    const units = toUnits(serialize(el));
    unitsRef.current = units;
    el.dataset.empty = String(units.length === 0);
    if (normalize) {
      const max = units.length;
      const next = sel
        ? { start: Math.min(sel.start, max), end: Math.min(sel.end, max) }
        : { start: max, end: max };
      selRef.current = next;
      render(el, units, pillClassName);
      if (document.activeElement === el) writeSelection(el, next);
    }
    emit(unitsToValue(units));
  };

  // prop -> model: first render, outside changes, and pill labels on locale
  // change.
  useLayoutEffect(() => {
    const el = editorRef.current;
    if (!el) return;

    const localeChanged = renderedLocaleRef.current !== locale;
    if (value === valueRef.current && !localeChanged) return;

    const isFocused = document.activeElement === el;
    const isTypingEcho =
      isFocused &&
      !localeChanged &&
      performance.now() - lastInputAtRef.current < TYPING_ECHO_WINDOW_MS &&
      recentEmitsRef.current.includes(value);
    if (isTypingEcho) return;

    renderedLocaleRef.current = locale;
    if (value === valueRef.current) {
      // Locale only: keep what is in the field, relabel the pills.
      const sel = selRef.current;
      render(el, unitsRef.current ?? [], pillClassName);
      if (isFocused) writeSelection(el, sel);
      return;
    }

    const units = toUnits(value);
    const end = { start: units.length, end: units.length };
    unitsRef.current = units;
    valueRef.current = value;
    selRef.current = end;
    undoRef.current = [];
    redoRef.current = [];
    lastEditRef.current = null;
    render(el, units, pillClassName);
    if (isFocused) writeSelection(el, end);
  }, [editorRef, value, locale, pillClassName]);

  // The selection as the browser reports it; kept for when focus has left.
  const rememberSelection = (sel: Sel) => {
    selRef.current = sel;
  };

  // Focuses the editor with the selection it had when focus left it.
  const focusAtLastSelection = () => {
    const el = editorRef.current;
    if (!el || document.activeElement === el) return;
    const max = getUnits().length;
    const saved = selRef.current;
    el.focus();
    writeSelection(el, {
      start: Math.min(saved.start, max),
      end: Math.min(saved.end, max),
    });
  };

  return {
    getUnits,
    currentSel,
    rememberSelection,
    focusAtLastSelection,
    replaceRange,
    insertAtSelection,
    deleteFrom,
    stepHistory,
    pushHistory,
    adoptDom,
  };
};

export type RichTextModel = ReturnType<typeof useRichTextModel>;
