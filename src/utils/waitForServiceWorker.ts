import { logWarning } from "@/utils/observability/log";

const SW_CLAIM_TIMEOUT_MS = 3000;
// The app must not wait on the worker for ever: it only serves uploaded
// images, and the page works without it.
const SW_ACTIVATION_TIMEOUT_MS = 4000;

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
      { once: true },
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
  registration: ServiceWorkerRegistration,
): Promise<void> => {
  const sw = registration.installing ?? registration.waiting;
  if (!sw) return Promise.resolve();

  return new Promise<void>((resolve) => {
    const finish = () => {
      clearTimeout(timeout);
      sw.removeEventListener("statechange", onStateChange);
      resolve();
    };
    // "redundant" is an install that failed or was replaced: it will never
    // activate.
    const onStateChange = () => {
      if (sw.state === "activated" || sw.state === "redundant") finish();
    };
    const timeout = setTimeout(finish, SW_ACTIVATION_TIMEOUT_MS);
    sw.addEventListener("statechange", onStateChange);
  });
};

export const registerServiceWorker = async (): Promise<void> => {
  if (!("serviceWorker" in navigator)) return;
  if (navigator.serviceWorker.controller) return;

  try {
    const registration =
      await navigator.serviceWorker.register("/idb-image-sw.js");

    if (registration.active) {
      requestClaim(registration);
    } else {
      await waitForActivation(registration);
      requestClaim(registration);
    }

    await waitForController();
  } catch (error) {
    // Uploaded images (/idb-images/…) will not load without the worker.
    logWarning("service worker registration failed", {
      area: "startup",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
