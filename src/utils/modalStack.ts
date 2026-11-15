// A modal <dialog> makes everything outside it inert and paints above it in
// the top layer. Floating UI that portals to <body> (popovers, tooltips,
// toasts) would end up underneath the dialog and unclickable, so those
// portals target the topmost open dialog instead while one is open.

const stack: HTMLElement[] = [];
const listeners = new Set<() => void>();

const emit = () => {
  for (const listener of listeners) listener();
};

export const subscribeToModalStack = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const getPortalContainer = (): HTMLElement =>
  stack[stack.length - 1] ?? document.body;

export const registerModal = (el: HTMLElement) => {
  stack.push(el);
  emit();
  return () => {
    const index = stack.lastIndexOf(el);
    if (index !== -1) stack.splice(index, 1);
    emit();
  };
};
