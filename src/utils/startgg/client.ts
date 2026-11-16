import { cacheExchange, Client, fetchExchange } from "urql";

import { getUserAccessToken, refreshSession } from "@/utils/auth/session";

const STARTGG_GQL = "https://api.start.gg/gql/alpha";

const withToken = (
  init: RequestInit | undefined,
  token: string | undefined,
) => {
  const headers = new Headers(init?.headers);
  if (token) headers.set("authorization", `Bearer ${token}`);
  else headers.delete("authorization");
  return { ...init, headers };
};

// start.gg answers a bad token with 400 `{ message: "Invalid authentication
// token" }` rather than 401, so look at the body too.
const isTokenRejected = async (response: Response): Promise<boolean> => {
  if (response.status === 401) return true;
  if (response.status !== 400 && response.status !== 403) return false;
  try {
    const body = (await response.clone().json()) as { message?: unknown };
    return typeof body.message === "string" && /token/i.test(body.message);
  } catch {
    return false;
  }
};

// start.gg requests go out with the logged-in user's token when there is
// one, and the app's own token otherwise. If start.gg turns the user's token
// down, try once with a refreshed one, then fall back to the app token so a
// stale login never breaks tournament loading.
const startggFetch = async (
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> => {
  const appToken: string | undefined = import.meta.env.VITE_START_GG_TOKEN;
  const userToken = getUserAccessToken();

  const response = await fetch(input, withToken(init, userToken ?? appToken));
  if (!userToken || !(await isTokenRejected(response))) return response;

  const refreshed = await refreshSession({ force: true });
  const retryToken = (refreshed && getUserAccessToken()) || appToken;
  return fetch(input, withToken(init, retryToken));
};

// One client for every page: the cache is shared, and so is the auth logic.
export const startggClient = new Client({
  url: STARTGG_GQL,
  exchanges: [cacheExchange, fetchExchange],
  fetch: startggFetch as typeof fetch,
});
