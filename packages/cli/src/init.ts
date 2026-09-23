import { readFile, realpath, writeFile, mkdir } from "node:fs/promises"
import { dirname, join } from "node:path"
import ts from "typescript-api"

import type { InstallOptions } from "./install"

import { existingFile, installItem, runBun } from "./install"

type Framework =
  | "vite"
  | "tanstack-router"
  | "tanstack-start"
  | "next"
  | "astro"
type PackageManager = "bun" | "npm" | "pnpm" | "yarn"
interface Edit {
  start: number
  end: number
  text: string
}
type JsonObject = Record<string, unknown>

export interface InitOptions extends InstallOptions {
  framework?: Framework
}

function object(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function applyEdits(source: string, edits: Edit[]) {
  const sorted = edits.sort(
    (left, right) =>
      right.start - left.start ||
      Number(left.text === ",") - Number(right.text === ","),
  )
  for (const [index, edit] of sorted.entries()) {
    if (edit.start < 0 || edit.end < edit.start || edit.end > source.length) {
      throw new Error("Invalid configuration edit")
    }
    if (index && edit.end > sorted[index - 1]!.start) {
      throw new Error("Overlapping configuration edits")
    }
    source = source.slice(0, edit.start) + edit.text + source.slice(edit.end)
  }
  return source
}

function hasParseErrors(source: ts.SourceFile) {
  return (
    "parseDiagnostics" in source &&
    Array.isArray(source.parseDiagnostics) &&
    source.parseDiagnostics.length > 0
  )
}

function parsed(path: string, content: string) {
  const kind = /\.(?:js|mjs|cjs)$/.test(path)
    ? ts.ScriptKind.JS
    : path.endsWith(".tsx")
      ? ts.ScriptKind.TSX
      : ts.ScriptKind.TS
  const source = ts.createSourceFile(
    path,
    content,
    ts.ScriptTarget.Latest,
    true,
    kind,
  )
  if (hasParseErrors(source)) {
    throw new Error(`Cannot parse ${path}`)
  }
  return source
}

function property(node: ts.ObjectLiteralExpression, name: string) {
  if (node.properties.some(ts.isSpreadAssignment)) {
    throw new Error("Cannot safely edit a configuration object with spreads")
  }
  return node.properties.find(
    (entry): entry is ts.PropertyAssignment =>
      ts.isPropertyAssignment(entry) &&
      (ts.isIdentifier(entry.name) || ts.isStringLiteral(entry.name)) &&
      entry.name.text === name,
  )
}

function objectValue(entry: ts.PropertyAssignment | undefined, path: string) {
  if (!entry || !ts.isObjectLiteralExpression(entry.initializer)) {
    throw new Error(`Unsupported configuration in ${path}`)
  }
  return entry.initializer
}

function configObject(source: ts.SourceFile, path: string) {
  const assignment = source.statements.find(ts.isExportAssignment)
  if (!assignment)
    throw new Error(`Expected a default configuration in ${path}`)
  let expression: ts.Expression = assignment.expression
  if (ts.isIdentifier(expression)) {
    const declaration = source.statements
      .filter(ts.isVariableStatement)
      .flatMap((statement) => [...statement.declarationList.declarations])
      .find(
        (entry) => entry.name.getText(source) === expression.getText(source),
      )
    if (!declaration?.initializer) {
      throw new Error(`Unsupported configuration in ${path}`)
    }
    expression = declaration.initializer
  }
  if (ts.isCallExpression(expression)) expression = expression.arguments[0]!
  if (!expression || !ts.isObjectLiteralExpression(expression)) {
    throw new Error(`Unsupported configuration in ${path}`)
  }
  return expression
}

function addProperty(
  source: ts.SourceFile,
  target: ts.ObjectLiteralExpression,
  text: string,
  edits: Edit[],
) {
  const close = target.getEnd() - 1
  const last = target.properties.at(-1)
  if (
    last &&
    !/^\s*,/.test(source.text.slice(last.end, close)) &&
    !edits.some((edit) => edit.start === last.end && edit.text === ",")
  ) {
    edits.push({ start: last.end, end: last.end, text: "," })
  }
  const inserted = edits.find(
    (edit) => edit.start === close && edit.end === close && edit.text !== ",",
  )
  if (inserted) inserted.text = `${inserted.text.trimEnd()},\n  ${text}\n`
  else edits.push({ start: close, end: close, text: `\n  ${text}\n` })
}

function addArrayEntries(
  source: ts.SourceFile,
  target: ts.ArrayLiteralExpression,
  values: string[],
  edits: Edit[],
) {
  const start = target.getStart(source) + 1
  edits.push({
    start,
    end: start,
    text: `\n    ${values.join(",\n    ")}${target.elements.length ? "," : ""}\n`,
  })
}

function addAlias(
  source: ts.SourceFile,
  config: ts.ObjectLiteralExpression,
  path: string,
  edits: Edit[],
) {
  const resolve = property(config, "resolve")
  if (!resolve) {
    addProperty(
      source,
      config,
      'resolve: { alias: { "@": yopemSource } }',
      edits,
    )
    return
  }
  const resolution = objectValue(resolve, path)
  const alias = property(resolution, "alias")
  if (!alias) {
    addProperty(source, resolution, 'alias: { "@": yopemSource }', edits)
    return
  }
  const aliases = objectValue(alias, path)
  const current = property(aliases, "@")
  if (!current) {
    addProperty(source, aliases, '"@": yopemSource', edits)
    return
  }
  const value = current.initializer.getText(source)
  const declaration = ts.isIdentifier(current.initializer)
    ? source.statements
        .filter(ts.isVariableStatement)
        .flatMap((statement) => [...statement.declarationList.declarations])
        .find((entry) => entry.name.getText(source) === value)
    : undefined
  const destination = declaration?.initializer?.getText(source) ?? value
  if (
    !/["'](?:\.\/)?src(?:\/|["'])/.test(destination) &&
    value !== "yopemSource"
  ) {
    throw new Error(`Incompatible @ alias in ${path}`)
  }
}

function stylexPlugin(framework: Framework) {
  const moduleResolution =
    framework === "tanstack-start"
      ? 'rootDir: yopemRoot, type: "commonJS"'
      : 'type: "commonJS"'
  return `stylex.vite({
      aliases: { "@/*": [yopemSource + "/*"] },
      runtimeInjection: false,
      treeshakeCompensation: true,
      unstable_moduleResolution: { ${moduleResolution} },
      devMode: "css-only",
    })`
}

function viteConfig(content: string, path: string, framework: Framework) {
  const alreadyConfigured =
    content.includes("styleProps.vite()") && content.includes("stylex.vite(")
  if (alreadyConfigured) {
    if (!content.includes('"@":') && !content.includes("'@':")) {
      throw new Error(`Existing StyleX configuration lacks @ alias in ${path}`)
    }
    return content
  }
  if (
    content.includes("styleProps.vite()") ||
    content.includes("stylex.vite(")
  ) {
    throw new Error(`Incomplete Yopem build configuration in ${path}`)
  }
  const source = parsed(path, content)
  const config = configObject(source, path)
  const plugins = property(config, "plugins")
  const entries = ["styleProps.vite()", stylexPlugin(framework)]
  if (framework === "vite" || framework === "tanstack-router") {
    entries.push(`{
      name: "yopem-stylex-dev-css",
      apply: "serve",
      transformIndexHtml: () => [{
        tag: "link",
        attrs: { rel: "stylesheet", href: "/virtual:stylex.css" },
        injectTo: "head",
      }],
    }`)
  }
  const edits: Edit[] = []
  if (plugins) {
    if (!ts.isArrayLiteralExpression(plugins.initializer)) {
      throw new Error(`Unsupported plugins configuration in ${path}`)
    }
    addArrayEntries(source, plugins.initializer, entries, edits)
  } else {
    addProperty(source, config, `plugins: [${entries.join(", ")}]`, edits)
  }
  addAlias(source, config, path, edits)
  const imports = `import stylex from "@stylexjs/unplugin"\nimport { fileURLToPath as yopemFileURLToPath } from "node:url"\nimport { styleProps } from "./src/lib/style-props-unplugin.ts"\n\nconst yopemSource = yopemFileURLToPath(new URL("./src", import.meta.url))\n${framework === "tanstack-start" ? 'const yopemRoot = yopemFileURLToPath(new URL(".", import.meta.url))\n' : ""}\n`
  edits.push({ start: 0, end: 0, text: imports })
  return applyEdits(content, edits)
}

function astroConfig(content: string, path: string) {
  const source = parsed(path, content)
  const reactImport = source.statements.find(
    (statement): statement is ts.ImportDeclaration =>
      ts.isImportDeclaration(statement) &&
      ts.isStringLiteral(statement.moduleSpecifier) &&
      statement.moduleSpecifier.text === "@astrojs/react",
  )
  if (reactImport && !reactImport.importClause?.name) {
    throw new Error(`Unsupported React integration import in ${path}`)
  }
  const reactName = reactImport?.importClause?.name?.text ?? "react"
  if (content.includes("react()") && !reactImport) {
    throw new Error(`Unknown react() integration in ${path}`)
  }
  const alreadyConfigured =
    content.includes("styleProps.vite()") &&
    content.includes("stylex.vite(") &&
    content.includes(`${reactName}()`)
  if (alreadyConfigured) {
    if (!content.includes('"@":') && !content.includes("'@':")) {
      throw new Error(`Existing StyleX configuration lacks @ alias in ${path}`)
    }
    return content
  }
  if (
    content.includes("styleProps.vite()") ||
    content.includes("stylex.vite(")
  ) {
    throw new Error(`Incomplete Yopem build configuration in ${path}`)
  }
  const config = configObject(source, path)
  const edits: Edit[] = []
  const integrations = property(config, "integrations")
  if (integrations) {
    if (!ts.isArrayLiteralExpression(integrations.initializer)) {
      throw new Error(`Unsupported integrations in ${path}`)
    }
    if (!content.includes(`${reactName}()`)) {
      addArrayEntries(
        source,
        integrations.initializer,
        [`${reactName}()`],
        edits,
      )
    }
  } else {
    addProperty(source, config, `integrations: [${reactName}()]`, edits)
  }
  const vite = property(config, "vite")
  if (!vite) {
    addProperty(
      source,
      config,
      `vite: { resolve: { alias: { "@": yopemSource } }, plugins: [styleProps.vite(), ${stylexPlugin("astro")}] }`,
      edits,
    )
  } else {
    const nested = objectValue(vite, path)
    addAlias(source, nested, path, edits)
    const plugins = property(nested, "plugins")
    if (plugins) {
      if (!ts.isArrayLiteralExpression(plugins.initializer)) {
        throw new Error(`Unsupported Vite plugins in ${path}`)
      }
      addArrayEntries(
        source,
        plugins.initializer,
        ["styleProps.vite()", stylexPlugin("astro")],
        edits,
      )
    } else {
      addProperty(
        source,
        nested,
        `plugins: [styleProps.vite(), ${stylexPlugin("astro")}]`,
        edits,
      )
    }
  }
  edits.push({
    start: 0,
    end: 0,
    text: `import stylex from "@stylexjs/unplugin"\n${reactImport ? "" : 'import react from "@astrojs/react"\n'}import { fileURLToPath as yopemFileURLToPath } from "node:url"\nimport { styleProps } from "./src/lib/style-props-unplugin.ts"\n\nconst yopemSource = yopemFileURLToPath(new URL("./src", import.meta.url))\n`,
  })
  return applyEdits(content, edits)
}

function tsconfig(content: string, path: string, framework: Framework) {
  const source = ts.parseJsonText(path, content)
  if (hasParseErrors(source)) throw new Error(`Cannot parse ${path}`)
  const root = source.statements[0]
  if (
    !root ||
    !ts.isExpressionStatement(root) ||
    !ts.isObjectLiteralExpression(root.expression)
  ) {
    throw new Error(`Unsupported ${path}`)
  }
  const edits: Edit[] = []
  const config = root.expression
  const compiler = property(config, "compilerOptions")
  if (!compiler) {
    addProperty(
      source,
      config,
      framework === "next"
        ? '"compilerOptions": { "baseUrl": ".", "noEmit": true, "allowImportingTsExtensions": true, "paths": { "@/*": ["./src/*"] } }'
        : '"compilerOptions": { "noEmit": true, "allowImportingTsExtensions": true, "paths": { "@/*": ["./src/*"] } }',
      edits,
    )
  } else {
    const options = objectValue(compiler, path)
    for (const name of ["noEmit", "allowImportingTsExtensions"]) {
      const current = property(options, name)
      if (!current) addProperty(source, options, `"${name}": true`, edits)
      else if (current.initializer.kind !== ts.SyntaxKind.TrueKeyword) {
        throw new Error(`Incompatible ${name} in ${path}`)
      }
    }
    const baseUrl = property(options, "baseUrl")
    if (framework === "next" && !baseUrl) {
      addProperty(source, options, '"baseUrl": "."', edits)
    }
    if (
      baseUrl &&
      (!ts.isStringLiteral(baseUrl.initializer) ||
        ![".", "./"].includes(baseUrl.initializer.text))
    ) {
      throw new Error(`Incompatible baseUrl in ${path}`)
    }
    const paths = property(options, "paths")
    if (!paths) {
      addProperty(source, options, '"paths": { "@/*": ["./src/*"] }', edits)
    } else {
      const aliases = objectValue(paths, path)
      const alias = property(aliases, "@/*")
      if (!alias) {
        addProperty(source, aliases, '"@/*": ["./src/*"]', edits)
      } else if (
        !ts.isArrayLiteralExpression(alias.initializer) ||
        alias.initializer.elements.length !== 1 ||
        !ts.isStringLiteral(alias.initializer.elements[0]!) ||
        !["./src/*", "src/*"].includes(alias.initializer.elements[0]!.text)
      ) {
        throw new Error(`Incompatible @/* alias in ${path}`)
      }
    }
  }
  return applyEdits(content, edits)
}

function reactEntry(content: string, path: string) {
  if (content.includes("themeMarker") || content.includes("rootStyles.html")) {
    if (
      !content.includes('"@/styles/styles.css"') ||
      !content.includes("rootStyles.html") ||
      !content.includes('dataset.theme = "light"')
    ) {
      throw new Error(`Incomplete Yopem root styles in ${path}`)
    }
    return content
  }
  const source = parsed(path, content)
  const imports = source.statements.filter(ts.isImportDeclaration)
  if (!imports.length) throw new Error(`No React imports in ${path}`)
  const last = imports.at(-1)!
  return applyEdits(content, [
    {
      start: 0,
      end: 0,
      text: 'import "@/styles/styles.css"\nimport * as stylex from "@stylexjs/stylex"\nimport { lightTheme, rootStyles, themeMarker } from "@/styles/tokens.stylex"\n',
    },
    {
      start: last.end,
      end: last.end,
      text: '\n\nconst yopemRoot = stylex.props(themeMarker, lightTheme, rootStyles.html)\ndocument.documentElement.classList.add(...(yopemRoot.className ?? "").split(" ").filter(Boolean))\ndocument.documentElement.dataset.theme = "light"\n',
    },
  ])
}

function jsxLayout(
  content: string,
  path: string,
  framework: "next" | "tanstack-start",
) {
  if (content.includes("stylexProps(") || content.includes("rootStyles.html")) {
    if (
      !content.includes('"@/styles/styles.css"') ||
      !content.includes("rootStyles.html") ||
      !content.includes("rootStyles.body") ||
      (framework === "next" && !content.includes('"@/styles/stylex.css"')) ||
      (framework === "tanstack-start" &&
        !content.includes("/virtual:stylex.css"))
    ) {
      throw new Error(`Incomplete Yopem layout in ${path}`)
    }
    return content
  }
  const source = parsed(path, content)
  const elements: Record<"html" | "body" | "head", ts.JsxOpeningElement[]> = {
    html: [],
    body: [],
    head: [],
  }
  function visit(node: ts.Node): void {
    if (ts.isJsxOpeningElement(node)) {
      const tag = node.tagName.getText(source)
      if (tag === "html" || tag === "body" || tag === "head") {
        elements[tag].push(node)
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(source)
  if (
    elements.html.length !== 1 ||
    elements.body.length !== 1 ||
    (framework === "tanstack-start" && elements.head.length !== 1)
  ) {
    throw new Error(
      `Expected one html/body root${framework === "tanstack-start" ? "/head" : ""} in ${path}`,
    )
  }
  const edits: Edit[] = []
  for (const tag of ["html", "body"] as const) {
    const opening = elements[tag][0]!
    if (opening.attributes.properties.some(ts.isJsxSpreadAttribute)) {
      throw new Error(`Unsupported ${tag} props spread in ${path}`)
    }
    const original = opening.getText(source)
    const className = opening.attributes.properties.find(
      (attribute): attribute is ts.JsxAttribute =>
        ts.isJsxAttribute(attribute) &&
        attribute.name.getText(source) === "className",
    )
    let existing = "undefined"
    let next = original
    if (className) {
      const initializer = className.initializer
      if (initializer && ts.isStringLiteral(initializer)) {
        existing = JSON.stringify(initializer.text)
      } else if (
        initializer &&
        ts.isJsxExpression(initializer) &&
        initializer.expression
      ) {
        existing = initializer.expression.getText(source)
      } else {
        throw new Error(`Unsupported root className in ${path}`)
      }
      const from = className.getStart(source) - opening.getStart(source)
      next =
        next.slice(0, from) +
        next.slice(from + className.getText(source).length)
    }
    if (tag === "html" && !/\bdata-theme\s*=/.test(next)) {
      next = next.replace(/>$/, ' data-theme="light">')
    }
    const styles =
      tag === "html"
        ? "themeMarker, lightTheme, rootStyles.html"
        : "rootStyles.body"
    next = next.replace(/>$/, ` {...stylexProps(${existing}, ${styles})}>`)
    edits.push({
      start: opening.getStart(source),
      end: opening.getEnd(),
      text: next,
    })
  }
  if (
    framework === "tanstack-start" &&
    !content.includes("/virtual:stylex.css")
  ) {
    const head = elements.head[0]!
    edits.push({
      start: head.getEnd(),
      end: head.getEnd(),
      text: '\n        {import.meta.env.DEV ? <link rel="stylesheet" href="/virtual:stylex.css" /> : null}',
    })
  }
  const css =
    framework === "next"
      ? 'import "@/styles/styles.css"\nimport "@/styles/stylex.css"\n'
      : 'import "@/styles/styles.css"\n'
  edits.push({
    start: 0,
    end: 0,
    text: `${css}import { stylexProps } from "@/lib/stylex"\nimport { lightTheme, rootStyles, themeMarker } from "@/styles/tokens.stylex"\n`,
  })
  return applyEdits(content, edits)
}

function astroLayout(content: string, path: string) {
  if (content.includes("yopemHtml.className")) {
    if (
      !content.includes('"@/styles/styles.css"') ||
      !content.includes("/virtual:stylex.css") ||
      !content.includes("yopemBody.className")
    ) {
      throw new Error(`Incomplete Yopem layout in ${path}`)
    }
    return content
  }
  if (content.includes("rootStyles.html") || content.includes("yopemBody")) {
    throw new Error(`Incomplete Yopem layout in ${path}`)
  }
  if (!/^---\s*\n/.test(content)) {
    throw new Error(`Expected Astro frontmatter in ${path}`)
  }
  const end = content.indexOf("\n---", 3)
  const head = [...content.matchAll(/<head(?:\s+[^<>]*)?>/g)]
  const html = [...content.matchAll(/<html(?:\s+[^<>]*)?>/g)]
  const body = [...content.matchAll(/<body(?:\s+[^<>]*)?>/g)]
  if (
    end < 0 ||
    head.length !== 1 ||
    html.length !== 1 ||
    body.length !== 1 ||
    head[0]!.index! < end ||
    html[0]!.index! < end ||
    body[0]!.index! < end
  ) {
    throw new Error(`Expected one html/head/body layout in ${path}`)
  }
  const edits: Edit[] = [
    {
      start: end,
      end,
      text: `${content.includes('"@/styles/styles.css"') ? "" : '\nimport "@/styles/styles.css"'}\nimport * as stylex from "@stylexjs/stylex"\nimport { lightTheme, rootStyles, themeMarker } from "@/styles/tokens.stylex"\n\nconst yopemHtml = stylex.props(themeMarker, lightTheme, rootStyles.html)\nconst yopemBody = stylex.props(rootStyles.body)`,
    },
  ]
  for (const [tag, match] of [
    ["html", html[0]!],
    ["body", body[0]!],
  ] as const) {
    let opening = match[0]
    if (/\bclass:list\s*=/.test(opening)) {
      throw new Error(`Unsupported ${tag} class:list in ${path}`)
    }
    const existing = opening.match(/\bclass\s*=\s*(["'])([^"']*)\1/)
    if (/\bclass\s*=/.test(opening) && !existing) {
      throw new Error(`Unsupported ${tag} class in ${path}`)
    }
    const className = `yopem${tag === "html" ? "Html" : "Body"}.className`
    opening = existing
      ? opening.replace(
          existing[0],
          `class:list={[
        ${JSON.stringify(existing[2])}, ${className}
      ]}`,
        )
      : opening.replace(/>$/, ` class={${className}}>`)
    if (tag === "html") {
      if (
        /\bdata-theme\s*=/.test(opening) &&
        !/\bdata-theme\s*=\s*["']light["']/.test(opening)
      ) {
        throw new Error(`Conflicting data-theme in ${path}`)
      }
      if (!/\bdata-theme\s*=/.test(opening)) {
        opening = opening.replace(/>$/, ' data-theme="light">')
      }
    }
    edits.push({
      start: match.index!,
      end: match.index! + match[0].length,
      text: opening,
    })
  }
  if (!content.includes("/virtual:stylex.css")) {
    edits.push({
      start: head[0]!.index! + head[0]![0].length,
      end: head[0]!.index! + head[0]![0].length,
      text: '\n    {import.meta.env.DEV && <link rel="stylesheet" href="/virtual:stylex.css" />}',
    })
  }
  return applyEdits(content, edits)
}

function nextBabel(esm: boolean) {
  const header = esm
    ? `import { createRequire } from "node:module"
import { dirname } from "node:path"
import { fileURLToPath } from "node:url"
const require = createRequire(import.meta.url)
const __dirname = dirname(fileURLToPath(import.meta.url))`
    : ""
  return `${header}
const path = require("node:path")
const stylePropsBabel = require("./src/lib/style-props-babel.ts").default

function expandLocalSpreads({ types: t }) {
  return {
    visitor: {
      Program: {
        enter(program, state) {
          if (!state.filename?.replaceAll("\\\\", "/").endsWith("/src/styles/tokens.stylex.ts")) return
          program.traverse({
            ObjectExpression(path) {
              path.node.properties = path.node.properties.flatMap((property) => {
                if (!t.isSpreadElement(property) || !t.isIdentifier(property.argument)) return [property]
                const binding = path.scope.getBinding(property.argument.name)
                const value = binding?.path.node.init
                if (!t.isObjectExpression(value) || value.properties.some(t.isSpreadElement)) return [property]
                return value.properties.map((part) => t.cloneNode(part, true))
              })
            },
          })
        },
      },
    },
  }
}

${esm ? 'export const presets = ["next/babel"]\nexport const plugins = [' : 'module.exports = {\n  presets: ["next/babel"],\n  plugins: ['}expandLocalSpreads, stylePropsBabel, ["@stylexjs/babel-plugin", {
  aliases: { "@/*": [path.join(__dirname, "src/*")] },
  dev: process.env.NODE_ENV !== "production",
  runtimeInjection: false,
  treeshakeCompensation: true,
  unstable_moduleResolution: { type: "commonJS" },
}]]${esm ? "" : ",\n}"}
`
}

function nextPostcss() {
  return `const babelConfig = require("./babel.config.js")

module.exports = {
  plugins: {
    "@stylexjs/postcss-plugin": {
      include: ["src/**/*.{js,jsx,ts,tsx}", "app/**/*.{js,jsx,ts,tsx}", "pages/**/*.{js,jsx,ts,tsx}"],
      babelConfig: {
        babelrc: false,
        parserOpts: { plugins: ["typescript", "jsx"] },
        plugins: babelConfig.plugins,
      },
      useCSSLayers: true,
    },
    autoprefixer: {},
  },
}
`
}

function postcss(content: string, path: string, esm: boolean) {
  if (content.includes('"@stylexjs/postcss-plugin"')) return content
  const source = parsed(path, content)
  let config: ts.ObjectLiteralExpression | undefined
  const exported = source.statements.find(ts.isExportAssignment)
  if (exported) {
    config = configObject(source, path)
  } else {
    const assignment = source.statements
      .filter(ts.isExpressionStatement)
      .map((entry) => entry.expression)
      .find(
        (entry): entry is ts.BinaryExpression =>
          ts.isBinaryExpression(entry) &&
          entry.left.getText(source) === "module.exports",
      )
    if (assignment && ts.isObjectLiteralExpression(assignment.right)) {
      config = assignment.right
    }
  }
  if (!config) throw new Error(`Unsupported PostCSS config in ${path}`)
  const plugins = objectValue(property(config, "plugins"), path)
  const edits: Edit[] = []
  addProperty(
    source,
    plugins,
    `"@stylexjs/postcss-plugin": {
      include: ["src/**/*.{js,jsx,ts,tsx}", "app/**/*.{js,jsx,ts,tsx}", "pages/**/*.{js,jsx,ts,tsx}"],
      babelConfig: { babelrc: false, parserOpts: { plugins: ["typescript", "jsx"] }, plugins: yopemBabelConfig.plugins },
      useCSSLayers: true,
    }`,
    edits,
  )
  edits.push({
    start: 0,
    end: 0,
    text: esm
      ? 'import { createRequire } from "node:module"\nconst yopemBabelConfig = createRequire(import.meta.url)("./babel.config.js")\n'
      : 'const yopemBabelConfig = require("./babel.config.js")\n',
  })
  return applyEdits(content, edits)
}

function requireNextNode() {
  const result = Bun.spawnSync(["node", "--version"], {
    stdout: "pipe",
    stderr: "pipe",
  })
  const version = new TextDecoder().decode(result.stdout).match(/^v(\d+)/)
  if (result.exitCode !== 0 || !version || Number(version[1]) < 24) {
    throw new Error(
      "Next.js init requires Node 24+ for the copied TypeScript Babel plugin",
    )
  }
}

function nextScripts(value: unknown) {
  if (!object(value)) throw new Error("Invalid package.json scripts")
  const scripts = { ...value }
  for (const name of ["dev", "build"]) {
    const command = scripts[name]
    if (
      typeof command !== "string" ||
      !new RegExp(`^next ${name}(?:\\s|$)`).test(command) ||
      /--turbopack|--turbo|[;&|`$]/.test(command)
    ) {
      throw new Error(`Unsupported Next.js ${name} script`)
    }
    if (!command.includes("--webpack")) scripts[name] = `${command} --webpack`
  }
  return scripts
}

async function chooseFile(root: string, names: string[], fallback?: string) {
  const matches: string[] = []
  for (const name of names)
    if (await existingFile(root, name)) matches.push(name)
  if (matches.length > 1)
    throw new Error(`Ambiguous configuration: ${matches.join(", ")}`)
  return (
    matches[0] ??
    fallback ??
    (() => {
      throw new Error(`Missing ${names[0]}`)
    })()
  )
}

function detectFramework(
  dependencies: JsonObject,
  chosen?: Framework,
): Framework {
  const present = (name: string) => typeof dependencies[name] === "string"
  const detected: Framework[] = []
  if (present("next")) detected.push("next")
  if (present("astro")) detected.push("astro")
  if (present("@tanstack/react-start")) detected.push("tanstack-start")
  else if (present("@tanstack/react-router")) detected.push("tanstack-router")
  else if (present("vite") && present("react")) detected.push("vite")
  if (present("@react-router/dev")) {
    throw new Error("React Router framework/RSC mode is not supported by init")
  }
  if (chosen && detected.includes(chosen)) return chosen
  if (detected.length !== 1 || chosen) {
    throw new Error(
      `Cannot detect one supported framework; found: ${detected.join(", ") || "none"}`,
    )
  }
  return detected[0]!
}

async function packageManager(
  root: string,
  declared: unknown,
): Promise<PackageManager> {
  const markers: [PackageManager, string][] = [
    ["bun", "bun.lock"],
    ["bun", "bun.lockb"],
    ["npm", "package-lock.json"],
    ["pnpm", "pnpm-lock.yaml"],
    ["yarn", "yarn.lock"],
  ]
  const found = new Set<PackageManager>()
  for (const [manager, path] of markers) {
    if (await existingFile(root, path)) found.add(manager)
  }
  if (found.size > 1) throw new Error("Conflicting package manager lockfiles")
  const named =
    typeof declared === "string" ? declared.split("@")[0] : undefined
  if (
    named &&
    named !== "bun" &&
    named !== "npm" &&
    named !== "pnpm" &&
    named !== "yarn"
  ) {
    throw new Error(`Unsupported package manager: ${named}`)
  }
  const locked = [...found][0]
  if (locked && named && locked !== named) {
    throw new Error("Package manager and lockfile disagree")
  }
  return locked ?? named ?? "bun"
}

export async function initProject(options: InitOptions = {}) {
  const root = await realpath(options.cwd ?? process.cwd())
  if (!(await existingFile(root, "package.json"))) {
    throw new Error("Run init from a project with package.json")
  }
  const packageText = await readFile(join(root, "package.json"), "utf8")
  const manifest: unknown = JSON.parse(packageText)
  if (
    !object(manifest) ||
    (!object(manifest.dependencies) && !object(manifest.devDependencies))
  ) {
    throw new Error("Invalid project package.json")
  }
  const dependencies = {
    ...(object(manifest.dependencies) ? manifest.dependencies : {}),
    ...(object(manifest.devDependencies) ? manifest.devDependencies : {}),
  }
  const framework = detectFramework(dependencies, options.framework)
  const manager = await packageManager(root, manifest.packageManager)
  const edits = new Map<string, { before: string | null; after: string }>()
  async function plan(
    path: string,
    transform: (content: string) => string,
    fallback?: string,
  ) {
    const exists = await existingFile(root, path)
    if (!exists && fallback === undefined) throw new Error(`Missing ${path}`)
    const before = exists ? await readFile(join(root, path), "utf8") : null
    const after = transform(before ?? fallback!)
    if (before !== after) edits.set(path, { before, after })
  }
  const tsPath =
    framework !== "next" &&
    framework !== "astro" &&
    (await existingFile(root, "tsconfig.app.json"))
      ? "tsconfig.app.json"
      : "tsconfig.json"
  await plan(tsPath, (content) => tsconfig(content, tsPath, framework))
  const devDependencies = ["@stylexjs/unplugin@^0.19.0"]
  const runtimeDependencies: string[] = []
  if (framework === "astro") {
    const config = await chooseFile(root, [
      "astro.config.mjs",
      "astro.config.ts",
      "astro.config.js",
    ])
    await plan(config, (content) => astroConfig(content, config))
    const layout = await chooseFile(root, [
      "src/layouts/Layout.astro",
      "src/layouts/layout.astro",
    ])
    await plan(layout, (content) => astroLayout(content, layout))
    for (const name of ["@astrojs/react", "react", "react-dom"]) {
      if (!(name in dependencies)) runtimeDependencies.push(name)
    }
  } else if (framework === "next") {
    requireNextNode()
    if (!object(manifest.scripts))
      throw new Error("Next.js scripts are missing")
    nextScripts(manifest.scripts)
    const layout = await chooseFile(root, [
      "src/app/layout.tsx",
      "app/layout.tsx",
    ])
    await plan(layout, (content) => jsxLayout(content, layout, "next"))
    const babel = await chooseFile(
      root,
      [
        "babel.config.js",
        "babel.config.cjs",
        "babel.config.mjs",
        ".babelrc",
        ".babelrc.json",
      ],
      "babel.config.js",
    )
    if (babel !== "babel.config.js") {
      throw new Error(`Unsupported Babel configuration: ${babel}`)
    }
    const babelContent = nextBabel(manifest.type === "module")
    await plan(
      babel,
      (content) => {
        if (content !== babelContent) {
          throw new Error("Existing Babel config requires manual review")
        }
        return content
      },
      babelContent,
    )
    const postcssPath = await chooseFile(
      root,
      ["postcss.config.mjs", "postcss.config.cjs", "postcss.config.js"],
      "postcss.config.cjs",
    )
    await plan(
      postcssPath,
      (content) =>
        postcssPath === "postcss.config.cjs" && content === nextPostcss()
          ? content
          : postcss(
              content,
              postcssPath,
              postcssPath.endsWith(".mjs") ||
                (postcssPath.endsWith(".js") && manifest.type === "module"),
            ),
      nextPostcss(),
    )
    await plan(
      "src/styles/stylex.css",
      (content) => {
        if (content.trim() !== "@stylex;")
          throw new Error("Existing src/styles/stylex.css conflicts with init")
        return content
      },
      "@stylex;\n",
    )
    devDependencies.splice(
      0,
      devDependencies.length,
      "@babel/core@^7.29.7",
      "@stylexjs/babel-plugin@^0.19.0",
      "@stylexjs/postcss-plugin@^0.19.0",
      "autoprefixer@^10.4.0",
      "typescript@^5.9.3",
      "@types/node@^24.0.0",
      "@types/babel__core@^7.20.5",
      "@babel/types@^7.29.8",
    )
  } else {
    const config = await chooseFile(root, [
      "vite.config.ts",
      "vite.config.mts",
      "vite.config.js",
      "vite.config.mjs",
    ])
    await plan(config, (content) => viteConfig(content, config, framework))
    if (framework === "tanstack-start") {
      const layout = await chooseFile(root, ["src/routes/__root.tsx"])
      await plan(layout, (content) =>
        jsxLayout(content, layout, "tanstack-start"),
      )
    } else {
      const entry = await chooseFile(root, [
        "src/main.tsx",
        "src/main.jsx",
        "src/index.tsx",
        "src/index.jsx",
      ])
      await plan(entry, (content) => reactEntry(content, entry))
    }
  }
  const packageRun =
    options.run ??
    (manager === "bun"
      ? runBun
      : async function runPackage(args: string[], cwd: string) {
          const command =
            manager === "npm" && args[0] === "add" ? "install" : args[0]!
          const flags = args
            .slice(1)
            .map((argument) => (argument === "-d" ? "-D" : argument))
          const child = Bun.spawn([manager, command, ...flags], {
            cwd,
            stdout: "inherit",
            stderr: "inherit",
          })
          if ((await child.exited) !== 0)
            throw new Error(`${manager} ${command} failed`)
        })
  await installItem("base", { ...options, cwd: root, run: packageRun })
  const packages = await readFile(join(root, "package.json"), "utf8")
  const installed: unknown = JSON.parse(packages)
  if (!object(installed))
    throw new Error("Invalid package.json after installation")
  const available = {
    ...(object(installed.dependencies) ? installed.dependencies : {}),
    ...(object(installed.devDependencies) ? installed.devDependencies : {}),
  }
  const neededRuntime = runtimeDependencies.filter(
    (name) => !(name in available),
  )
  if (neededRuntime.length) await packageRun(["add", ...neededRuntime], root)
  const neededDev = devDependencies.filter(
    (name) => !(name.split("@").slice(0, -1).join("@") in available),
  )
  if (neededDev.length) await packageRun(["add", "-d", ...neededDev], root)
  for (const [path, { before, after }] of edits) {
    const exists = await existingFile(root, path)
    const current = exists ? await readFile(join(root, path), "utf8") : null
    if (current !== before) throw new Error(`File changed during init: ${path}`)
    await mkdir(dirname(join(root, path)), { recursive: true })
    await writeFile(join(root, path), after, { flag: exists ? "w" : "wx" })
  }
  if (framework === "next") {
    const latest: unknown = JSON.parse(
      await readFile(join(root, "package.json"), "utf8"),
    )
    if (!object(latest))
      throw new Error("Invalid package.json after installation")
    if (JSON.stringify(latest.scripts) !== JSON.stringify(manifest.scripts)) {
      throw new Error("Next.js scripts changed during init")
    }
    const scripts = nextScripts(latest.scripts)
    if (JSON.stringify(latest.scripts) !== JSON.stringify(scripts)) {
      await writeFile(
        join(root, "package.json"),
        `${JSON.stringify({ ...latest, scripts }, null, 2)}\n`,
      )
    }
  }
  return { framework, configured: edits.size }
}
