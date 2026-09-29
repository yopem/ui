import baseConfig from "@yopem/oxlint-config"
import { defineConfig } from "oxlint"

export default defineConfig({
  extends: [baseConfig],
  plugins: [
    "eslint",
    "import",
    "jsx-a11y",
    "oxc",
    "promise",
    "react",
    "react-perf",
    "typescript",
    "unicorn",
  ],
  jsPlugins: [
    {
      name: "yopem-ui",
      specifier: "./packages/oxlint-plugin/src/index.ts",
    },
  ],
  overrides: [
    {
      files: ["apps/docs/src/**/*.{tsx,jsx}"],
      rules: {
        "yopem-ui/enforce-styling-methods": [
          "error",
          {
            methods: {
              className: false,
              css: false,
              reactStyle: false,
              stylexStyle: false,
              xstyle: true,
            },
          },
        ],
        "yopem-ui/no-raw-stylex-colors": "error",
        "yopem-ui/static-stylex": "error",
        "yopem-ui/valid-polymorphic-as": "error",
      },
    },
  ],
  ignorePatterns: ["**/bun.lock", "**/AGENTS.md"],
})
