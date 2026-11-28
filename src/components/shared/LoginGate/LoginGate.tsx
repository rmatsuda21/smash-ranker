import type { ReactNode } from "react";
import { Trans } from "@lingui/react/macro";

import { LoginPrompt } from "@/components/home/LoginPrompt/LoginPrompt";
import { useAuthUser } from "@/store/authStore";
import { isLoginRequired } from "@/utils/auth/loginGate";

import styles from "./LoginGate.module.scss";

// Wraps a route. While the site needs a login, someone who is not logged in
// gets the login in the page's place, and the page itself is never loaded.
// They come back to the same address, query included, so a tool link still
// loads its tournament afterwards. `page` picks the heading.
export const LoginGate = ({
  children,
  page = "tool",
}: {
  children: ReactNode;
  page?: "tool" | "tournament";
}) => {
  const user = useAuthUser();
  if (user || !isLoginRequired()) return children;

  return (
    <div className={styles.root}>
      <h1 className={styles.title}>
        {page === "tournament" ? (
          <Trans>Log in to see this tournament</Trans>
        ) : (
          <Trans>Log in to use this tool</Trans>
        )}
      </h1>
      <p className={styles.text}>
        <Trans>
          Smash Ranker needs a start.gg login for now. It takes a few seconds,
          and you come straight back to this page.
        </Trans>
      </p>
      <LoginPrompt
        returnTo={window.location.pathname + window.location.search}
        source="gate"
      />
    </div>
  );
};
