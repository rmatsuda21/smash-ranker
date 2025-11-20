import path from "path";
import { defineConfig } from "vite";

import react from "@vitejs/plugin-react-swc";
import { analyzer } from "vite-bundle-analyzer";

// https://vite.dev/config/
export default defineConfig(() => {
  return {
    plugins: [react(), analyzer()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "@assets": path.resolve(__dirname, "./src/assets"),
        "@components": path.resolve(__dirname, "./src/components"),
      },
    },
  };
});
