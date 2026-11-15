import {
  DesignPlaceholder,
  PlaceholderLabel,
} from "@/consts/top8/placeholders";

import styles from "../RichTextInput.module.scss";
import { isToken, toUnits } from "./model";

// The editor's DOM: writing it from the model, reading it back, and mapping
// the browser selection to and from model offsets.

// --- Model -> DOM ---

const escapeHtml = (text: string) =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

// A pill has no text of its own: its label and × are drawn by CSS from
// `data-label`. With nothing inside it there is no position for the caret
// to land in.
// `afterSpace` marks a pill that follows a space: the space already keeps
// the caret off the chip, so the pill drops most of its leading gutter.
const pillHtml = (token: string, afterSpace: boolean) => {
  const label = escapeHtml(
    PlaceholderLabel.get(token as DesignPlaceholder) || token,
  );
  return (
    `<span class="${styles.pill}" contenteditable="false" role="img"` +
    ` data-token="${escapeHtml(token)}" data-label="${label}" aria-label="${label}"` +
    `${afterSpace ? " data-after-space" : ""}></span>`
  );
};

// One text node per run of text, one span per token, all direct children.
export const toHtml = (units: string[]) => {
  let html = "";
  let text = "";
  for (const unit of units) {
    if (isToken(unit)) {
      html += escapeHtml(text) + pillHtml(unit, /\s$/.test(text));
      text = "";
    } else {
      text += unit;
    }
  }
  return html + escapeHtml(text);
};

// --- DOM -> model ---

// Used after an IME composition, or anything else the browser changed on its
// own. Tolerant of whatever it left behind (stray <br>, wrapper elements):
// pills contribute their token, everything else its text.
export const serialize = (node: Node): string => {
  if (node.nodeType === Node.TEXT_NODE) {
    return (node.nodeValue ?? "").replace(/[\r\n\u200B]/g, "");
  }
  if (!(node instanceof Element || node instanceof DocumentFragment)) return "";
  if (node instanceof HTMLElement && node.dataset.token) {
    return node.dataset.token;
  }
  let out = "";
  node.childNodes.forEach((child) => {
    out += serialize(child);
  });
  return out;
};

// --- Selection <-> offsets ---

export type Sel = { start: number; end: number };

const isPill = (node: Node | null | undefined): node is HTMLElement =>
  node instanceof HTMLElement && Boolean(node.dataset.token);

export const pillAround = (node: Node | null): HTMLElement | null => {
  const el = node instanceof Element ? node : (node?.parentElement ?? null);
  return el?.closest<HTMLElement>("[data-token]") ?? null;
};

// The offset of a DOM position. A position inside a pill counts as before
// or after the pill, depending on `pillSide`.
export const domToOffset = (
  el: HTMLElement,
  node: Node,
  offset: number,
  pillSide: "before" | "after",
): number => {
  const range = document.createRange();
  range.selectNodeContents(el);
  const pill = pillAround(node);
  if (pill) {
    range.setEndBefore(pill);
  } else {
    range.setEnd(node, offset);
  }
  const before = toUnits(serialize(range.cloneContents())).length;
  return pill && pillSide === "after" ? before + 1 : before;
};

// The DOM position of an offset. Next to text it is inside the text node;
// only between two pills, or between a pill and the edge, is it a position
// in the editor itself.
export const offsetToDom = (
  el: HTMLElement,
  offset: number,
): { node: Node; offset: number } => {
  let remaining = offset;
  const children = el.childNodes;
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (isPill(child)) {
      if (remaining === 0) return { node: el, offset: i };
      remaining -= 1;
    } else {
      const length = child.nodeValue?.length ?? 0;
      if (remaining <= length) return { node: child, offset: remaining };
      remaining -= length;
    }
  }
  return { node: el, offset: children.length };
};

export const readSelection = (el: HTMLElement): Sel | null => {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;
  const range = selection.getRangeAt(0);
  if (!el.contains(range.commonAncestorContainer)) return null;
  const start = domToOffset(
    el,
    range.startContainer,
    range.startOffset,
    range.collapsed ? "after" : "before",
  );
  const end = range.collapsed
    ? start
    : domToOffset(el, range.endContainer, range.endOffset, "after");
  return { start, end: Math.max(start, end) };
};

export const writeSelection = (el: HTMLElement, sel: Sel) => {
  const selection = window.getSelection();
  if (!selection) return;
  const start = offsetToDom(el, sel.start);
  const end = sel.end === sel.start ? start : offsetToDom(el, sel.end);
  const range = document.createRange();
  range.setStart(start.node, start.offset);
  range.setEnd(end.node, end.offset);
  selection.removeAllRanges();
  selection.addRange(range);
};
