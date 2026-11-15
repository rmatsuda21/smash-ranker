import { useSyncExternalStore } from "react";

// A modal <dialog> makes everything outside it inert and paints above it in
// the top layer. Floating UI that portals to <body> (popovers, tooltips,
// toasts) would end up underneath the dialog and unclickable, so those
// portals target the topmost open dialog instead while one is open.

const stack: HTMLElement[] = [];
const listeners = new Set<() => void>();

const emit = () => {
  for (const listener of listeners) listener();
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const getSnapshot = (): HTMLElement => stack[stack.length - 1] ?? document.body;

export const registerModal = (el: HTMLElement) => {
  stack.push(el);
  emit();
  return () => {
    const index = stack.lastIndexOf(el);
    if (index !== -1) stack.splice(index, 1);
    emit();
  };
};

/** Where floating UI should portal to: the topmost open modal, else <body>. */
export const usePortalContainer = (): HTMLElement =>
  useSyncExternalStore(subscribe, getSnapshot);
