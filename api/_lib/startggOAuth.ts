// start.gg OAuth token calls (authorization-code exchange and refresh).
// Docs: https://developer.start.gg/docs/oauth/oauth-overview
//
// The client secret never leaves the server: the browser hands us the
// one-time `code`, we trade it for tokens here.

const TOKEN_URL = "https://api.start.gg/oauth/access_token";
const REFRESH_URL = "https://api.start.gg/oauth/refresh";

// `user.identity` is all we need: it unlocks `currentUser` and the user's
// public data. Keep in sync with OAUTH_SCOPE in src/utils/auth/oauth.ts.
export const OAUTH_SCOPE = "user.identity";

export type OAuthTokens = {
  accessToken: string;
  // start.gg may not rotate the refresh token on refresh; undefined means
  // "keep the one you have".
  refreshToken: string | undefined;
  expiresIn: number;
};

export class OAuthUpstreamError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "OAuthUpstreamError";
    this.status = status;
  }
}

export class OAuthConfigError extends Error {
  constructor() {
    super("start.gg OAuth is not configured");
    this.name = "OAuthConfigError";
  }
}

const getCredentials = () => {
  const clientId = process.env.VITE_START_GG_CLIENT_ID;
  const clientSecret = process.env.START_GG_OAUTH_SECRET;
  if (!clientId || !clientSecret) throw new OAuthConfigError();
  return { clientId, clientSecret };
};

const DEFAULT_EXPIRES_IN = 604800; // 7 days, per the docs
// Well inside the auth function's 10s limit, so a hung start.gg ends as an
// answer from us rather than as a function timeout nothing reports.
const TOKEN_TIMEOUT_MS = 7000;

const requestTokens = async (
  url: string,
  body: Record<string, string>,
): Promise<OAuthTokens> => {
  const { clientId, clientSecret } = getCredentials();

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      ...body,
      client_id: clientId,
      client_secret: clientSecret,
      scope: OAUTH_SCOPE,
    }),
    signal: AbortSignal.timeout(TOKEN_TIMEOUT_MS),
  });

  let json: unknown = null;
  try {
    json = await response.json();
  } catch {
    // Non-JSON body: handled below as a failure.
  }

  // The docs show the tokens at the top level; their sample code reads them
  // from a `data` wrapper. Accept both.
  const top = (json ?? {}) as Record<string, unknown>;
  const payload = (
    typeof top.data === "object" && top.data !== null ? top.data : top
  ) as Record<string, unknown>;

  const accessToken = payload.access_token;
  if (!response.ok || typeof accessToken !== "string" || !accessToken) {
    const detail =
      typeof top.message === "string"
        ? top.message
        : typeof top.error === "string"
          ? top.error
          : "token request failed";
    throw new OAuthUpstreamError(response.status, detail);
  }

  const expiresIn = Number(payload.expires_in);
  return {
    accessToken,
    refreshToken:
      typeof payload.refresh_token === "string" && payload.refresh_token
        ? payload.refresh_token
        : undefined,
    expiresIn:
      Number.isFinite(expiresIn) && expiresIn > 0
        ? expiresIn
        : DEFAULT_EXPIRES_IN,
  };
};

export const exchangeCode = (code: string, redirectUri: string) =>
  requestTokens(TOKEN_URL, {
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
  });

export const refreshTokens = (refreshToken: string, redirectUri: string) =>
  requestTokens(REFRESH_URL, {
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    redirect_uri: redirectUri,
  });
