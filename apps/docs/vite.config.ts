import mdx from "@mdx-js/rollup"
import stylex from "@stylexjs/unplugin"
import { devtools } from "@tanstack/devtools-vite"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import viteReact from "@vitejs/plugin-react"
import { styleProps } from "@yopem-ui/compiler/unplugin"
import { nitro } from "nitro/vite"
import { resolve } from "node:path"
import { defineConfig } from "vite"

const root = resolve(import.meta.dirname, "../..")
const styleXOptions = {
  aliases: {
    "@registry/*": [resolve(root, "packages/registry/src/*")],
  },
  runtimeInjection: false,
  treeshakeCompensation: true,
  unstable_moduleResolution: { rootDir: root, type: "commonJS" as const },
  // TanStack Start loads its reset after StyleX in dev; layers invert precedence.
  useCSSLayers: false,
  devMode: "css-only" as const,
}

const mdxPlugin = mdx()
const transformMdx = mdxPlugin.transform
if (typeof transformMdx !== "function")
  throw new Error("MDX plugin transform unavailable")
mdxPlugin.transform = function (code, id) {
  if (id.includes("?raw")) return Promise.resolve(undefined)
  return transformMdx.call(this, code, id)
}

const config = defineConfig({
  build: { cssCodeSplit: false },
  optimizeDeps: { exclude: ["@resvg/resvg-js"] },
  resolve: { tsconfigPaths: true },
  plugins: [
    devtools({ injectSource: { enabled: false } }),
    styleProps.vite(),
    stylex.vite(styleXOptions),
    nitro({
      rolldownConfig: {
        // Nitro rechunks SSR modules; preserve token initialization before themes.
        output: { strictExecutionOrder: true },
      },
      rollupConfig: {
        external: [
          /^@resvg\/resvg-js/,
          /^@sentry\//,
          /^harfbuzzjs$/,
          /^satori$/,
        ],
      },
    }),
    tanstackStart(),
    mdxPlugin,
    viteReact(),
  ],
})

export default config
