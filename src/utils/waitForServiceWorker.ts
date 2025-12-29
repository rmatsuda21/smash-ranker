export const waitForServiceWorker = async (): Promise<void> => {
  if (!("serviceWorker" in navigator)) {
    console.warn("[IDB Image SW] Service Workers not supported");
    return;
  }

  if (navigator.serviceWorker.controller) {
    console.log("[IDB Image SW] Already active");
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register(
      "/idb-image-sw.js"
    );
    console.log("[IDB Image SW] Registered:", registration.scope);

    if (registration.active) {
      await navigator.serviceWorker.ready;
      console.log("[IDB Image SW] Ready");
      return;
    }

    const sw = registration.installing || registration.waiting;
    if (sw) {
      await new Promise<void>((resolve) => {
        sw.addEventListener("statechange", () => {
          if (sw.state === "activated") {
            console.log("[IDB Image SW] Activated");
            resolve();
          }
        });
      });
    }
  } catch (error) {
    console.error("[IDB Image SW] Registration failed:", error);
  }
};
