import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary]", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          style={{
            padding: "2rem",
            margin: "1rem",
            backgroundColor: "#1a1a1a",
            color: "#f5f5f5",
            borderRadius: "8px",
            border: "1px solid #ff4444",
            fontFamily: "monospace",
            overflow: "auto",
          }}
        >
          <h2 style={{ color: "#ff4444", marginTop: 0 }}>
            Something went wrong
          </h2>
          <p style={{ color: "#ccc" }}>{this.state.error?.message}</p>
          <details>
            <summary style={{ cursor: "pointer", color: "#888" }}>
              Stack trace
            </summary>
            <pre
              style={{
                fontSize: "0.75rem",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                color: "#aaa",
                marginTop: "0.5rem",
              }}
            >
              {this.state.error?.stack}
            </pre>
          </details>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: "1rem",
              padding: "0.5rem 1rem",
              backgroundColor: "#333",
              color: "#f5f5f5",
              border: "1px solid #555",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Reload page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
