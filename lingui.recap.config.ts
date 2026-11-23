import type { LinguiConfig } from "@lingui/conf";

// The yearly recap's strings, kept out of the catalog every page loads at
// startup (lingui.config.ts merges all of its catalogs into one file, and a
// merge cannot leave one out). Compiled to src/locales/recap/{locale}.ts and
// loaded when the recap opens: `loadRecapCatalog` in src/i18n.ts.
const config: LinguiConfig = {
  locales: ["en", "ja"],
  catalogs: [
    {
      path: "src/locales/recap/{locale}",
      include: ["src/components/recap/**", "src/consts/recap/**"],
    },
  ],
};

export default config;
