import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Trans } from "@lingui/react/macro";

import { Spinner } from "@/components/shared/Spinner/Spinner";
import { useAuthStore } from "@/store/authStore";
import {
  completeLogin,
  isLoginAvailable,
  LoginError,
  type LoginFailureReason,
  startLogin,
} from "@/utils/auth/oauth";
import { fetchCurrentUser } from "@/utils/user/fetchCurrentUser";
import { logEvent, logWarning } from "@/utils/observability/log";

import styles from "./oauthCallback.module.scss";

// An authorization code works once, and React runs effects twice in
// development: keep one login per page load.
let loginInFlight: Promise<string> | null = null;

const finishLogin = (search: string): Promise<string> => {
  loginInFlight ??= (async () => {
    const { tokens, returnTo } = await completeLogin(search);
    const user = await fetchCurrentUser(tokens.accessToken);
    const store = useAuthStore.getState();
    store.setSession(tokens.accessToken, tokens.expiresIn);
    store.setUser(user);
    return returnTo;
  })();
  return loginInFlight;
};

// Where start.gg sends the user back to after they approve the login.
const OAuthCallbackPage = () => {
  const [, navigate] = useLocation();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    finishLogin(window.location.search)
      .then((returnTo) => {
        logEvent("user_login", {});
        if (!cancelled) navigate(returnTo, { replace: true });
      })
      .catch((err) => {
        // Already logged in: this is an old callback address opened again
        // (a restored tab, the Back button), not a login that failed.
        const { accessToken, expiresAt } = useAuthStore.getState();
        if (accessToken && expiresAt > Date.now()) {
          if (!cancelled) navigate("/", { replace: true });
          return;
        }
        const reason: LoginFailureReason =
          err instanceof LoginError ? err.reason : "profile_failed";
        // Backing out of start.gg's screen, or reopening an old callback
        // address, is not a failure of ours: counted, not sent to Sentry.
        if (reason !== "cancelled" && reason !== "stale_callback") {
          logWarning("start.gg login failed", {
            area: "auth",
            reason,
            error: err instanceof Error ? err.message : String(err),
            request_id: err instanceof LoginError ? err.requestId : undefined,
          });
        }
        logEvent("user_login_fail", { reason });
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <div className={styles.root}>
      {failed ? (
        <>
          <h1 className={styles.title}>
            <Trans>Couldn't log you in</Trans>
          </h1>
          <p className={styles.description}>
            <Trans>
              The start.gg login didn't go through. Nothing was changed.
            </Trans>
          </p>
          {isLoginAvailable() && (
            <button
              type="button"
              className={styles.retry}
              onClick={() => {
                logEvent("user_login_start", { source: "retry" });
                startLogin("/");
              }}
            >
              <Trans>Try again</Trans>
            </button>
          )}
          <Link className={styles.link} href="/">
            <Trans>Back to home</Trans>
          </Link>
        </>
      ) : (
        <>
          <Spinner size={36} />
          <p className={styles.description}>
            <Trans>Logging you in with start.gg...</Trans>
          </p>
        </>
      )}
    </div>
  );
};

export default OAuthCallbackPage;
