// What the database layer has to tell the user. It runs outside React, so
// it cannot show a toast itself: a mounted component subscribes
// (`useDbNotices`) and anything raised before that is kept for it.

export type DbNotice =
  // This tab cannot open the database until older tabs are closed.
  | "blocked"
  // A newer tab upgraded the database; this tab has to reload.
  | "outdated";

type Listener = (notice: DbNotice) => void;

const listeners = new Set<Listener>();
const pending = new Set<DbNotice>();

export const raiseDbNotice = (notice: DbNotice) => {
  if (listeners.size === 0) {
    pending.add(notice);
    return;
  }
  for (const listener of listeners) listener(notice);
};

export const subscribeDbNotices = (listener: Listener): (() => void) => {
  listeners.add(listener);
  for (const notice of pending) listener(notice);
  pending.clear();
  return () => {
    listeners.delete(listener);
  };
};
