import type { CodegenConfig } from "@graphql-codegen/cli";
import "dotenv/config";

const token = process.env.VITE_START_GG_TOKEN || process.env.START_GG_TOKEN;

const config: CodegenConfig = {
  schema: [
    {
      "https://api.start.gg/gql/alpha": {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    },
  ],
  documents: ["src/**/*.{ts,tsx}"],
  ignoreNoDocuments: true,
  generates: {
    "./src/gql/": {
      preset: "client",
      config: {
        useTypeImports: true,
        skipTypename: false,
        enumsAsTypes: true,
        dedupeFragments: true,
        avoidOptionals: false,
      },
      presetConfig: {
        gqlTagName: "graphql",
        fragmentMasking: { unmaskFunctionName: "getFragmentData" },
      },
    },
  },
};

export default config;
