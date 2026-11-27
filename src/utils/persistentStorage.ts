import { logWarning } from "@/utils/observability/log";

let asked = false;

// Asks the browser to keep what the app stores on this device. Without it
// storage is "best effort": the browser may clear it when the disk is low,
// and Safari clears it after a week without a visit, taking saved templates,
// images and fonts with it.
//
// Call it after something the user chose to save has been stored. Firefox
// shows a permission prompt, which only makes sense at that moment; Chrome
// and Safari decide on their own without asking. Asked once per page load.
export const requestPersistentStorage = (): void => {
  if (asked) return;
  asked = true;

  const storage =
    typeof navigator === "undefined" ? undefined : navigator.storage;
  if (!storage?.persist || !storage.persisted) return;

  void (async () => {
    try {
      if (await storage.persisted()) return;
      await storage.persist();
    } catch (error) {
      logWarning("persistent storage request failed", {
        area: "storage",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  })();
};
