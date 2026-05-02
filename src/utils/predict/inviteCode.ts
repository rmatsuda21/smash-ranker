import type { Platform } from "@/consts/platforms";

const VERSION = "1";

const PLATFORM_TO_CHAR: Record<Platform, string> = {
  startgg: "s",
  challonge: "c",
  tonamel: "t",
};

const CHAR_TO_PLATFORM: Record<string, Platform> = {
  s: "startgg",
  c: "challonge",
  t: "tonamel",
};

const MAX_DECODED_LENGTH = 512;

export type InvitePayload = { platform: Platform; slug: string };

const base64urlEncode = (text: string): string => {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
};

const base64urlDecode = (code: string): string | null => {
  if (!/^[A-Za-z0-9_-]*$/.test(code)) return null;
  try {
    const padded = code.replace(/-/g, "+").replace(/_/g, "/");
    const padCount = (4 - (padded.length % 4)) % 4;
    const binary = atob(padded + "=".repeat(padCount));
    if (binary.length > MAX_DECODED_LENGTH) return null;
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
};

const compactSlug = (platform: Platform, slug: string): string => {
  if (platform !== "startgg") return slug;
  const match = slug.match(/^tournament\/([^/]+)\/event\/([^/]+)$/);
  return match ? `${match[1]}/${match[2]}` : slug;
};

const expandSlug = (platform: Platform, compact: string): string | null => {
  if (platform !== "startgg") return compact;
  const parts = compact.split("/");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  return `tournament/${parts[0]}/event/${parts[1]}`;
};

export const encodeInvite = ({ platform, slug }: InvitePayload): string => {
  const payload = `${VERSION}${PLATFORM_TO_CHAR[platform]}${compactSlug(platform, slug)}`;
  return base64urlEncode(payload);
};

export const decodeInvite = (code: string | null): InvitePayload | null => {
  if (!code) return null;
  const text = base64urlDecode(code);
  if (!text || text.length < 3) return null;
  if (text[0] !== VERSION) return null;
  const platform = CHAR_TO_PLATFORM[text[1]];
  if (!platform) return null;
  const slug = expandSlug(platform, text.slice(2));
  if (!slug) return null;
  return { platform, slug };
};
