import type { LinguiConfig } from "@lingui/conf";

const config: LinguiConfig = {
  locales: ["en", "ja"],
  catalogs: [
    {
      path: "src/locales/ranker/{locale}",
      include: ["src"],
      exclude: ["src/components/tierlist/**", "src/consts/tierlist/**"],
    },
    {
      path: "src/locales/tierlist/{locale}",
      include: ["src/components/tierlist/**", "src/consts/tierlist/**"],
    },
  ],
  catalogsMergePath: "src/locales/{locale}",
};

export default config;
