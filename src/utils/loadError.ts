import type { FetchFailureKind } from "@/utils/analytics/events";
import { logWarning } from "@/utils/observability/log";

// A failed load that knows why it failed. `message` is what the user reads
// (translated); `detail` is the platform's own wording, for logs only.
export class LoadError extends Error {
  kind: FetchFailureKind;
  detail?: string;
  // Set when one of our own functions answered (see requestIdOf).
  requestId?: string;

  constructor(
    message: string,
    kind: FetchFailureKind,
    detail?: string,
    requestId?: string,
  ) {
    super(message);
    this.name = "LoadError";
    this.kind = kind;
    this.detail = detail;
    this.requestId = requestId;
  }
}

// `fetch` rejects with a TypeError when the request never got an answer.
const isNetworkFailure = (error: unknown): boolean =>
  error instanceof TypeError ||
  (typeof navigator !== "undefined" && navigator.onLine === false);

export const failureKindOf = (error: unknown): FetchFailureKind => {
  if (error instanceof LoadError) return error.kind;
  return isNetworkFailure(error) ? "network" : "query_error";
};

// Failures that say something about the link the user gave, not about us or
// the platform: counted in analytics, kept out of Sentry.
export const isUserInputFailure = (kind: FetchFailureKind): boolean =>
  kind === "not_found" || kind === "unsupported" || kind === "multi_group";

// What to put in a log: never the translated message, which would split one
// issue by language.
export const failureDetail = (error: unknown): string => {
  if (error instanceof LoadError) return error.detail ?? error.kind;
  return error instanceof Error ? error.message : String(error);
};

// The failure kind for an answer from one of our own proxy functions.
export const failureKindForStatus = (status: number): FetchFailureKind => {
  if (status === 404) return "not_found";
  if (status === 429) return "rate_limited";
  if (status >= 500) return "upstream";
  return "query_error";
};

// Reports a failed load to Sentry unless it was the user's input or the
// browser is offline, and returns its kind for the analytics event. Loads
// that go through one of our proxy functions (Challonge, Tonamel) are
// captured there and should not be reported again from the browser.
export const reportLoadFailure = (
  label: string,
  error: unknown,
  context?: Record<string, unknown>,
): FetchFailureKind => {
  const kind = failureKindOf(error);
  const offline = typeof navigator !== "undefined" && !navigator.onLine;
  if (!isUserInputFailure(kind) && !offline) {
    logWarning(label, {
      ...context,
      failure_kind: kind,
      error: failureDetail(error),
      ...(error instanceof LoadError && error.requestId
        ? { request_id: error.requestId }
        : {}),
    });
  }
  return kind;
};
