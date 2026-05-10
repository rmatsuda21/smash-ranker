import type { EventName, EventProps } from "@/utils/analytics/events";

import { capture, setPerson, setPersonOnce } from "./analytics";
import { captureException, captureMessage } from "./sentry";

export const logError = (error: unknown, context?: Record<string, unknown>) => {
  if (context) {
    console.error(error, context);
  } else {
    console.error(error);
  }
  captureException(error, context);
};

export const logWarning = (
  message: string,
  context?: Record<string, unknown>,
) => {
  if (context) {
    console.warn(message, context);
  } else {
    console.warn(message);
  }
  captureMessage(message, "warning", context);
};

// Product-event logger. Use for outcome events that describe user-visible
// state transitions. For exceptions/bugs, use `logError`. For known-expected
// failures (e.g. user typed a bad slug), use `logEvent` to track the outcome
// rate without inflating Sentry exception counts.
export const logEvent = (name: EventName, props?: EventProps) => {
  try {
    capture(name, props);
  } catch {
    // Analytics is best-effort; never block a user action because of it.
  }
};

export { setPerson, setPersonOnce };
