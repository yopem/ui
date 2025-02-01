import baseConfig from "@karyana-yandi/eslint-config/base"
import reactConfig from "@karyana-yandi/eslint-config/react"
import tailwindCssConfig from "@karyana-yandi/eslint-config/tailwindcss"

/** @type {import('typescript-eslint').Config} */
export default [
  {
    ignores: ["dist/**"],
  },
  ...baseConfig,
  ...reactConfig,
  ...tailwindCssConfig,
]
