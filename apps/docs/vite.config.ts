import stylex from "@stylexjs/unplugin"
import { devtools } from "@tanstack/devtools-vite"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import viteReact from "@vitejs/plugin-react"
import { nitro } from "nitro/vite"
import { resolve } from "node:path"
import { defineConfig } from "vite"

const config = defineConfig({
  define: {
    __YOPEM_TEST_HARNESS__: JSON.stringify(
      process.env.VITE_YOPEM_TEST_HARNESS === "1",
    ),
  },
  resolve: { tsconfigPaths: true },
  plugins: [
    stylex.vite({
      aliases: {
        "@registry/*": [
          resolve(import.meta.dirname, "../../packages/registry/src/*"),
        ],
      },
      dev: process.env.VITE_YOPEM_TEST_HARNESS === "1",
      devMode: process.env.VITE_YOPEM_TEST_HARNESS === "1" ? "full" : "off",
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
})

export default config
