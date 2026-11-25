import "./_instrument.js";

import type { VercelRequest, VercelResponse } from "@vercel/node";

import { BadRequestError, respondClientError } from "./_lib/errors.js";
import { requireAllowedOrigin } from "./_lib/origin.js";
import {
  exchangeCode,
  OAuthConfigError,
  OAuthUpstreamError,
  refreshTokens,
  type OAuthTokens,
} from "./_lib/startggOAuth.js";
import { isTimeoutError } from "./_lib/fetchImage.js";
import { captureFnException, withLogging } from "./_lib/withLogging.js";

// start.gg login. One function, three actions (POST `{ action }`):
//   exchange — trade the one-time authorization code for tokens
//   refresh  — get a new access token from the refresh-token cookie
//   logout   — drop the cookie
//
// The access token goes back to the browser, which calls the start.gg API
// directly with it. The refresh token stays in an HttpOnly cookie scoped to
// this route, so page scripts can never read it.

const REFRESH_COOKIE = "sr_refresh";
const COOKIE_PATH = "/api/auth";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 180;
// The redirect URI registered with the start.gg application must be
// `<origin>/oauth/callback`. Keep in sync with src/utils/auth/oauth.ts.
const CALLBACK_PATH = "/oauth/callback";
const CODE_RE = /^[\w.~+/=-]{1,2048}$/;

const refreshCookie = (value: string, maxAge: number, secure: boolean) =>
  [
    `${REFRESH_COOKIE}=${encodeURIComponent(value)}`,
    `Path=${COOKIE_PATH}`,
    `Max-Age=${maxAge}`,
    "HttpOnly",
    "SameSite=Strict",
    ...(secure ? ["Secure"] : []),
  ].join("; ");

const readRefreshCookie = (req: VercelRequest): string | undefined => {
  const header = req.headers.cookie;
  if (typeof header !== "string") return undefined;
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() !== REFRESH_COOKIE) continue;
    try {
      return decodeURIComponent(part.slice(eq + 1).trim()) || undefined;
    } catch {
      return undefined;
    }
  }
  return undefined;
};

const handler = async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  // Tokens must never be cached by anything between us and the browser.
  res.setHeader("Cache-Control", "no-store");

  let origin: string;
  let action: unknown;
  let code: unknown;
  try {
    origin = requireAllowedOrigin(req);
    const body = (req.body ?? {}) as Record<string, unknown>;
    if (typeof body !== "object") throw new BadRequestError("Invalid body");
    action = body.action;
    code = body.code;
  } catch (err) {
    if (respondClientError(res, err)) return;
    throw err;
  }

  // Plain-http origins only pass the allowlist for localhost, where a
  // `Secure` cookie would not be stored by every browser.
  const secure = origin.startsWith("https://");
  const redirectUri = `${origin}${CALLBACK_PATH}`;

  if (action === "logout") {
    res.setHeader("Set-Cookie", refreshCookie("", 0, secure));
    return res.status(200).json({ ok: true });
  }

  let tokens: OAuthTokens;
  try {
    if (action === "exchange") {
      if (typeof code !== "string" || !CODE_RE.test(code)) {
        return res.status(400).json({ error: "Invalid code" });
      }
      tokens = await exchangeCode(code, redirectUri);
    } else if (action === "refresh") {
      const refreshToken = readRefreshCookie(req);
      if (!refreshToken) {
        return res.status(401).json({ error: "Not logged in" });
      }
      tokens = await refreshTokens(refreshToken, redirectUri);
    } else {
      return res.status(400).json({ error: "Unknown action" });
    }
  } catch (err) {
    if (err instanceof OAuthConfigError) {
      console.error(JSON.stringify({ fn: "auth", missing: "oauth_config" }));
      return res.status(500).json({ error: err.message });
    }
    if (err instanceof OAuthUpstreamError) {
      console.warn(
        JSON.stringify({
          fn: "auth",
          upstream: "startgg",
          action,
          status: err.status,
        }),
      );
      // Only a 400/401 means start.gg turned the code or refresh token down.
      // Anything else (a 5xx, a body that is not JSON) is start.gg having a
      // bad moment: the refresh token is still good, so keep the cookie and
      // let the browser try again later.
      if (err.status !== 400 && err.status !== 401) {
        captureFnException(err, { fn: "auth", action: String(action) });
        return res.status(502).json({ error: "start.gg is unavailable" });
      }
      // A refresh token start.gg no longer accepts is of no further use.
      if (action === "refresh") {
        res.setHeader("Set-Cookie", refreshCookie("", 0, secure));
      }
      return res.status(401).json({ error: "start.gg rejected the login" });
    }
    // The token call timed out or never connected: the same as above.
    if (isTimeoutError(err) || err instanceof TypeError) {
      captureFnException(err, { fn: "auth", action: String(action) });
      return res
        .status(isTimeoutError(err) ? 504 : 502)
        .json({ error: "start.gg is unavailable" });
    }
    throw err;
  }

  if (tokens.refreshToken) {
    res.setHeader(
      "Set-Cookie",
      refreshCookie(tokens.refreshToken, COOKIE_MAX_AGE, secure),
    );
  }
  return res
    .status(200)
    .json({ accessToken: tokens.accessToken, expiresIn: tokens.expiresIn });
};

export default withLogging("auth", handler);
