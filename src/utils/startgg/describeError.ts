import { t } from "@lingui/core/macro";
import type { CombinedError } from "urql";

import type { FetchFailureKind } from "@/utils/analytics/events";
import { LoadError } from "@/utils/loadError";
import { isLoginAvailable } from "@/utils/auth/oauth";
import { getUserAccessToken } from "@/utils/auth/session";

type Described = { kind: FetchFailureKind; message: string };

// Someone logged in is on their own token and limit; anyone else shares the
// app's, and logging in is their way out of a busy minute.
export const canLogInForOwnLimit = (): boolean =>
  isLoginAvailable() && !getUserAccessToken();

// start.gg answers a request over its limit (80 a minute) with HTTP 429 and
// `{ success: false, message: "Rate limit exceeded - api-token" }`.
const RATE_LIMIT = /rate limit/i;
const COMPLEXITY = /complexity/i;

// Says what went wrong with a start.gg request, in words for the user and as
// a kind for analytics. urql's own message ("[Network] Failed to fetch") is
// neither translated nor meant for users.
export const describeStartggError = (
  error: Pick<CombinedError, "message" | "networkError" | "response">,
): Described => {
  const status: number | undefined = error.response?.status;
  const raw = error.message ?? "";

  if (status === 429 || RATE_LIMIT.test(raw)) {
    return {
      kind: "rate_limited",
      message: canLogInForOwnLimit()
        ? t`start.gg is receiving too many requests. Wait a minute and try again, or log in with start.gg.`
        : t`start.gg is receiving too many requests. Wait a minute and try again.`,
    };
  }
  if (COMPLEXITY.test(raw)) {
    return {
      kind: "query_error",
      message: t`start.gg refused this request as too large. Try again.`,
    };
  }
  if (status !== undefined && status >= 500) {
    return {
      kind: "upstream",
      message: t`start.gg is having trouble right now. Try again in a moment.`,
    };
  }
  if (error.networkError && status === undefined) {
    return {
      kind: "network",
      message: t`Couldn't reach start.gg. Check your connection and try again.`,
    };
  }
  return {
    kind: "query_error",
    message: t`start.gg returned an error. Try again.`,
  };
};

// The error to throw for a start.gg result that cannot be used: start.gg's
// own failure when there is one, otherwise "nothing there" in the caller's
// words.
export const startggLoadError = (
  error: CombinedError | undefined,
  missingMessage: string,
  missingKind: FetchFailureKind = "not_found",
): LoadError => {
  if (!error) return new LoadError(missingMessage, missingKind);
  const { kind, message } = describeStartggError(error);
  return new LoadError(message, kind, error.message);
};
