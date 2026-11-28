import { Trans } from "@lingui/react/macro";
import { FaArrowRight, FaRightToBracket } from "react-icons/fa6";

import { isLoginAvailable, startLogin } from "@/utils/auth/oauth";
import { logEvent } from "@/utils/observability/log";

import styles from "./LoginPrompt.module.scss";

// Logged-out home page: one quiet line under the hero that offers the login.
// `source` says where it was shown, for analytics.
export const LoginPrompt = ({
  returnTo = "/",
  source = "prompt",
}: {
  returnTo?: string;
  source?: "prompt" | "gate";
}) => {
  if (!isLoginAvailable()) return null;

  return (
    <button
      type="button"
      className={styles.prompt}
      onClick={() => {
        logEvent("user_login_start", { source });
        startLogin(returnTo);
      }}
    >
      <span className={styles.mark}>
        <FaRightToBracket aria-hidden="true" />
      </span>
      <span className={styles.text}>
        <span className={styles.title}>
          <Trans>Log in with start.gg</Trans>
        </span>
        <span className={styles.caption}>
          <Trans>Jump straight to graphics for your own tournaments</Trans>
        </span>
      </span>
      <FaArrowRight className={styles.arrow} aria-hidden="true" />
    </button>
  );
};
