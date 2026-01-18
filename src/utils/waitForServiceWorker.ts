export const registerServiceWorker = (): void => {
  if (!("serviceWorker" in navigator)) {
    console.warn("[IDB Image SW] Service Workers not supported");
    return;
  }

  if (navigator.serviceWorker.controller) {
    console.log("[IDB Image SW] Already active");
    return;
  }

  window.addEventListener(
    "load",
    () => {
      navigator.serviceWorker
        .register("/idb-image-sw.js")
        .then((registration) => {
          console.log("[IDB Image SW] Registered:", registration.scope);
        })
        .catch((error) => {
          console.error("[IDB Image SW] Registration failed:", error);
        });
    },
    { once: true }
  );
};
