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

type PendingLogin = { state: string; returnTo: string; startedAt: number };

export type SessionTokens = { accessToken: string; expiresIn: number };

export class LoginError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LoginError";
  }
}

const readPending = (): PendingLogin | null => {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
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
    sessionStorage.removeItem(PENDING_KEY);
  } catch {
    // Nothing to clear.
  }
};

// Only ever send the user back to a path on this site.
const safeReturnPath = (path: string | undefined): string =>
  path && path.startsWith("/") && !path.startsWith("//") ? path : "/";

export const startLogin = (returnTo: string = window.location.pathname) => {
  if (!CLIENT_ID) throw new LoginError("start.gg login is not configured");

  const pending: PendingLogin = {
    state: crypto.randomUUID(),
    returnTo: safeReturnPath(returnTo),
    startedAt: Date.now(),
  };
  sessionStorage.setItem(PENDING_KEY, JSON.stringify(pending));

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
    throw new LoginError("Malformed token response");
  }
  return { accessToken: json.accessToken, expiresIn: json.expiresIn ?? 0 };
};

// Finishes a login from the callback URL's query string. A callback only
// counts if this tab started a login (so a link someone else crafted cannot
// sign you into their account), and if start.gg echoes `state` it must match.
export const completeLogin = async (
  search: string,
): Promise<{ tokens: SessionTokens; returnTo: string }> => {
  const params = new URLSearchParams(search);
  const pending = readPending();
  clearPending();

  if (params.get("error")) throw new LoginError("Login was cancelled");
  const code = params.get("code");
  if (!code) throw new LoginError("Missing authorization code");
  if (!pending) throw new LoginError("No login in progress");
  const state = params.get("state");
  if (state !== null && state !== pending.state) {
    throw new LoginError("Login state mismatch");
  }

  const response = await postAuth({ action: "exchange", code });
  if (!response.ok) throw new LoginError("Could not complete login");
  return { tokens: await readTokens(response), returnTo: pending.returnTo };
};

// null: the refresh token is gone or no longer accepted — log in again.
// Throws on network/server trouble, where the session may still be good.
export const requestRefresh = async (): Promise<SessionTokens | null> => {
  const response = await postAuth({ action: "refresh" });
  if (response.status === 401) return null;
  if (!response.ok) throw new LoginError("Could not refresh session");
  return readTokens(response);
};

export const requestLogout = async (): Promise<void> => {
  await postAuth({ action: "logout" });
};
