import path from "path";
import { defineConfig } from "vite";

import react from "@vitejs/plugin-react-swc";
import { analyzer } from "vite-bundle-analyzer";
import { lingui } from "@lingui/vite-plugin";

// https://vite.dev/config/
export default defineConfig(() => {
  const shouldAnalyze = process.env.ANALYZE === "true";

  return {
    plugins: [
      react({
        plugins: [["@lingui/swc-plugin", {}]],
      }),
      lingui(),
      shouldAnalyze && analyzer(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "@assets": path.resolve(__dirname, "./src/assets"),
        "@components": path.resolve(__dirname, "./src/components"),
      },
    },
  };
});
