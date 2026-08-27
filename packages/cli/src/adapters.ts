import { existsSync, readFileSync } from "node:fs"
import { mkdir, rename, writeFile } from "node:fs/promises"
import { dirname, join } from "node:path"

import type { Framework } from "./core.js"

async function atomicWrite(path: string, content: string) {
  await mkdir(dirname(path), { recursive: true })
  const temporary = `${path}.${process.pid}.${Date.now()}.tmp`
  await writeFile(temporary, content)
  await rename(temporary, path)
}

async function updateFile(
  path: string,
  transform: (content: string) => string | undefined,
  dryRun: boolean,
) {
  if (!existsSync(path)) return false
  const content = readFileSync(path, "utf8")
  const next = transform(content)
  if (next === undefined || next === content) return next !== undefined
  if (!dryRun) await atomicWrite(path, next)
  console.info(`${dryRun ? "Would patch" : "Patched"} ${path}`)
  return true
}

const prepend = (content: string, value: string) =>
  content.includes(value.trim()) ? content : `${value}${content}`

function aliasTarget(root: string) {
  for (const name of ["tsconfig.json", "jsconfig.json"]) {
    try {
      const value = JSON.parse(readFileSync(join(root, name), "utf8")) as {
        compilerOptions?: { paths?: Record<string, string[]> }
      }
      const target = value.compilerOptions?.paths?.["@/*"]?.[0]
      if (target) return target.replace(/^\.\//, "")
    } catch {
      // Continue to the other supported config name.
    }
  }
  return "src/*"
}

async function configureVite(root: string, dryRun: boolean) {
  const configName = [
    "vite.config.ts",
    "vite.config.mts",
    "vite.config.js",
    "vite.config.mjs",
  ].find((name) => existsSync(join(root, name)))
  if (!configName) return ["Create vite.config.ts and add @stylexjs/unplugin."]
  const configPath = join(root, configName)
  const sourceAlias = aliasTarget(root)
  const configured = await updateFile(
    configPath,
    (content) => {
      if (content.includes("@stylexjs/unplugin")) return content
      if (!/plugins\s*:\s*\[/.test(content)) return undefined
      let next = prepend(
        content,
        'import { resolve } from "node:path"\nimport stylex from "@stylexjs/unplugin"\n',
      ).replace(
        /plugins\s*:\s*\[/,
        `plugins: [\n    stylex.vite({ aliases: { "@/*": [resolve(import.meta.dirname, "${sourceAlias}")] }, devMode: "full", runtimeInjection: false, treeshakeCompensation: true, unstable_moduleResolution: { type: "commonJS" }, useCSSLayers: true }),`,
      )
      if (!/resolve\s*:/.test(next)) {
        next = next.replace(
          /plugins\s*:/,
          "resolve: { tsconfigPaths: true },\n  plugins:",
        )
      }
      return next
    },
    dryRun,
  )
  const entryName = ["src/main.tsx", "src/main.jsx"].find((name) =>
    existsSync(join(root, name)),
  )
  const entryConfigured = entryName
    ? await updateFile(
        join(root, entryName),
        (content) => {
          if (!content.includes("<App")) return undefined
          let next = prepend(
            content,
            'import "@/styles/yopem/styles.css"\nimport { ThemeProvider } from "@/components/theme-provider"\n',
          )
          if (!next.includes("<ThemeProvider>")) {
            next = next.replace(
              /<App\s*\/>/,
              "<ThemeProvider><App /></ThemeProvider>",
            )
          }
          return next
        },
        dryRun,
      )
    : false
  return [
    ...(!configured
      ? [
          `Patch ${configName}: import @stylexjs/unplugin and place stylex.vite({ useCSSLayers: true }) before React/framework plugins.`,
        ]
      : []),
    ...(!entryConfigured
      ? [
          "Import @/styles/yopem/styles.css and wrap the app with ThemeProvider in src/main.tsx.",
        ]
      : []),
  ]
}

async function configureTanStack(root: string, dryRun: boolean) {
  const instructions = await configureVite(root, dryRun)
  const rootName = ["src/routes/__root.tsx", "app/routes/__root.tsx"].find(
    (name) => existsSync(join(root, name)),
  )
  if (!rootName) {
    return [
      ...instructions,
      "In the TanStack root route, link @/styles/yopem/styles.css?url, render ThemeScript in <head>, spread getRootThemeProps() on <html>, and wrap children with ThemeProvider.",
    ]
  }
  const configured = await updateFile(
    join(root, rootName),
    (content) => {
      if (!content.includes("<html") || !content.includes("<HeadContent")) {
        return undefined
      }
      let next = prepend(
        content,
        'import { ThemeProvider } from "@/components/theme-provider"\nimport { getRootThemeProps } from "@/components/theme-root"\nimport { ThemeScript } from "@/components/theme-script"\nimport yopemCss from "@/styles/yopem/styles.css?url"\n',
      )
      if (!next.includes("links: [{ href: yopemCss")) {
        next = next.replace(
          /createRootRoute\(\{\s*/,
          'createRootRoute({\n  head: () => ({ links: [{ href: yopemCss, rel: "stylesheet" }] }),\n  ',
        )
      }
      next = next.replace(
        /<html\s+lang="en">/,
        '<html {...getRootThemeProps("light")} data-theme="light" lang="en" suppressHydrationWarning>',
      )
      next = next.replace(
        "<HeadContent />",
        "<ThemeScript />\n        <HeadContent />",
      )
      next = next.replace(
        "{children}",
        "<ThemeProvider>{children}</ThemeProvider>",
      )
      return next
    },
    dryRun,
  )
  return configured
    ? instructions.filter(
        (instruction) => !instruction.includes("ThemeProvider in src/main"),
      )
    : [
        ...instructions,
        `Patch ${rootName}: link Yopem CSS, apply getRootThemeProps() to html, render ThemeScript, and wrap children with ThemeProvider.`,
      ]
}

async function writeIfMissing(path: string, content: string, dryRun: boolean) {
  if (existsSync(path)) return false
  if (!dryRun) await atomicWrite(path, content)
  console.info(`${dryRun ? "Would create" : "Created"} ${path}`)
  return true
}

async function configureNext(
  root: string,
  framework: Framework,
  dryRun: boolean,
) {
  const sourceAlias = aliasTarget(root)
  const babel = `const path = require("node:path")\nconst dev = process.env.NODE_ENV !== "production"\nmodule.exports = {\n  presets: ["next/babel"],\n  plugins: [["@stylexjs/babel-plugin", { aliases: { "@/*": [path.join(__dirname, "${sourceAlias}")] }, dev, runtimeInjection: false, treeshakeCompensation: true, unstable_moduleResolution: { type: "commonJS" } }]],\n}\n`
  const postcss = `const babelConfig = require("./babel.config")\nmodule.exports = {\n  plugins: {\n    "@stylexjs/postcss-plugin": {\n      include: ["src/**/*.{js,jsx,ts,tsx}", "app/**/*.{js,jsx,ts,tsx}", "pages/**/*.{js,jsx,ts,tsx}", "components/**/*.{js,jsx,ts,tsx}"],\n      babelConfig: { babelrc: false, parserOpts: { plugins: ["typescript", "jsx"] }, plugins: babelConfig.plugins },\n      useCSSLayers: true,\n    },\n    autoprefixer: {},\n  },\n}\n`
  const instructions: string[] = []
  if (
    !(await writeIfMissing(join(root, "babel.config.js"), babel, dryRun)) &&
    !readFileSync(join(root, "babel.config.js"), "utf8").includes(
      "@stylexjs/babel-plugin",
    )
  ) {
    instructions.push("Add @stylexjs/babel-plugin to babel.config.js.")
  }
  if (
    !(await writeIfMissing(join(root, "postcss.config.js"), postcss, dryRun)) &&
    !readFileSync(join(root, "postcss.config.js"), "utf8").includes(
      "@stylexjs/postcss-plugin",
    )
  ) {
    instructions.push(
      "Add @stylexjs/postcss-plugin and @stylex to postcss.config.js and Yopem styles.css.",
    )
  }

  if (framework === "next-app") {
    const layoutName = ["app/layout.tsx", "src/app/layout.tsx"].find((name) =>
      existsSync(join(root, name)),
    )
    const configured = layoutName
      ? await updateFile(
          join(root, layoutName),
          (content) => {
            if (!content.includes("{children}")) return undefined
            let next = prepend(
              content,
              'import "@/styles/yopem/styles.css"\nimport { ThemeProvider } from "@/components/theme-provider"\nimport { getRootThemeProps } from "@/components/theme-root"\nimport { ThemeScript } from "@/components/theme-script"\n',
            )
            next = next.replace(
              /<html\s+lang="en">/,
              '<html {...getRootThemeProps("light")} data-theme="light" lang="en" suppressHydrationWarning>',
            )
            next = next.replace(
              /<body>\s*\{children\}\s*<\/body>/,
              "<body><ThemeScript /><ThemeProvider>{children}</ThemeProvider></body>",
            )
            return next
          },
          dryRun,
        )
      : false
    if (!configured)
      instructions.push(
        "Patch app/layout.tsx to import Yopem CSS and install ThemeScript/ThemeProvider on the root document.",
      )
  } else {
    const appName = ["pages/_app.tsx", "src/pages/_app.tsx"].find((name) =>
      existsSync(join(root, name)),
    )
    const documentName = [
      "pages/_document.tsx",
      "src/pages/_document.tsx",
    ].find((name) => existsSync(join(root, name)))
    const appConfigured = appName
      ? await updateFile(
          join(root, appName),
          (content) => {
            if (!content.includes("<Component")) return undefined
            let next = prepend(
              content,
              'import "@/styles/yopem/styles.css"\nimport { ThemeProvider } from "@/components/theme-provider"\n',
            )
            next = next.replace(
              /<Component([^>]*)\/>/,
              "<ThemeProvider><Component$1 /></ThemeProvider>",
            )
            return next
          },
          dryRun,
        )
      : false
    const documentConfigured = documentName
      ? await updateFile(
          join(root, documentName),
          (content) => {
            if (!content.includes("<Html")) return undefined
            let next = prepend(
              content,
              'import { getRootThemeProps } from "@/components/theme-root"\nimport { ThemeScript } from "@/components/theme-script"\n',
            )
            next = next.replace(
              /<Html\s+lang="en">/,
              '<Html {...getRootThemeProps("light")} data-theme="light" lang="en" suppressHydrationWarning>',
            )
            next = next.replace("<Head />", "<Head><ThemeScript /></Head>")
            return next
          },
          dryRun,
        )
      : false
    if (!appConfigured || !documentConfigured) {
      instructions.push(
        "Patch pages/_app.tsx and pages/_document.tsx to import Yopem CSS and install ThemeProvider/ThemeScript.",
      )
    }
  }
  return instructions
}

export async function configureFramework(
  root: string,
  framework: Framework,
  dryRun: boolean,
) {
  const instructions =
    framework === "tanstack-start"
      ? await configureTanStack(root, dryRun)
      : framework === "next-app" || framework === "next-pages"
        ? await configureNext(root, framework, dryRun)
        : framework === "vite"
          ? await configureVite(root, dryRun)
          : [
              "Unsupported framework: configure the StyleX compiler and Yopem root theme manually.",
            ]
  for (const instruction of instructions) console.info(`Manual: ${instruction}`)
}
