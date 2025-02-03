import baseConfig from "@yopem/eslint-config/base"
import reactConfig from "@yopem/eslint-config/react"

// import tailwindCssConfig from "@yopem/eslint-config/tailwindcss"

/** @type {import('typescript-eslint').Config} */
export default [
  {
    ignores: ["dist/**"],
  },
  ...baseConfig,
  ...reactConfig,
  // ...tailwindCssConfig,
]
