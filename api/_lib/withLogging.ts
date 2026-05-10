import * as Sentry from "@sentry/node";
import { waitUntil } from "@vercel/functions";
import type { VercelRequest, VercelResponse } from "@vercel/node";

// Sentry initialization lives in `api/_instrument.ts`, which must be imported
// as the first line of each function entry. Auto-instrumentation only attaches
// to modules imported AFTER `Sentry.init`, so initializing here (which is
// imported alongside the handler's other imports) would be too late.

export type Handler = (
  req: VercelRequest,
  res: VercelResponse,
) => Promise<unknown> | unknown;

const getRequestId = (req: VercelRequest): string => {
  const header = req.headers["x-vercel-id"];
  if (typeof header === "string" && header.length > 0) return header;
  if (Array.isArray(header) && header[0]) return header[0];
  return (
    globalThis.crypto?.randomUUID?.() ??
    `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
  );
};

export const addBreadcrumb = (
  category: string,
  message: string,
  data?: Record<string, unknown>,
) => {
  Sentry.addBreadcrumb({ category, message, data, level: "info" });
};

export const captureFnException = (
  err: unknown,
  tags: Record<string, string>,
) => {
  Sentry.captureException(err, { tags });
};

export const withLogging = (name: string, handler: Handler): Handler => {
  return async (req, res) => {
    const requestId = getRequestId(req);
    const start = Date.now();
    res.setHeader("x-request-id", requestId);

    Sentry.getCurrentScope().setTag("fn", name);
    Sentry.getCurrentScope().setTag("requestId", requestId);

    try {
      await handler(req, res);
      console.log(
        JSON.stringify({
          fn: name,
          requestId,
          status: res.statusCode,
          durationMs: Date.now() - start,
          path: req.url,
        }),
      );
    } catch (err) {
      Sentry.captureException(err, { tags: { fn: name, requestId } });
      console.error(
        JSON.stringify({
          fn: name,
          requestId,
          durationMs: Date.now() - start,
          path: req.url,
          error: err instanceof Error ? err.message : String(err),
          stack: err instanceof Error ? err.stack : undefined,
        }),
      );
      if (!res.headersSent) {
        res.status(500).json({ error: "Internal error", requestId });
      }
    } finally {
      try {
        waitUntil(Sentry.flush(2000).catch(() => {}));
      } catch {
        // waitUntil isn't available in dev (vercel dev) — ignore.
      }
    }
  };
};
