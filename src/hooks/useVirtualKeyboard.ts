import { RefObject, useEffect, useState } from "react";

/** Shortest on-screen keyboard is well above this; browser toolbars showing
 *  and hiding stay below it. */
const KEYBOARD_MIN_HEIGHT = 150;

const NON_TEXT_INPUT_TYPES = new Set([
  "button",
  "checkbox",
  "color",
  "file",
  "image",
  "radio",
  "range",
  "reset",
  "submit",
]);

const isTextEntry = (el: Element | null): el is HTMLElement => {
  if (!(el instanceof HTMLElement)) return false;
  if (el.isContentEditable) return true;
  if (el instanceof HTMLTextAreaElement) return true;
  if (el instanceof HTMLInputElement) return !NON_TEXT_INPUT_TYPES.has(el.type);
  return false;
};

/**
 * True while the on-screen keyboard is up for a text field inside `scope`.
 *
 * While it is, `--app-height` on the root element holds the height that is
 * actually visible above the keyboard, so the page can lay itself out in that
 * space. iOS does not resize the page for the keyboard (it only shrinks the
 * visual viewport and scrolls), so a `100dvh` layout ends up half covered
 * there; Android resizes the page itself, and the same code path covers it.
 */
export const useVirtualKeyboard = (
  scope: RefObject<HTMLElement | null>,
  enabled = true,
): boolean => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!enabled || !viewport) return;

    const root = document.documentElement;
    // Tallest viewport seen at the current width: the height without a
    // keyboard. Starts over when the width changes (rotation).
    let baseline = { width: viewport.width, height: viewport.height };
    let frame = 0;

    const update = () => {
      frame = 0;
      // Pinch-zoom also shrinks the visual viewport; that is not a keyboard.
      if (viewport.scale > 1.01) return;

      if (viewport.width !== baseline.width) {
        baseline = { width: viewport.width, height: viewport.height };
      } else if (viewport.height > baseline.height) {
        baseline.height = viewport.height;
      }

      const active = document.activeElement;
      const open =
        isTextEntry(active) &&
        Boolean(scope.current?.contains(active)) &&
        baseline.height - viewport.height > KEYBOARD_MIN_HEIGHT;

      if (open) {
        root.style.setProperty("--app-height", `${viewport.height}px`);
        // iOS scrolls the page to reveal the field. The layout now fits the
        // visible area, so put the page back at the top.
        if (window.scrollY !== 0 || viewport.offsetTop !== 0) {
          window.scrollTo(0, 0);
        }
      } else {
        root.style.removeProperty("--app-height");
      }
      setIsOpen(open);
    };

    // Moving between two fields fires focusout then focusin; waiting a frame
    // sees only the end state.
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    viewport.addEventListener("resize", schedule);
    viewport.addEventListener("scroll", schedule);
    document.addEventListener("focusin", schedule);
    document.addEventListener("focusout", schedule);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      viewport.removeEventListener("resize", schedule);
      viewport.removeEventListener("scroll", schedule);
      document.removeEventListener("focusin", schedule);
      document.removeEventListener("focusout", schedule);
      root.style.removeProperty("--app-height");
    };
  }, [scope, enabled]);

  // Once the layout has settled into the smaller space, bring the field the
  // user is typing in back into view.
  useEffect(() => {
    if (!isOpen) return;
    const active = document.activeElement;
    if (isTextEntry(active)) {
      active.scrollIntoView({ block: "center" });
    }
  }, [isOpen]);

  return isOpen;
};
