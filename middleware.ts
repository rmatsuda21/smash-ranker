// Vercel Routing Middleware — runs at the edge before the SPA HTML is served.
// Purpose: inject route-aware <title>, <meta description>, and Open Graph tags
// into index.html so social-share crawlers (which don't run JS) get useful
// previews. Real users get the same modified HTML; the SPA bootstraps as
// normal from the unchanged body.
//
// Path resolution:
//   /index.html contains a dot, so it bypasses the catch-all rewrite in
//   vercel.json (`/((?!api/|@)[^.]+) -> /`) and is served as a static file.
//   The middleware matcher only includes the listed page routes, so the
//   inner fetch to /index.html doesn't recurse through this middleware.

import { getRouteMeta, renderHeadTags } from "./src/utils/seo/routeMeta.js";

export const config = {
  matcher: ["/", "/ranker", "/tier", "/predict", "/thumbnail"],
};

const OG_BLOCK_REGEX = /<!-- og:start -->[\s\S]*?<!-- og:end -->/;

export default async function middleware(request: Request): Promise<Response> {
  const url = new URL(request.url);

  let html: string;
  try {
    const shell = await fetch(`${url.origin}/index.html`);
    if (!shell.ok) {
      return fetch(request);
    }
    html = await shell.text();
  } catch {
    return fetch(request);
  }

  let meta;
  try {
    meta = await getRouteMeta(url);
  } catch {
    return new Response(html, {
      status: 200,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }

  const headTags = renderHeadTags(meta);
  const replacement = `<!-- og:start -->\n    ${headTags}\n    <!-- og:end -->`;
  const modified = html.replace(OG_BLOCK_REGEX, replacement);

  return new Response(modified, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      // Modest CDN caching keyed by full URL (path + search). Each unique
      // /predict?d=... gets its own cache entry, so tournament-specific tags
      // survive across requests. 1-hour staleness is fine for crawlers.
      "cache-control":
        "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
