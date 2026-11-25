import { Link } from "wouter";
import { Trans } from "@lingui/react/macro";

import styles from "./notFound.module.scss";

export const NotFoundPage = () => (
  <div className={styles.root}>
    <h1 className={styles.title}>
      <Trans>Page not found</Trans>
    </h1>
    <p className={styles.description}>
      <Trans>
        There is nothing at this address. The link may be mistyped, or the page
        may not be available right now.
      </Trans>
    </p>
    <Link href="/" className={styles.link}>
      <Trans>Back to home</Trans>
    </Link>
  </div>
);
