import mdx from "@mdx-js/rollup"
import babel from "@rolldown/plugin-babel"
import { devtools } from "@tanstack/devtools-vite"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import viteReact from "@vitejs/plugin-react"
import { nitro } from "nitro/vite"
import { readdirSync } from "node:fs"
import { createRequire } from "node:module"
import { resolve } from "node:path"
import { defineConfig } from "vite"

const root = resolve(import.meta.dirname, "../..")

const stylexOptions = {
  aliases: { "@registry/*": [resolve(root, "packages/registry/src/*")] },
  dev: process.env.NODE_ENV !== "production",
  runtimeInjection: false,
  treeshakeCompensation: true,
  unstable_moduleResolution: { rootDir: root, type: "commonJS" as const },
}

const stylexPlugins: [string, object][] = [
  ["@stylexjs/babel-plugin", stylexOptions],
]

const loadStylexPostcss: unknown = createRequire(import.meta.url)(
  "@stylexjs/postcss-plugin",
)

// oxlint-disable-next-line quality/no-runtime-typeof -- SAFETY: validate dynamic export before call.
if (typeof loadStylexPostcss !== "function")
  throw new Error("StyleX PostCSS plugin unavailable")

const stylexPostcssPlugin: unknown = loadStylexPostcss({
  cwd: import.meta.dirname,
  include: [
    "src/**/*.{js,jsx,ts,tsx}",
    "../../packages/registry/src/**/*.{js,jsx,ts,tsx}",
  ],
  babelConfig: {
    babelrc: false,
    parserOpts: { plugins: ["typescript", "jsx"] },
    plugins: stylexPlugins,
  },
  // TanStack Start loads its reset after StyleX in dev; layers invert precedence.
  useCSSLayers: false,
})

function isPostcssPlugin(value: unknown): value is { postcssPlugin: string } {
  return (
    // oxlint-disable-next-line quality/no-runtime-typeof -- SAFETY: validate unknown plugin shape.
    typeof value === "object" &&
    value !== null &&
    "postcssPlugin" in value &&
    // oxlint-disable-next-line quality/no-runtime-typeof -- SAFETY: plugin contract requires string name.
    typeof value.postcssPlugin === "string"
  )
}

if (!isPostcssPlugin(stylexPostcssPlugin))
  throw new Error("Invalid StyleX PostCSS plugin")

const mdxPlugin = mdx()

const transformMdx = mdxPlugin.transform

// oxlint-disable-next-line quality/no-runtime-typeof -- SAFETY: validate optional plugin hook before call.
if (typeof transformMdx !== "function")
  throw new Error("MDX plugin transform unavailable")

mdxPlugin.transform = function (code, id) {
  if (id.includes("?raw")) return Promise.resolve(undefined)

  return transformMdx.call(this, code, id)
}

const config = defineConfig({
  build: { cssCodeSplit: false },
  css: { postcss: { plugins: [stylexPostcssPlugin] } },
  environments: {
    client: {
      build: {
        rolldownOptions: {
          output: {
            codeSplitting: {
              groups: [
                {
                  name: "shiki-languages",
                  test: /[\\/]@shikijs[\\/]langs[\\/]/,
                  maxSize: 300_000,
                },
              ],
            },
          },
        },
      },
    },
  },
  optimizeDeps: { exclude: ["@resvg/resvg-js"] },
  resolve: { dedupe: ["react", "react-dom"], tsconfigPaths: true },
  ssr: { noExternal: ["@base-ui/react", "@base-ui/utils"] },
  plugins: [
    devtools({ injectSource: { enabled: false } }),
    babel({ plugins: stylexPlugins }),
    {
      name: "docs-markdown-routes",
      configureServer(server) {
        server.middlewares.use((request, _response, next) => {
          if (
            request.method === "GET" &&
            /^\/(?:components(?:\/[^/?]+)?|docs\/[^/?]+|index)\.md(?:\?|$)/.test(
              request.url ?? "",
            )
          )
            request.headers.accept = "text/html"
          next()
        })
      },
    },
    nitro({
      preset: "static",
      hooks: {
        "prerender:generate"(route) {
          if (route.route === "/404" && route.error?.status === 404) {
            route.error = undefined
            route.fileName = "/404.html"
          }
        },
      },
      prerender: {
        autoSubfolderIndex: false,
        crawlLinks: true,
        failOnError: true,
        concurrency: 4,
        ignore: ["/stylex", "/docs/primitives", "/api/og"],
        routes: [
          "/",
          "/404",
          "/components.md",
          "/index.md",
          "/api/search.json",
          "/llms.txt",
          "/sitemap.xml",
          ...readdirSync(resolve(import.meta.dirname, "src/catalog/previews"))
            .filter((name) => name.endsWith(".tsx"))
            .flatMap((name) => {
              const slug = name.replace(/\.tsx$/, "")

              return [`/components/${slug}`, `/components/${slug}.md`]
            }),
          ...readdirSync(resolve(import.meta.dirname, "src/routes/docs"))
            .filter(
              (name) => name.endsWith(".tsx") && name !== "primitives.tsx",
            )
            .map((name) => `/docs/${name.replace(/\.tsx$/, "")}.md`),
        ],
      },
      rolldownConfig: {
        // Nitro rechunks SSR modules; preserve token initialization before themes.
        output: { strictExecutionOrder: true },
      },
      rollupConfig: {
        external: [
          /^react(?:\/|$)/,
          /^react-dom(?:\/|$)/,
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
