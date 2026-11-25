import { useAuthStore } from "@/store/authStore";
import { LoginError, requestLogout, requestRefresh } from "@/utils/auth/oauth";
import { logWarning } from "@/utils/observability/log";

// Refresh this long before the access token runs out (it lasts 7 days).
const REFRESH_MARGIN_MS = 2 * 24 * 60 * 60 * 1000;
// Don't hand out a token about to expire mid-request.
const EXPIRY_SLACK_MS = 60 * 1000;

// The user's access token while it is valid, else undefined.
export const getUserAccessToken = (): string | undefined => {
  const { accessToken, expiresAt } = useAuthStore.getState();
  if (!accessToken || expiresAt - EXPIRY_SLACK_MS < Date.now()) return;
  return accessToken;
};

let refreshInFlight: Promise<boolean> | null = null;

// Swaps in a fresh access token. Resolves false when there is no usable
// session any more (the local session is cleared in that case). `force`
// is for a token start.gg has already turned down: if it cannot be replaced,
// drop it rather than keep sending it.
export const refreshSession = ({
  force = false,
}: { force?: boolean } = {}): Promise<boolean> => {
  refreshInFlight ??= (async () => {
    try {
      const tokens = await requestRefresh();
      if (!tokens) {
        useAuthStore.getState().clear();
        return false;
      }
      useAuthStore.getState().setSession(tokens.accessToken, tokens.expiresIn);
      return true;
    } catch (err) {
      // Being offline is not worth a report: the session is kept and the
      // next visit tries again. (`fetch` rejects with a TypeError when the
      // request never got an answer.)
      const offline =
        err instanceof TypeError ||
        (typeof navigator !== "undefined" && !navigator.onLine);
      if (!offline) {
        logWarning("session refresh failed", {
          area: "auth",
          error: err instanceof Error ? err.message : String(err),
          request_id: err instanceof LoginError ? err.requestId : undefined,
        });
      }
      if (force) {
        useAuthStore.setState({ accessToken: null, expiresAt: 0 });
        return false;
      }
      return getUserAccessToken() !== undefined;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
};

// Called once on app start: renew a session that is close to (or past)
// expiry so the user stays logged in between visits.
export const renewSessionIfNeeded = () => {
  const { user, accessToken, expiresAt } = useAuthStore.getState();
  if (!user) return;
  if (accessToken && expiresAt - REFRESH_MARGIN_MS > Date.now()) return;
  void refreshSession();
};

export const logout = async () => {
  useAuthStore.getState().clear();
  try {
    await requestLogout();
  } catch {
    // The local session is gone either way; the cookie expires on its own.
  }
};
