// Query parameters that must not leave the browser in a URL: tournament
// slugs (`s`, `slug`), an encoded prediction or image payload (`d`), and
// start.gg's one-time login code with its state.
const SENSITIVE_PARAMS = ["s", "slug", "d", "code", "state"];

export const scrubUrl = <T extends string | undefined>(url: T): T => {
  if (!url) return url;
  try {
    const relative = url.startsWith("/");
    const parsed = new URL(url, "http://relative.invalid");
    let changed = false;
    for (const param of SENSITIVE_PARAMS) {
      if (parsed.searchParams.has(param)) {
        parsed.searchParams.delete(param);
        changed = true;
      }
    }
    if (!changed) return url;
    return (
      relative
        ? parsed.pathname + parsed.search + parsed.hash
        : parsed.toString()
    ) as T;
  } catch {
    return url;
  }
};

// "production" for the live site, "preview" for a Vercel preview deploy
// (which is also a production build), "development" locally.
export const getAppEnvironment = (): string =>
  import.meta.env.VITE_VERCEL_ENV || import.meta.env.MODE;
