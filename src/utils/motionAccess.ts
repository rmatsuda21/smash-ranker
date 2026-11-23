type PermissionedOrientation = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<"granted" | "denied">;
};

// iOS hands out the phone's tilt only after the user allows it, and only
// asks from inside a tap; everywhere else it just works. The answer holds
// for the page, so one tap anywhere (opening the recap, say) can settle it
// for every tilting card that comes later.
let state: "unknown" | "asking" | "granted" | "denied" = "unknown";
const listeners = new Set<() => void>();

const orientationApi = (): PermissionedOrientation | undefined =>
  typeof window === "undefined"
    ? undefined
    : (window.DeviceOrientationEvent as PermissionedOrientation | undefined);

// Whether tilt readings can be listened to right now.
export const hasMotionAccess = (): boolean => {
  const api = orientationApi();
  return Boolean(api) && (!api?.requestPermission || state === "granted");
};

// Asks for the phone's tilt where the browser wants asking. Must be called
// from a tap or click handler. Asks once: a second call is a no-op, as is
// any call on a device that needs no permission.
export const requestMotionAccess = (): void => {
  const api = orientationApi();
  if (!api?.requestPermission || state !== "unknown") return;
  state = "asking";
  api
    .requestPermission()
    .then((answer) => {
      state = answer === "granted" ? "granted" : "denied";
      if (state === "granted") listeners.forEach((listener) => listener());
    })
    .catch(() => {
      // Not inside a tap after all: the next one may ask again.
      state = "unknown";
    });
};

// Calls back when access is granted later. Returns the unsubscribe.
export const onMotionAccess = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
