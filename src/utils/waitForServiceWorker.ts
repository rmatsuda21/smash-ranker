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

    // Wait for the service worker to be ready
    await navigator.serviceWorker.ready;

    const sw =
      registration.active || registration.installing || registration.waiting;

    if (!sw) {
      console.log("[IDB Image SW] No service worker found");
      return;
    }

    // If already activated, we're done
    if (sw.state === "activated") {
      console.log("[IDB Image SW] Already activated");
      return;
    }

    // Wait for activation with a timeout to prevent infinite hangs
    await Promise.race([
      new Promise<void>((resolve) => {
        const handleStateChange = () => {
          if (sw.state === "activated") {
            sw.removeEventListener("statechange", handleStateChange);
            console.log("[IDB Image SW] Activated");
            resolve();
          }
        };
        sw.addEventListener("statechange", handleStateChange);

        // Check immediately in case state changed before listener was attached
        if (sw.state === "activated") {
          sw.removeEventListener("statechange", handleStateChange);
          console.log("[IDB Image SW] Activated (immediate)");
          resolve();
        }
      }),
      // Timeout after 5 seconds to prevent infinite hang
      new Promise<void>((resolve) => {
        setTimeout(() => {
          console.warn("[IDB Image SW] Activation timeout, proceeding anyway");
          resolve();
        }, 5000);
      }),
    ]);
  } catch (error) {
    console.error("[IDB Image SW] Registration failed:", error);
  }
};
