import { BadRequestError } from "./errors.js";

const SLUG_RE = /^[A-Za-z0-9_-]+$/;

export const parseSlug = (raw: unknown, max = 128): string => {
  if (typeof raw !== "string" || raw.length === 0) {
    throw new BadRequestError("Missing required query param: slug");
  }
  if (raw.length > max) {
    throw new BadRequestError("Slug too long");
  }
  if (!SLUG_RE.test(raw)) {
    throw new BadRequestError("Slug contains disallowed characters");
  }
  return raw;
};

export const parsePlayerCount = (
  raw: unknown,
  fallback = 20,
  max = 256,
): number => {
  if (raw === undefined || raw === null || raw === "") return fallback;
  const n = typeof raw === "string" ? parseInt(raw, 10) : Number(raw);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(Math.floor(n), max);
};

// Reject IPv4 and IPv6 literals outright. Hostnames forwarded to a fetch can
// otherwise target the function's own network (link-local 169.254.169.254,
// loopback, RFC1918) and we have no use case for hitting raw IPs anyway.
const looksLikeIp = (hostname: string): boolean => {
  const host = hostname.startsWith("[") ? hostname.slice(1, -1) : hostname;
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) return true;
  if (host.includes(":")) return true;
  return false;
};

/**
 * Parse a URL intended to be fetched server-side. Always requires https,
 * always rejects IP-literal hostnames (private and public), and optionally
 * restricts to a fixed allowlist of hostnames.
 */
export const parseImageUrl = (
  raw: unknown,
  allowedHosts?: readonly string[],
): URL => {
  if (typeof raw !== "string" || raw.length === 0) {
    throw new BadRequestError("Missing required query param: url");
  }
  if (raw.length > 2048) {
    throw new BadRequestError("URL too long");
  }

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new BadRequestError("Invalid URL");
  }

  if (parsed.protocol !== "https:") {
    throw new BadRequestError("URL protocol not allowed");
  }

  if (looksLikeIp(parsed.hostname)) {
    throw new BadRequestError("URL host not allowed");
  }

  if (allowedHosts && !allowedHosts.includes(parsed.hostname)) {
    throw new BadRequestError("Host not allowed");
  }

  return parsed;
};

export const parseBase64UrlPayload = (
  raw: unknown,
  maxBytes: number,
): string => {
  if (typeof raw !== "string" || raw.length === 0) {
    throw new BadRequestError("Missing 'd' query parameter");
  }
  // Base64url expands ~3 bytes per 4 chars; cap the encoded length so we
  // bound work before any decode/parse.
  const maxEncoded = Math.ceil((maxBytes * 4) / 3) + 4;
  if (raw.length > maxEncoded) {
    throw new BadRequestError("Payload too large");
  }
  let decoded: string;
  try {
    decoded = Buffer.from(raw, "base64url").toString("utf8");
  } catch {
    throw new BadRequestError("Invalid payload encoding");
  }
  if (decoded.length > maxBytes) {
    throw new BadRequestError("Payload too large");
  }
  return decoded;
};
