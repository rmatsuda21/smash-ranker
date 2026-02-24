const SW_CLAIM_TIMEOUT_MS = 3000;

const waitForController = (): Promise<void> => {
  if (navigator.serviceWorker.controller) return Promise.resolve();

  return new Promise<void>((resolve) => {
    const timeout = setTimeout(resolve, SW_CLAIM_TIMEOUT_MS);

    navigator.serviceWorker.addEventListener(
      "controllerchange",
      () => {
        clearTimeout(timeout);
        resolve();
      },
      { once: true }
    );
  });
};

const requestClaim = (registration: ServiceWorkerRegistration): void => {
  const activeWorker = registration.active;
  if (activeWorker && !navigator.serviceWorker.controller) {
    activeWorker.postMessage({ type: "CLAIM_CLIENTS" });
  }
};

const waitForActivation = (
  registration: ServiceWorkerRegistration
): Promise<void> => {
  const sw = registration.installing ?? registration.waiting;
  if (!sw) return Promise.resolve();

  return new Promise<void>((resolve) => {
    const onStateChange = () => {
      if (sw.state === "activated") {
        sw.removeEventListener("statechange", onStateChange);
        resolve();
      }
    };
    sw.addEventListener("statechange", onStateChange);
  });
};

export const registerServiceWorker = async (): Promise<void> => {
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
      requestClaim(registration);
    } else {
      await waitForActivation(registration);
      requestClaim(registration);
    }

    await waitForController();
  } catch (error) {
    console.error("[IDB Image SW] Registration failed:", error);
  }
};
