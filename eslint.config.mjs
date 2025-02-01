import baseConfig from "@karyana-yandi/eslint-config/base"

/** @type {import('typescript-eslint').Config} */
export default [
  {
    ignores: [".turbo/**"],
  },
  ...baseConfig,
]
