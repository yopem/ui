import type { Options as StyleXOptions } from "@stylexjs/babel-plugin"

import babel from "@rolldown/plugin-babel"
// @ts-expect-error @stylexjs/postcss-plugin does not publish declarations
import styleXPostcss from "@stylexjs/postcss-plugin"
import { devtools } from "@tanstack/devtools-vite"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import viteReact from "@vitejs/plugin-react"
import { nitro } from "nitro/vite"
import { resolve } from "node:path"
import { defineConfig } from "vite"

const root = resolve(import.meta.dirname, "../..")
const stylePropsBabel = "@yopem/registry/lib/style-props-babel"
const styleXOptions = {
  aliases: {
    "@registry/*": [resolve(root, "packages/registry/src/*")],
  },
  runtimeInjection: false,
  treeshakeCompensation: true,
  unstable_moduleResolution: { rootDir: root, type: "commonJS" },
} satisfies Partial<StyleXOptions>

const config = defineConfig({
  build: { cssCodeSplit: false },
  css: {
    postcss: {
      plugins: [
        styleXPostcss({
          babelConfig: {
            babelrc: false,
            configFile: false,
            parserOpts: { plugins: ["typescript", "jsx"] },
            plugins: [
              stylePropsBabel,
              ["@stylexjs/babel-plugin", styleXOptions],
            ],
          },
          cwd: import.meta.dirname,
          include: [
            "src/**/*.{js,jsx,ts,tsx}",
            "../../packages/registry/src/**/*.{js,jsx,ts,tsx}",
          ],
          useCSSLayers: true,
        }),
      ],
    },
  },
  optimizeDeps: { exclude: ["@resvg/resvg-js"] },
  resolve: { tsconfigPaths: true },
  plugins: [
    devtools({ injectSource: { enabled: false } }),
    babel({
      plugins: [stylePropsBabel, ["@stylexjs/babel-plugin", styleXOptions]],
    }),
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
    viteReact(),
  ],
})

export default config
