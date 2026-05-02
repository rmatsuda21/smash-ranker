import path from "path";
import { createLogger, defineConfig } from "vite";

import react from "@vitejs/plugin-react-swc";
import { analyzer } from "vite-bundle-analyzer";
import { lingui } from "@lingui/vite-plugin";

import { challongeDevProxy } from "./vite-plugins/challongeDevProxy";
import { tonamelDevProxy } from "./vite-plugins/tonamelDevProxy";
import { tonamelImageProxy } from "./vite-plugins/tonamelImageProxy";
import { predictionImageDevProxy } from "./vite-plugins/predictionImageDevProxy";

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

  return {
    customLogger,
    plugins: [
      react({
        plugins: [["@lingui/swc-plugin", {}]],
      }),
      lingui(),
      challongeDevProxy(),
      tonamelDevProxy(),
      tonamelImageProxy(),
      predictionImageDevProxy(),
      shouldAnalyze && analyzer(),
    ].filter(Boolean),
    optimizeDeps: {
      force: true,
      // These packages are only used by Vercel serverless functions in api/
      // and are never imported by the client. Vite would otherwise try to
      // pre-bundle them and fail on Vercel-build-time-only virtual modules
      // like `@vercel/flags-definitions`.
      exclude: [
        "@flags-sdk/vercel",
        "@vercel/flags-core",
        "flags",
        "@vercel/node",
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
