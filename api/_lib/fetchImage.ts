// Shared limits for images fetched from other hosts. An icon is a few hundred
// kilobytes at most; anything far past that is not an icon, and reading it
// whole would hold it in memory (and, base64-encoded, in the caches).
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

// Reads a response body, giving up (null) once it passes `maxBytes`. The
// declared length is checked first so an oversized file is never downloaded.
export const readImageBody = async (
  res: Response,
  maxBytes = MAX_IMAGE_BYTES,
): Promise<Buffer | null> => {
  const declared = Number(res.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes) {
    await res.body?.cancel().catch(() => {});
    return null;
  }
  if (!res.body) {
    const buf = Buffer.from(await res.arrayBuffer());
    return buf.length > maxBytes ? null : buf;
  }

  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel().catch(() => {});
      return null;
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks);
};

// Per-request record of assets that were asked for and did not arrive for a
// reason that may pass (timeout, network, upstream 5xx). An image rendered
// without them must not be cached as if it were the real one. A 404 or an
// oversized file is not counted: asking again would give the same answer.
export type AssetTracker = { degraded: boolean };

export const isTransientStatus = (status: number): boolean =>
  status === 408 || status === 429 || status >= 500;

// A timed-out upstream call, so handlers can answer 504 instead of 500.
export const isTimeoutError = (err: unknown): boolean =>
  err instanceof Error &&
  (err.name === "TimeoutError" || err.name === "AbortError");
