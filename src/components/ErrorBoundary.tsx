import { Component, type ErrorInfo, type ReactNode } from "react";
import { Trans } from "@lingui/react/macro";
import cn from "classnames";

import { captureException } from "@/utils/observability/sentry";
import { isChunkLoadError, reloadForStaleChunk } from "@/utils/staleChunk";

import styles from "./ErrorBoundary.module.scss";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  // "app" covers the whole window (the root boundary); "page" sits inside the
  // layout, so the header and navigation stay usable.
  variant?: "app" | "page";
  // The boundary clears its error when this changes (the current path), so
  // navigating away from a broken page works.
  resetKey?: string;
}

interface State {
  error: Error | null;
  // A page chunk failed to load: a stale tab or a dropped connection.
  chunkError: boolean;
  reloading: boolean;
  // Sentry's id for the report, shown so a user can quote it.
  eventId: string | null;
  resetStep: "idle" | "confirm" | "working";
}

const INITIAL_STATE: State = {
  error: null,
  chunkError: false,
  reloading: false,
  eventId: null,
  resetStep: "idle",
};

// Erases everything the app keeps on this device. Loaded on demand so the
// boundary depends on as little as possible; if even that fails, clearing
// localStorage still removes the persisted state that can break a render.
const resetAppData = async () => {
  try {
    const { factoryReset } = await import("@/utils/debug/factoryReset");
    await factoryReset();
  } catch {
    try {
      localStorage.clear();
    } catch {
      // Nothing left to try.
    }
    window.location.reload();
  }
};

export class ErrorBoundary extends Component<Props, State> {
  state: State = INITIAL_STATE;

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error, chunkError: isChunkLoadError(error) };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (isChunkLoadError(error)) {
      // Not reported: Sentry drops these too (see sentry.ts).
      if (reloadForStaleChunk()) this.setState({ reloading: true });
      return;
    }
    console.error("[ErrorBoundary]", error, errorInfo);
    const eventId = captureException(error, {
      area: "render",
      componentStack: errorInfo.componentStack,
      boundary: this.props.variant ?? "app",
    });
    if (eventId) this.setState({ eventId });
  }

  componentDidUpdate(prevProps: Props) {
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
      this.setState(INITIAL_STATE);
    }
  }

  handleReset = () => {
    if (this.state.resetStep === "idle") {
      this.setState({ resetStep: "confirm" });
      return;
    }
    this.setState({ resetStep: "working" });
    void resetAppData();
  };

  render() {
    const { error, chunkError, reloading, eventId, resetStep } = this.state;
    if (!error) return this.props.children;
    if (reloading) return null;
    if (this.props.fallback) return this.props.fallback;

    return (
      <div
        className={cn(styles.root, this.props.variant !== "page" && styles.app)}
        role="alert"
      >
        <h1 className={styles.title}>
          {chunkError ? (
            <Trans>Couldn't load this page</Trans>
          ) : (
            <Trans>Something went wrong</Trans>
          )}
        </h1>
        <p className={styles.description}>
          {chunkError ? (
            <Trans>Check your connection, then reload the page.</Trans>
          ) : (
            <Trans>
              Reload the page to try again. If it keeps happening, resetting the
              app's data on this device usually fixes it.
            </Trans>
          )}
        </p>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.primary}
            onClick={() => window.location.reload()}
          >
            <Trans>Reload page</Trans>
          </button>
          {!chunkError && (
            <button
              type="button"
              className={styles.secondary}
              onClick={this.handleReset}
              disabled={resetStep === "working"}
            >
              {resetStep === "idle" && <Trans>Reset app data</Trans>}
              {resetStep === "confirm" && (
                <Trans>Erase saved designs and settings?</Trans>
              )}
              {resetStep === "working" && <Trans>Resetting…</Trans>}
            </button>
          )}
        </div>
        {eventId && (
          <p className={styles.reference}>
            <Trans>Error code</Trans>: <code>{eventId}</code>
          </p>
        )}
        {import.meta.env.DEV && (
          <details className={styles.details}>
            <summary>{error.message}</summary>
            <pre>{error.stack}</pre>
          </details>
        )}
      </div>
    );
  }
}
