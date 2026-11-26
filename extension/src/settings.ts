// The extension's settings, kept in Chrome's synced storage so they follow
// the user to other computers.
export type Settings = { showButton: boolean };

const DEFAULTS: Settings = { showButton: true };

export const getSettings = async (): Promise<Settings> =>
  (await chrome.storage.sync.get(DEFAULTS)) as Settings;

export const setShowButton = (showButton: boolean) =>
  chrome.storage.sync.set({ showButton });

export const onShowButtonChange = (listener: (showButton: boolean) => void) =>
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "sync" && "showButton" in changes) {
      listener(changes.showButton.newValue !== false);
    }
  });
