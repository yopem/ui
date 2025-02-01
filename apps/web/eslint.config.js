import baseConfig, {
  restrictEnvAccess,
} from "@karyana-yandi/eslint-config/base"
import nextjsConfig from "@karyana-yandi/eslint-config/nextjs"
import reactConfig from "@karyana-yandi/eslint-config/react"
import tailwindCssConfig from "@karyana-yandi/eslint-config/tailwindcss"

/** @type {import('typescript-eslint').Config} */
export default [
  {
    ignores: [".next/**"],
  },
  ...baseConfig,
  ...reactConfig,
  ...nextjsConfig,
  ...restrictEnvAccess,
  ...tailwindCssConfig,
]
