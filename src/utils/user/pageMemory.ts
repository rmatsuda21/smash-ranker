// Where the user was on the profile page, kept on the browser-history entry
// itself: going Back to the page finds it again, while opening the page
// afresh (a new history entry) starts at the top.

export type UserPageMemory = {
  scrollTop: number;
  // How many tournaments "Show more" had revealed.
  visible: number;
  query: string;
};

const KEY = "userPage";

export const readUserPageMemory = (): Partial<UserPageMemory> => {
  const state: unknown = window.history.state;
  if (typeof state !== "object" || state === null) return {};
  const memory = (state as Record<string, unknown>)[KEY];
  return typeof memory === "object" && memory !== null
    ? (memory as Partial<UserPageMemory>)
    : {};
};

export const writeUserPageMemory = (patch: Partial<UserPageMemory>) => {
  const state: unknown = window.history.state;
  const base =
    typeof state === "object" && state !== null
      ? (state as Record<string, unknown>)
      : {};
  window.history.replaceState(
    { ...base, [KEY]: { ...readUserPageMemory(), ...patch } },
    "",
  );
};
