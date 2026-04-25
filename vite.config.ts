import path from "path";
import { defineConfig } from "vite";

import react from "@vitejs/plugin-react-swc";
import { analyzer } from "vite-bundle-analyzer";
import { lingui } from "@lingui/vite-plugin";

import { challongeDevProxy } from "./vite-plugins/challongeDevProxy";
import { tonamelDevProxy } from "./vite-plugins/tonamelDevProxy";
import { tonamelImageProxy } from "./vite-plugins/tonamelImageProxy";
import { predictionImageDevProxy } from "./vite-plugins/predictionImageDevProxy";

// https://vite.dev/config/
export default defineConfig(() => {
  const shouldAnalyze = process.env.ANALYZE === "true";

  return {
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
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "@assets": path.resolve(__dirname, "./src/assets"),
        "@components": path.resolve(__dirname, "./src/components"),
      },
    },
  };
});
