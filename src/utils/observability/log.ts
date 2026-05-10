import { track } from "@vercel/analytics";

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

type EventProps = Record<string, string | number | boolean | null>;

export const logEvent = (name: string, props?: EventProps) => {
  try {
    track(name, props);
  } catch {
    // Analytics is best-effort; never block a user action because of it.
  }
};
