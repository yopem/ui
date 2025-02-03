import baseConfig from "@yopem/eslint-config/base"

/** @type {import('typescript-eslint').Config} */
export default [
  {
    ignores: [".turbo/**"],
  },
  ...baseConfig,
]
