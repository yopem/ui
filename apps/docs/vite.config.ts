import stylex from "@stylexjs/unplugin"
import { devtools } from "@tanstack/devtools-vite"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import viteReact from "@vitejs/plugin-react"
import { nitro } from "nitro/vite"
import { resolve } from "node:path"
import { defineConfig } from "vite"

const config = defineConfig(({ mode }) => {
  const isTestMode = mode === "test"

  return {
    // Shared CSS avoids mismatched stylesheet asset references in SSR and client builds.
    build: { cssCodeSplit: false },
    resolve: { tsconfigPaths: true },
    plugins: [
      stylex.vite({
        aliases: {
          "@registry/*": [
            resolve(import.meta.dirname, "../../packages/registry/src/*"),
          ],
        },
        dev: isTestMode,
        devMode: isTestMode ? "full" : "off",
        runtimeInjection: false,
        treeshakeCompensation: true,
        unstable_moduleResolution: { type: "commonJS" },
        useCSSLayers: true,
      }),
      devtools(),
      nitro({ rollupConfig: { external: [/^@sentry\//] } }),
      tanstackStart(),
      viteReact(),
    ],
  }
})

export default config
