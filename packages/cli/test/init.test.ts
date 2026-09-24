import { initProject } from "@yopem-ui/cli/init"
import { afterEach, expect, test } from "bun:test"
import { createHash } from "node:crypto"
import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import ts from "typescript-api"

const roots: string[] = []
afterEach(async () => {
  for (const root of roots.splice(0)) {
    await rm(root, { recursive: true, force: true })
  }
})

async function project(dependencies: Record<string, string>) {
  const root = await mkdtemp(join(tmpdir(), "yopem-init-"))
  roots.push(root)
  await writeFile(
    join(root, "package.json"),
    `${JSON.stringify({ name: "sample", scripts: { dev: "vite", build: "vite build" }, dependencies }, null, 2)}\n`,
  )
  await write(
    root,
    "tsconfig.json",
    '{"compilerOptions":{"jsx":"react-jsx"}}\n',
  )
  return root
}

async function write(root: string, path: string, content: string) {
  await mkdir(join(root, path, ".."), { recursive: true })
  await writeFile(join(root, path), content)
}

function text(root: string, path: string) {
  return readFile(join(root, path), "utf8")
}

function services() {
  const calls: string[][] = []
  const content = "export const ready = true\n"
  const file = {
    path: "lib/stylex.ts",
    target: "@/lib/stylex.ts",
    type: "registry:lib",
    content,
    integrity: `sha256-${createHash("sha256").update(content).digest("base64")}`,
  }
  const base = {
    schemaVersion: 1,
    registryVersion: "0.1.0",
    name: "base",
    type: "registry:base",
    title: "Yopem base",
    description: "Base files",
    categories: [],
    dependencies: ["@stylexjs/stylex@^0.19.0"],
    devDependencies: ["unplugin@^2.3.11"],
    peerDependencies: ["react@>=18 <20"],
    registryDependencies: [],
    files: [file],
  }
  function fetcher() {
    return Promise.resolve(Response.json(base))
  }
  function run(args: string[]) {
    calls.push(args)
    return Promise.resolve()
  }
  return { calls, fetcher, run }
}

