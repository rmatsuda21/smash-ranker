import type { LinguiConfig } from "@lingui/conf";

// The terms of service's strings: long text read on one page, so kept out of
// the catalog every page loads at startup (see lingui.recap.config.ts for why
// that needs a config of its own). Compiled to src/locales/tos/{locale}.ts and
// loaded when the page opens: `loadTosCatalog` in src/i18n.ts.
const config: LinguiConfig = {
  locales: ["en", "ja"],
  catalogs: [
    {
      path: "src/locales/tos/{locale}",
      include: ["src/pages/tos.tsx"],
    },
  ],
};

export default config;
