// Builds the browser extension into extension/dist/<browser>, ready to load
// unpacked or, with --zip, to upload to the browsers' stores.
//
//   bun run build:extension                              every browser, linking to smash-ranker.app
//   bun run build:extension --browser firefox            one browser
//   bun run build:extension --site http://localhost:5173 links to a dev server
//   bun run build:extension --zip                        also the store uploads
//
// "chromium" is Chrome, Edge, Brave, Opera, Vivaldi and Arc: one package
// for all of them. "firefox" is Firefox on desktop and Android.

import { existsSync, statSync } from "node:fs";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import { $, type BunPlugin } from "bun";
import { Resvg } from "@resvg/resvg-js";

const ROOT = import.meta.dir;
// Bun writes each module's path into the bundle, relative to where it runs:
// building from here wherever it is started from makes every build of a
// version identical, which Firefox's review checks against the upload.
process.chdir(ROOT);
const REPO = join(ROOT, "..");
const DIST = join(ROOT, "dist");
const ICON_SIZES = [16, 32, 48, 128];

const BROWSERS = ["chromium", "firefox"] as const;
type Browser = (typeof BROWSERS)[number];

// What Firefox needs on top of the shared manifest. The id is the add-on's
// identity on addons.mozilla.org and must never change once published.
// Declaring no data collection is required of new add-ons; Firefox reads the
// declaration from version 140 (142 on Android).
const FIREFOX_SETTINGS = {
  browser_specific_settings: {
    gecko: {
      id: "extension@smash-ranker.app",
      strict_min_version: "140.0",
      data_collection_permissions: { required: ["none"] },
    },
    gecko_android: { strict_min_version: "142.0" },
  },
};

const args = process.argv.slice(2);
const option = (name: string) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
};

const site = (option("--site") ?? "https://smash-ranker.app").replace(
  /\/+$/,
  "",
);
if (!/^https?:\/\//.test(site)) {
  throw new Error("--site needs an address, such as http://localhost:5173");
}
const only = option("--browser");
if (only && !BROWSERS.includes(only as Browser)) {
  throw new Error(`--browser is one of ${BROWSERS.join(", ")}`);
}
const browsers: readonly Browser[] = only ? [only as Browser] : BROWSERS;
const zip = args.includes("--zip");

await rm(DIST, { recursive: true, force: true });
const scripts = join(DIST, ".scripts");

// The site's modules import each other as "@/…". Bun would read that alias
// from the site's own tsconfig.json, which the source archive leaves out, so
// it is resolved here: the build needs nothing of the site but the files it
// bundles.
const siteAlias: BunPlugin = {
  name: "site-alias",
  setup(build) {
    build.onResolve({ filter: /^@\// }, ({ path }) => {
      const base = join(REPO, "src", path.slice(2));
      const file = ["", ".ts", ".tsx", "/index.ts"]
        .map((suffix) => base + suffix)
        .find(
          (candidate) => existsSync(candidate) && statSync(candidate).isFile(),
        );
      if (!file) throw new Error(`Cannot find ${path} in ${join(REPO, "src")}`);
      return { path: file };
    });
  },
};

// Content scripts are classic scripts, so both bundles are self-contained.
// Not minified: store reviewers read them.
const result = await Bun.build({
  entrypoints: [join(ROOT, "src/content.ts"), join(ROOT, "src/popup.ts")],
  outdir: scripts,
  target: "browser",
  format: "iife",
  metafile: true,
  plugins: [siteAlias],
  define: { __SITE_URL__: JSON.stringify(site) },
});
if (!result.success) {
  for (const log of result.logs) console.error(log);
  process.exit(1);
}

// The toolbar icon: the site's logo on its dark ground. At 128 pixels, the
// size the stores and the install prompt show, Chrome asks for 96 pixels of
// artwork in 16 pixels of clear space.
const logo = await readFile(join(REPO, "public/favicon.svg"), "utf8");
const logoPaths = logo.replace(/^[\s\S]*?<svg[^>]*>|<\/svg>\s*$/g, "");
const iconSvg = (padding: number) => {
  const pad = (400 * padding) / (1 - 2 * padding);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-pad} ${-pad} ${400 + 2 * pad} ${400 + 2 * pad}" fill="none">
  <rect width="400" height="400" rx="88" fill="#0e0e10"/>
  <g transform="translate(64 60) scale(0.68)">${logoPaths}</g>
</svg>`;
};
const icons = ICON_SIZES.map((size) => ({
  size,
  png: new Resvg(iconSvg(size === 128 ? 16 / 128 : 0), {
    fitTo: { mode: "width", value: size },
  })
    .render()
    .asPng(),
}));

const manifest = JSON.parse(
  await readFile(join(ROOT, "manifest.json"), "utf8"),
);
const { version } = manifest;

for (const browser of browsers) {
  const out = join(DIST, browser);
  await mkdir(join(out, "icons"), { recursive: true });
  await cp(scripts, out, { recursive: true });
  for (const file of ["popup.html", "popup.css", "_locales"]) {
    await cp(join(ROOT, file), join(out, file), { recursive: true });
  }
  for (const { size, png } of icons) {
    await writeFile(join(out, `icons/icon-${size}.png`), png);
  }
  const browserManifest =
    browser === "firefox" ? { ...manifest, ...FIREFOX_SETTINGS } : manifest;
  await writeFile(
    join(out, "manifest.json"),
    `${JSON.stringify(browserManifest, null, 2)}\n`,
  );
  console.log(`Built ${browser} ${version} into ${relative(REPO, out)}`);

  if (zip) {
    const file = join(DIST, `smash-ranker-${browser}-${version}.zip`);
    await $`zip -qr ${file} .`.cwd(out);
    console.log(`Wrote ${relative(REPO, file)}`);
  }
}
await rm(scripts, { recursive: true, force: true });
console.log(`Links go to ${site}`);

// addons.mozilla.org asks for the source of bundled code and how to build
// it: the files the bundles were made from (the extension's own and the few
// it takes from the site), plus the extension's package, which installs only
// what this build needs. The reviewer builds it from `extension/`.
if (zip && browsers.includes("firefox")) {
  const bundled = Object.keys(result.metafile?.inputs ?? {})
    .map((path) => relative(REPO, resolve(process.cwd(), path)))
    .filter((path) => !path.includes("node_modules"));
  const files = [
    ...new Set([
      ...bundled,
      "extension/build.ts",
      "extension/manifest.json",
      "extension/popup.html",
      "extension/popup.css",
      "extension/_locales",
      "extension/src",
      "extension/tsconfig.json",
      "extension/README.md",
      "extension/package.json",
      "extension/bun.lock",
      "public/favicon.svg",
    ]),
  ];
  const file = join(DIST, `smash-ranker-source-${version}.zip`);
  await $`zip -qr ${file} ${files}`.cwd(REPO);
  console.log(`Wrote ${relative(REPO, file)} (source for Firefox's review)`);
}
