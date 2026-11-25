import { requestIdOf } from "@/utils/observability/requestId";

// start.gg OAuth, browser side.
// Docs: https://developer.start.gg/docs/oauth/oauth-overview
//
// Flow: startLogin() sends the user to start.gg → start.gg redirects to
// /oauth/callback?code=… → completeLogin() hands the code to /api/auth, which
// holds the client secret and returns an access token.

const AUTHORIZE_URL = "https://start.gg/oauth/authorize";
// Keep in sync with OAUTH_SCOPE in api/_lib/startggOAuth.ts.
const OAUTH_SCOPE = "user.identity";
// Keep in sync with CALLBACK_PATH in api/auth.ts. The start.gg application
// must list `<origin>/oauth/callback` as its redirect URI.
export const CALLBACK_PATH = "/oauth/callback";

const PENDING_KEY = "smash-ranker:oauth-pending";
const PENDING_MAX_AGE_MS = 15 * 60 * 1000;

const CLIENT_ID: string | undefined = import.meta.env.VITE_START_GG_CLIENT_ID;

export const isLoginAvailable = (): boolean => Boolean(CLIENT_ID);

// The pending login is kept in localStorage, not sessionStorage: on a phone the
// callback often lands in another tab than the one that started the login
// (start.gg's app or a sign-in provider takes over the link and hands back to
// a new tab), and sessionStorage is per tab. It still expires after 15 minutes
// and is used once.
type PendingLogin = { state: string; returnTo: string; startedAt: number };

export type SessionTokens = { accessToken: string; expiresIn: number };

// Why a login did not go through, for analytics. `cancelled` and
// `stale_callback` are the user's doing; the rest point at us or start.gg.
export type LoginFailureReason =
  | "cancelled"
  | "stale_callback"
  | "state_mismatch"
  | "exchange_failed"
  | "profile_failed"
  | "storage"
  | "not_configured"
  | "refresh_failed"
  | "unknown";

export class LoginError extends Error {
  reason: LoginFailureReason;
  // Set when /api/auth answered (see requestIdOf).
  requestId?: string;

  constructor(
    message: string,
    reason: LoginFailureReason = "unknown",
    requestId?: string,
  ) {
    super(message);
    this.name = "LoginError";
    this.reason = reason;
    this.requestId = requestId;
  }
}

const readPending = (): PendingLogin | null => {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingLogin;
    if (Date.now() - parsed.startedAt > PENDING_MAX_AGE_MS) return null;
    return parsed;
  } catch {
    return null;
  }
};

const clearPending = () => {
  try {
    localStorage.removeItem(PENDING_KEY);
  } catch {
    // Nothing to clear.
  }
};

// Only ever send the user back to a path on this site.
const safeReturnPath = (path: string | undefined): string =>
  path && path.startsWith("/") && !path.startsWith("//") ? path : "/";

export const startLogin = (returnTo: string = window.location.pathname) => {
  if (!CLIENT_ID)
    throw new LoginError("start.gg login is not configured", "not_configured");

  const pending: PendingLogin = {
    state: crypto.randomUUID(),
    returnTo: safeReturnPath(returnTo),
    startedAt: Date.now(),
  };
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify(pending));
  } catch {
    throw new LoginError(
      "Could not start login: storage is unavailable",
      "storage",
    );
  }

  const params = new URLSearchParams({
    response_type: "code",
    client_id: CLIENT_ID,
    scope: OAUTH_SCOPE,
    redirect_uri: `${window.location.origin}${CALLBACK_PATH}`,
    state: pending.state,
  });
  window.location.assign(`${AUTHORIZE_URL}?${params.toString()}`);
};

const postAuth = async (body: Record<string, string>): Promise<Response> =>
  fetch("/api/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(body),
  });

const readTokens = async (response: Response): Promise<SessionTokens> => {
  const json = (await response.json()) as Partial<SessionTokens>;
  if (typeof json.accessToken !== "string" || !json.accessToken) {
    throw new LoginError("Malformed token response", "exchange_failed");
  }
  return { accessToken: json.accessToken, expiresIn: json.expiresIn ?? 0 };
};

// Finishes a login from the callback URL's query string. A callback only
// counts if this browser started a login (so a link someone else crafted cannot
// sign you into their account), and if start.gg echoes `state` it must match.
export const completeLogin = async (
  search: string,
): Promise<{ tokens: SessionTokens; returnTo: string }> => {
  const params = new URLSearchParams(search);
  const pending = readPending();
  clearPending();

  if (params.get("error")) {
    throw new LoginError("Login was cancelled", "cancelled");
  }
  const code = params.get("code");
  if (!code) {
    throw new LoginError("Missing authorization code", "stale_callback");
  }
  if (!pending) throw new LoginError("No login in progress", "stale_callback");
  const state = params.get("state");
  if (state !== null && state !== pending.state) {
    throw new LoginError("Login state mismatch", "state_mismatch");
  }

  const response = await postAuth({ action: "exchange", code });
  if (!response.ok) {
    throw new LoginError(
      `Could not complete login (${response.status})`,
      "exchange_failed",
      requestIdOf(response),
    );
  }
  return { tokens: await readTokens(response), returnTo: pending.returnTo };
};

// null: the refresh token is gone or no longer accepted (/api/auth answers
// 401) — log in again. Throws on network trouble or when start.gg itself is
// down (502), where the session may still be good and is kept.
export const requestRefresh = async (): Promise<SessionTokens | null> => {
  const response = await postAuth({ action: "refresh" });
  if (response.status === 401) return null;
  if (!response.ok) {
    throw new LoginError(
      `Could not refresh session (${response.status})`,
      "refresh_failed",
      requestIdOf(response),
    );
  }
  return readTokens(response);
};

export const requestLogout = async (): Promise<void> => {
  await postAuth({ action: "logout" });
};