function parses(path: string, source: string) {
  const result = ts.transpileModule(source, {
    fileName: path,
    reportDiagnostics: true,
    compilerOptions: { jsx: ts.JsxEmit.Preserve },
  })
  return !result.diagnostics?.some(
    (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error,
  )
}

test("Vite React configures plugins, alias, root styles and active TS paths without losing user setup", async () => {
  const cwd = await project({ vite: "^8", react: "^19" })
  const api = services()
  await write(cwd, "tsconfig.app.json", '{"compilerOptions":{"strict":true}}\n')
  await write(
    cwd,
    "vite.config.ts",
    'import react from "@vitejs/plugin-react"\nimport { defineConfig } from "vite"\nexport default defineConfig({ plugins: [react()], server: { port: 3456 } })\n',
  )
  await write(
    cwd,
    "src/main.tsx",
    'import { createRoot } from "react-dom/client"\ncreateRoot(document.getElementById("root")!).render(null)\n',
  )
  expect(await initProject({ cwd, ...api })).toEqual({
    framework: "vite",
    configured: 3,
  })
  const vite = await text(cwd, "vite.config.ts")
  expect(parses("vite.config.ts", vite)).toBe(true)
  expect(vite.indexOf("styleProps.vite()")).toBeLessThan(
    vite.indexOf("stylex.vite("),
  )
  expect(vite).toContain("server: { port: 3456 }")
  expect(vite).toContain('"@": yopemSource')
  expect(vite).toContain("/virtual:stylex.css")
  expect(vite).toContain("/@id/virtual:stylex:css-only")
  expect(vite).not.toContain("/@id/virtual:stylex:runtime")
  expect(await text(cwd, "src/main.tsx")).toContain("rootStyles.html")
  const appOptions = JSON.parse(
    await text(cwd, "tsconfig.app.json"),
  ).compilerOptions
  expect(appOptions.paths).toEqual({ "@/*": ["./src/*"] })
  expect(appOptions.noEmit).toBe(true)
  expect(appOptions.allowImportingTsExtensions).toBe(true)
  expect(
    JSON.parse(await text(cwd, "tsconfig.json")).compilerOptions.paths,
  ).toBeUndefined()
  expect(api.calls).toContainEqual(["add", "-d", "@stylexjs/unplugin@^0.19.0"])
  expect(await initProject({ cwd, ...api })).toEqual({
    framework: "vite",
    configured: 0,
  })
  expect(await text(cwd, "vite.config.ts")).toBe(vite)
})

test("Vite preserves an existing source alias and fileURLToPath import", async () => {
  const cwd = await project({ vite: "^8", react: "^19" })
  await write(
    cwd,
    "vite.config.ts",
    'import { fileURLToPath } from "node:url"\nconst source = fileURLToPath(new URL("./src", import.meta.url))\nexport default { plugins: [], resolve: { alias: { "@": source } } }\n',
  )
  await write(
    cwd,
    "src/main.tsx",
    'import { createRoot } from "react-dom/client"\n',
  )
  await initProject({ cwd, ...services() })
  const config = await text(cwd, "vite.config.ts")
  expect(config).toContain('"@": source')
  expect(config).toContain("fileURLToPath as yopemFileURLToPath")
  expect(parses("vite.config.ts", config)).toBe(true)
})

test("compact Vite config and TS config remain valid after adding new properties", async () => {
  const cwd = await project({ vite: "^8", react: "^19" })
  await write(cwd, "vite.config.ts", "export default {plugins:[]}")
  await write(
    cwd,
    "src/main.tsx",
    'import { createRoot } from "react-dom/client"\ncreateRoot(document.getElementById("root")!).render(null)\n',
  )
  await initProject({ cwd, ...services() })
  expect(parses("vite.config.ts", await text(cwd, "vite.config.ts"))).toBe(true)
  expect(
    JSON.parse(await text(cwd, "tsconfig.json")).compilerOptions.paths,
  ).toEqual({
    "@/*": ["./src/*"],
  })
})

test("TanStack Router retains router plugin order and Start configures SSR root", async () => {
  const router = await project({
    vite: "^8",
    react: "^19",
    "@tanstack/react-router": "^1",
  })
  const api = services()
  await write(
    router,
    "vite.config.ts",
    "export default { plugins: [tanstackRouter(), react()] }\n",
  )
  await write(
    router,
    "src/main.tsx",
    'import { createRoot } from "react-dom/client"\ncreateRoot(document.getElementById("root")!).render(null)\n',
  )
  expect((await initProject({ cwd: router, ...api })).framework).toBe(
    "tanstack-router",
  )
  expect(await text(router, "vite.config.ts")).toMatch(
    /styleProps\.vite\(\)[\s\S]*stylex\.vite\([\s\S]*tanstackRouter\(\)/,
  )

  const start = await project({
    vite: "^8",
    react: "^19",
    "@tanstack/react-router": "^1",
    "@tanstack/react-start": "^1",
  })
  await write(
    start,
    "vite.config.ts",
    "export default { plugins: [tanstackStart(), react()] }\n",
  )
  await write(
    start,
    "src/routes/__root.tsx",
    'import { createRootRoute } from "@tanstack/react-router"\nexport const Route = createRootRoute({ shellComponent: RootDocument })\nfunction RootDocument({ children }: { children: React.ReactNode }) { return <html lang="en"><head><title>Existing</title></head><body className="custom">{children}</body></html> }\n',
  )
  expect((await initProject({ cwd: start, ...services() })).framework).toBe(
    "tanstack-start",
  )
  const config = await text(start, "vite.config.ts")
  expect(config).toContain("rootDir: yopemRoot")
  expect(config.indexOf("stylex.vite(")).toBeLessThan(
    config.indexOf("tanstackStart()"),
  )
  const root = await text(start, "src/routes/__root.tsx")
  expect(root).toContain('stylexProps("custom", rootStyles.body)')
  expect(root).toContain("/virtual:stylex.css")
  expect(root).toContain("stylex:css-update")
  expect(root).not.toContain("/@id/virtual:stylex:css-only")
  expect(parses("__root.tsx", root)).toBe(true)
})

test("Next App Router merges PostCSS, preserves body class and uses webpack", async () => {
  const cwd = await project({ next: "^16", react: "^19" })
  const api = services()
  const packageJson = JSON.parse(await text(cwd, "package.json"))
  packageJson.scripts = { dev: "next dev -p 3000", build: "next build" }
  await write(cwd, "package.json", `${JSON.stringify(packageJson)}\n`)
  await write(
    cwd,
    "postcss.config.mjs",
    'const config = { plugins: { "@tailwindcss/postcss": {} } }\nexport default config\n',
  )
  await write(
    cwd,
    "src/app/layout.tsx",
    'import type { ReactNode } from "react"\nconst geist = { variable: "geist" }\nexport default function RootLayout({ children }: { children: ReactNode }) { return <html lang="en"><body className={`${geist.variable} antialiased`}>{children}</body></html> }\n',
  )
  expect((await initProject({ cwd, ...api })).framework).toBe("next")
  const layout = await text(cwd, "src/app/layout.tsx")
  expect(layout).toContain(
    "stylexProps(`${geist.variable} antialiased`, rootStyles.body)",
  )
  expect(layout).toContain('"@/styles/stylex.css"')
  expect(parses("layout.tsx", layout)).toBe(true)
  expect(await text(cwd, "src/styles/stylex.css")).toBe("@stylex;\n")
  expect(await text(cwd, "postcss.config.mjs")).toContain(
    '"@tailwindcss/postcss": {}',
  )
  expect(await text(cwd, "postcss.config.mjs")).toContain(
    '"@stylexjs/postcss-plugin"',
  )
  expect(await text(cwd, "babel.config.js")).toContain("stylePropsBabel")
  expect(await text(cwd, "babel.config.js")).toContain("expandLocalSpreads")
  expect(await text(cwd, "babel.config.js")).toContain(
    "/src/styles/tokens.stylex.ts",
  )
  const compiler = JSON.parse(await text(cwd, "tsconfig.json")).compilerOptions
  expect(compiler.baseUrl).toBe(".")
  expect(compiler.noEmit).toBe(true)
  expect(compiler.allowImportingTsExtensions).toBe(true)
  expect(api.calls).toContainEqual([
    "add",
    "-d",
    "@babel/core@^7.29.7",
    "@stylexjs/babel-plugin@^0.19.0",
    "@stylexjs/postcss-plugin@^0.19.0",
    "autoprefixer@^10.4.0",
    "typescript@^5.9.3",
    "@types/node@^24.0.0",
    "@types/babel__core@^7.20.5",
    "@babel/types@^7.29.8",
  ])
  const updated = JSON.parse(await text(cwd, "package.json"))
  expect(updated.scripts).toEqual({
    dev: "next dev -p 3000 --webpack",
    build: "next build --webpack",
  })
  expect((await initProject({ cwd, ...api })).configured).toBe(0)
})

test("Next.js writes a loadable ESM Babel config when package is ESM", async () => {
  const cwd = await project({ next: "^16", react: "^19" })
  const packageJson = JSON.parse(await text(cwd, "package.json"))
  packageJson.type = "module"
  packageJson.scripts = { dev: "next dev", build: "next build" }
  await write(cwd, "package.json", JSON.stringify(packageJson))
  await write(
    cwd,
    "src/app/layout.tsx",
    "export default function Layout() { return <html><body>Hi</body></html> }\n",
  )
  await initProject({ cwd, ...services() })
  const babel = await text(cwd, "babel.config.js")
  expect(babel).toContain('export const presets = ["next/babel"]')
  expect(babel).toContain("export const plugins = [")
  expect(await text(cwd, "postcss.config.cjs")).toContain(
    'require("./babel.config.js")',
  )
  expect(parses("babel.config.js", babel)).toBe(true)
})

test("Astro configures React integration and existing layout without overwriting Astro content", async () => {
  const cwd = await project({ astro: "^6", react: "^19" })
  const api = services()
  await write(
    cwd,
    "astro.config.mjs",
    'import { defineConfig } from "astro/config"\nexport default defineConfig({ integrations: [], vite: { plugins: [] } })\n',
  )
  await write(
    cwd,
    "src/layouts/Layout.astro",
    '---\nconst title = "Existing"\n---\n<html class="site"><head><title>{title}</title></head><body class="page"><slot /></body></html>\n',
  )
  expect((await initProject({ cwd, ...api })).framework).toBe("astro")
  expect(await text(cwd, "astro.config.mjs")).toMatch(
    /react\(\)[\s\S]*styleProps\.vite\(\)[\s\S]*stylex\.vite\(/,
  )
  const layout = await text(cwd, "src/layouts/Layout.astro")
  expect(layout).toContain('import "@/styles/styles.css"')
  expect(layout).toContain("/virtual:stylex.css")
  expect(layout).toContain("/@id/virtual:stylex:css-only")
  expect(layout).toContain(
    "stylex.props(themeMarker, lightTheme, rootStyles.html)",
  )
  expect(layout).toContain('class:list={[\n        "site", yopemHtml.className')
  expect(layout).toContain('class:list={[\n        "page", yopemBody.className')
  expect(layout).toContain("Existing")
  expect(api.calls).toContainEqual(["add", "@astrojs/react", "react-dom"])
  expect((await initProject({ cwd, ...api })).configured).toBe(0)
})

test("Astro reuses an existing React integration import", async () => {
  const cwd = await project({
    astro: "^6",
    react: "^19",
    "@astrojs/react": "^5",
  })
  await write(
    cwd,
    "astro.config.mjs",
    'import { defineConfig } from "astro/config"\nimport reactIntegration from "@astrojs/react"\nexport default defineConfig({ integrations: [reactIntegration()] })\n',
  )
  await write(
    cwd,
    "src/layouts/Layout.astro",
    "---\n---\n<html><head></head><body><slot /></body></html>\n",
  )
  await initProject({ cwd, ...services() })
  const config = await text(cwd, "astro.config.mjs")
  expect(config.match(/from "@astrojs\/react"/g)).toHaveLength(1)
  expect(config).toContain("reactIntegration()")
  expect((await initProject({ cwd, ...services() })).configured).toBe(0)
})

test("ambiguous and unsafe configs stop before package installation or file writes", async () => {
  const cwd = await project({ vite: "^8", react: "^19", next: "^16" })
  const api = services()
  await expect(initProject({ cwd, ...api })).rejects.toThrow(
    "Cannot detect one supported framework",
  )
  expect(api.calls).toEqual([])
  await expect(initProject({ cwd, framework: "vite", ...api })).rejects.toThrow(
    "Missing vite.config.ts",
  )
  await write(
    cwd,
    "package.json",
    JSON.stringify({
      name: "sample",
      dependencies: { vite: "^8", react: "^19" },
    }),
  )
  await write(
    cwd,
    "vite.config.ts",
    "export default { plugins: getPlugins() }\n",
  )
  await write(
    cwd,
    "src/main.tsx",
    'import { createRoot } from "react-dom/client"\n',
  )
  await expect(initProject({ cwd, ...api })).rejects.toThrow(
    "Unsupported plugins configuration",
  )
  expect(api.calls).toEqual([])
  expect(await Bun.file(join(cwd, ".yopem-ui.json")).exists()).toBe(false)
  await rm(join(cwd, "vite.config.ts"))
  const outside = await project({})
  await write(outside, "vite.config.ts", "export default { plugins: [] }\n")
  await symlink(join(outside, "vite.config.ts"), join(cwd, "vite.config.ts"))
  await expect(initProject({ cwd, ...api })).rejects.toThrow(
    "Unsafe existing path",
  )
  expect(api.calls).toEqual([])
})

test("Next.js root spreads stop before installing or modifying user files", async () => {
  const cwd = await project({ next: "^16", react: "^19" })
  const manifest = JSON.parse(await text(cwd, "package.json"))
  manifest.scripts = { dev: "next dev", build: "next build" }
  await write(cwd, "package.json", JSON.stringify(manifest))
  await write(
    cwd,
    "src/app/layout.tsx",
    'export default function Layout() { return <html {...{ lang: "en" }}><body>Hi</body></html> }\n',
  )
  const api = services()
  await expect(initProject({ cwd, ...api })).rejects.toThrow(
    "Unsupported html props spread",
  )
  expect(api.calls).toEqual([])
  expect(await text(cwd, "src/app/layout.tsx")).toContain(
    '<html {...{ lang: "en" }}>',
  )
  manifest.scripts.dev = "next dev && echo changed"
  await write(cwd, "package.json", JSON.stringify(manifest))
  await expect(initProject({ cwd, ...api })).rejects.toThrow(
    "Unsupported Next.js dev script",
  )
  expect(api.calls).toEqual([])
})

test("package manager conflicts stop before modifications", async () => {
  const cwd = await project({ vite: "^8", react: "^19" })
  const manifest = JSON.parse(await text(cwd, "package.json"))
  manifest.packageManager = "pnpm@10.0.0"
  await write(cwd, "package.json", JSON.stringify(manifest))
  await write(cwd, "bun.lock", "")
  const api = services()
  await expect(initProject({ cwd, ...api })).rejects.toThrow(
    "Package manager and lockfile disagree",
  )
  expect(api.calls).toEqual([])
})

test("incompatible TypeScript emission is rejected before installation", async () => {
  const cwd = await project({ vite: "^8", react: "^19" })
  await write(cwd, "tsconfig.json", '{"compilerOptions":{"noEmit":false}}\n')
  const api = services()
  await expect(initProject({ cwd, ...api })).rejects.toThrow(
    "Incompatible noEmit",
  )
  expect(api.calls).toEqual([])
  expect(await text(cwd, "tsconfig.json")).toContain('"noEmit":false')
})

test("existing aliases and Astro layout classes are not overwritten", async () => {
  const cwd = await project({ vite: "^8", react: "^19" })
  const api = services()
  await write(
    cwd,
    "vite.config.ts",
    'export default { plugins: [], resolve: { alias: { "@": "./other" } } }\n',
  )
  await write(
    cwd,
    "src/main.tsx",
    'import { createRoot } from "react-dom/client"\n',
  )
  await expect(initProject({ cwd, ...api })).rejects.toThrow(
    "Incompatible @ alias",
  )
  expect(api.calls).toEqual([])
  expect(await text(cwd, "vite.config.ts")).toContain('"@": "./other"')

  const astro = await project({ astro: "^6" })
  await write(
    astro,
    "astro.config.mjs",
    "export default { integrations: [] }\n",
  )
  await write(
    astro,
    "src/layouts/Layout.astro",
    '---\n---\n<html class:list={["theme"]}><head></head><body><slot /></body></html>\n',
  )
  await expect(initProject({ cwd: astro, ...api })).rejects.toThrow(
    "Unsupported html class:list",
  )
  expect(api.calls).toEqual([])
})
