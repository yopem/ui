import { createRequire } from "node:module"
import { resolve } from "node:path"
import { build, type PluginOption } from "vite"

const root = resolve(import.meta.dirname, "../..")

const docs = resolve(root, "apps/docs")

const require = createRequire(resolve(docs, "package.json"))

const babel: (options: { plugins: [string, object][] }) => PluginOption =
  require("@rolldown/plugin-babel").default

const react: (options: { compiler: boolean }) => PluginOption =
  require("@vitejs/plugin-react").default

const postcss: (options: {
  cwd: string
  include: string[]
  babelConfig: {
    babelrc: boolean
    parserOpts: { plugins: string[] }
    plugins: [string, object][]
  }
  useCSSLayers: boolean
}) => { postcssPlugin: string } = require("@stylexjs/postcss-plugin")

const stylexOptions = {
  aliases: { "@registry/*": [resolve(root, "packages/registry/src/*")] },
  dev: false,
  runtimeInjection: false,
  treeshakeCompensation: true,
  unstable_moduleResolution: { rootDir: root, type: "commonJS" as const },
}

const stylexPlugins: [string, object][] = [
  ["@stylexjs/babel-plugin", stylexOptions],
]

const stylexPostcss = postcss({
  cwd: docs,
  include: [
    "src/**/*.{js,jsx,ts,tsx}",
    "../../packages/registry/src/**/*.{js,jsx,ts,tsx}",
    "../../packages/editor/src/**/*.{js,jsx,ts,tsx}",
    "../../tests/fixtures/toolbar-pressed*.tsx",
  ],
  babelConfig: {
    babelrc: false,
    parserOpts: { plugins: ["typescript", "jsx"] },
    plugins: stylexPlugins,
  },
  useCSSLayers: false,
})

let bundle: Promise<{ script: string; css: string }> | undefined

export function bundleToolbarPressedFixture() {
  bundle ??= compileFixture()

  return bundle
}

async function compileFixture() {
  const result = await build({
    configFile: false,
    root: docs,
    mode: "production",
    define: { "process.env.NODE_ENV": '"production"' },
    logLevel: "warn",
    css: { postcss: { plugins: [stylexPostcss] } },
    resolve: {
      alias: { "@registry": resolve(root, "packages/registry/src") },
      dedupe: ["react", "react-dom"],
    },
    plugins: [babel({ plugins: stylexPlugins }), react({ compiler: true })],
    build: {
      write: false,
      cssCodeSplit: false,
      rolldownOptions: {
        input: resolve(root, "tests/fixtures/toolbar-pressed-entry.tsx"),
        output: { inlineDynamicImports: true, strictExecutionOrder: true },
      },
    },
  })

  if (Array.isArray(result) || !("output" in result))
    throw new Error("Unexpected fixture bundle output")

  const script = result.output.find((item) => item.type === "chunk")

  const css = result.output.find(
    (item) => item.type === "asset" && item.fileName.endsWith(".css"),
  )

  if (script?.type !== "chunk" || css?.type !== "asset")
    throw new Error("Missing fixture script or CSS")

  return { script: script.code, css: Buffer.from(css.source).toString("utf8") }
}
