import path from "path";
import { createLogger, defineConfig } from "vite";

import react from "@vitejs/plugin-react-swc";
import { analyzer } from "vite-bundle-analyzer";
import { lingui } from "@lingui/vite-plugin";
import { sentryVitePlugin } from "@sentry/vite-plugin";

import { challongeDevProxy } from "./vite-plugins/challongeDevProxy";
import { tonamelDevProxy } from "./vite-plugins/tonamelDevProxy";
import { tonamelImageProxy } from "./vite-plugins/tonamelImageProxy";
import { predictionImageDevProxy } from "./vite-plugins/predictionImageDevProxy";
import { resultsImageDevProxy } from "./vite-plugins/resultsImageDevProxy";

// Silence Vite's "Failed to load source map for ..." warnings for packages
// that ship JS with `//# sourceMappingURL=` comments but don't publish the
// .map files to npm. This noise is harmless but obscures real warnings.
const SOURCE_MAP_NOISE_PACKAGES = ["js-xxhash"];

const customLogger = createLogger();
const originalWarn = customLogger.warn.bind(customLogger);
customLogger.warn = (msg, options) => {
  if (
    msg.includes("Failed to load source map for") &&
    SOURCE_MAP_NOISE_PACKAGES.some((pkg) => msg.includes(`/${pkg}/`))
  ) {
    return;
  }
  originalWarn(msg, options);
};

// https://vite.dev/config/
export default defineConfig(() => {
  const shouldAnalyze = process.env.ANALYZE === "true";
  // Source-map upload only runs when SENTRY_AUTH_TOKEN is present (CI/Vercel
  // build). Without the token the build still succeeds — local builds skip it.
  const shouldUploadSentry = Boolean(process.env.SENTRY_AUTH_TOKEN);

  return {
    customLogger,
    build: {
      // "hidden" emits source maps but strips the //# sourceMappingURL comment
      // so they aren't served to end users — Sentry still uploads & uses them.
      sourcemap: shouldUploadSentry ? ("hidden" as const) : false,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes("node_modules")) return;
            if (id.includes("/konva/") || id.includes("/react-konva/"))
              return "konva";
            if (
              id.includes("/react/") ||
              id.includes("/react-dom/") ||
              id.includes("/scheduler/")
            )
              return "react";
            if (id.includes("/@sentry/")) return "sentry";
            if (id.includes("/posthog-js/")) return "posthog";
            if (id.includes("/urql/") || id.includes("/@urql/")) return "urql";
          },
        },
      },
    },
    plugins: [
      react({
        plugins: [["@lingui/swc-plugin", {}]],
      }),
      lingui(),
      challongeDevProxy(),
      tonamelDevProxy(),
      tonamelImageProxy(),
      predictionImageDevProxy(),
      resultsImageDevProxy(),
      shouldUploadSentry &&
        sentryVitePlugin({
          org: process.env.SENTRY_ORG,
          project: process.env.SENTRY_PROJECT,
          authToken: process.env.SENTRY_AUTH_TOKEN,
          telemetry: false,
          release: {
            name: process.env.VERCEL_GIT_COMMIT_SHA,
          },
          sourcemaps: {
            // Delete .map files after upload so they aren't served from the
            // Vercel build output (defense-in-depth on top of `sourcemap:
            // "hidden"`, which already strips the //# sourceMappingURL=).
            filesToDeleteAfterUpload: ["./dist/**/*.map"],
          },
        }),
      shouldAnalyze && analyzer(),
    ].filter(Boolean),
    optimizeDeps: {
      force: true,
      // These packages are only used by Vercel serverless functions in api/
      // and are never imported by the client. Vite would otherwise try to
      // pre-bundle them and fail on Vercel-build-time-only virtual modules
      // like `@vercel/flags-definitions`, or on native `.node` binaries
      // (resvg-js) that esbuild can't load. The image dev proxies pull these
      // in via dynamic `import("../api/...")` calls and the optimizer follows
      // that edge.
      exclude: [
        "@flags-sdk/vercel",
        "@vercel/flags-core",
        "flags",
        "@vercel/node",
        "@resvg/resvg-js",
        "satori",
        "@sentry/node",
      ],
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "@assets": path.resolve(__dirname, "./src/assets"),
        "@components": path.resolve(__dirname, "./src/components"),
        // Vercel injects this virtual module at build time. Locally / in CI
        // it doesn't exist, so map it to a no-op stub that returns undefined.
        "@vercel/flags-definitions": path.resolve(
          __dirname,
          "./vite-plugins/flagsDefinitionsStub.js",
        ),
      },
    },
  };
});
