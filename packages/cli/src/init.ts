import type {
  FileChange,
  InstallOptions,
  JsonObject,
  JsonValue,
} from "@yopem-ui/cli/install"

import {
  existingFile,
  installItem,
  isRecord,
  isString,
  writeFiles,
} from "@yopem-ui/cli/install"
import {
  isPackageName,
  packageRunner,
  workspaceRoot,
} from "@yopem-ui/cli/project"
import { readFile, realpath } from "node:fs/promises"
import { join, relative, resolve } from "node:path"
import ts from "typescript-api"

type Framework =
  | "vite"
  | "tanstack-router"
  | "tanstack-start"
  | "react-router"
  | "next"
  | "astro"

interface SharedUI {
  name: string
  source: string
}

interface Edit {
  start: number
  end: number
  text: string
}

export interface InitOptions extends InstallOptions {
  framework?: Framework
  ui?: string
}

function object(value: JsonValue | undefined): value is JsonObject {
  return isRecord(value)
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

function sameSyntax(left: ts.Node, right: ts.Node): boolean {
  if (left.kind !== right.kind) return false

  if (
    ts.isIdentifier(left) &&
    ts.isIdentifier(right) &&
    left.text !== right.text
  )
    return false

  if (
    ts.isLiteralExpression(left) &&
    ts.isLiteralExpression(right) &&
    left.text !== right.text
  )
    return false
  const leftChildren: ts.Node[] = []
  const rightChildren: ts.Node[] = []
  ts.forEachChild(left, (child) => {
    leftChildren.push(child)
  })
  ts.forEachChild(right, (child) => {
    rightChildren.push(child)
  })

  return (
    leftChildren.length === rightChildren.length &&
    leftChildren.every((child, index) =>
      sameSyntax(child, rightChildren[index]!),
    )
  )
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

  const aliasValue = declaration?.initializer ?? current.initializer

  if (
    ts.isStringLiteral(aliasValue) &&
    /^(?:\.\/)?src\/?$/.test(aliasValue.text)
  ) {
    edits.push({
      start: current.initializer.getStart(source),
      end: current.initializer.end,
      text: "yopemSource",
    })
  }
}

function moduleConfig(source: ts.SourceFile, path: string) {
  if (source.statements.some(ts.isExportAssignment))
    return configObject(source, path)

  const exported = source.statements
    .filter(ts.isExpressionStatement)
    .map((statement) => statement.expression)
    .find(
      (expression): expression is ts.BinaryExpression =>
        ts.isBinaryExpression(expression) &&
        expression.left.getText(source) === "module.exports",
    )

  if (!exported || !ts.isObjectLiteralExpression(exported.right))
    throw new Error(`Unsupported configuration in ${path}`)

  return exported.right
}

function isConfigExport(statement: ts.Statement, source: ts.SourceFile) {
  return (
    ts.isExportAssignment(statement) ||
    (ts.isExpressionStatement(statement) &&
      ts.isBinaryExpression(statement.expression) &&
      statement.expression.left.getText(source) === "module.exports")
  )
}

function staticLiteral(node: ts.Expression): boolean {
  if (
    ts.isStringLiteral(node) ||
    ts.isNumericLiteral(node) ||
    node.kind === ts.SyntaxKind.TrueKeyword ||
    node.kind === ts.SyntaxKind.FalseKeyword ||
    node.kind === ts.SyntaxKind.NullKeyword
  )
    return true

  if (ts.isArrayLiteralExpression(node))
    return node.elements.every((element) => staticLiteral(element))

  if (ts.isObjectLiteralExpression(node))
    return node.properties.every(
      (entry) =>
        ts.isPropertyAssignment(entry) &&
        (ts.isIdentifier(entry.name) || ts.isStringLiteral(entry.name)) &&
        staticLiteral(entry.initializer),
    )

  return false
}

function migrateBabel(content: string, path: string) {
  if (path === ".babelrc" || path === ".babelrc.json") {
    const config: JsonValue = JSON.parse(content)

    if (
      !object(config) ||
      Object.keys(config).some((key) => key !== "plugins" && key !== "presets")
    )
      throw new Error(`Unsupported Babel config in ${path}`)
    const parsedConfig = config

    function entries(name: string) {
      const values = parsedConfig[name]

      if (values === undefined) return []

      if (!Array.isArray(values))
        throw new Error(`Unsupported Babel config in ${path}`)

      return values.flatMap((value) => {
        if (value === "@stylexjs/babel-plugin") return []

        if (Array.isArray(value) && value[0] === "@stylexjs/babel-plugin") {
          const options: JsonValue | undefined = value[1]

          if (
            options !== undefined &&
            (!object(options) ||
              Object.keys(options).some((key) => key !== "runtimeInjection") ||
              options.runtimeInjection !== false)
          )
            throw new Error(`Unsupported Babel config in ${path}`)

          return []
        }

        return [JSON.stringify(value)]
      })
    }

    return { plugins: entries("plugins"), presets: entries("presets") }
  }

  const source = parsed(path, content)
  const config = moduleConfig(source, path)

  const names = config.properties.map((entry) =>
    ts.isPropertyAssignment(entry) &&
    (ts.isIdentifier(entry.name) || ts.isStringLiteral(entry.name))
      ? entry.name.text
      : "",
  )

  if (names.some((name) => name !== "plugins" && name !== "presets"))
    throw new Error(`Unsupported Babel config in ${path}`)

  const legacy =
    content.includes("function expandLocalSpreads(") &&
    content.includes("/src/styles/tokens.stylex.ts")

  if (
    !legacy &&
    source.statements.some((statement) => !isConfigExport(statement, source))
  )
    throw new Error(`Unsupported Babel config in ${path}`)

  const entries = (name: string) => {
    const value = property(config, name)

    if (!value) return []

    if (!ts.isArrayLiteralExpression(value.initializer))
      throw new Error(`Unsupported Babel config in ${path}`)

    return value.initializer.elements.flatMap((entry) => {
      const plugin = ts.isArrayLiteralExpression(entry)
        ? entry.elements[0]
        : entry

      if (
        name === "plugins" &&
        plugin &&
        ts.isStringLiteral(plugin) &&
        plugin.text === "@stylexjs/babel-plugin"
      ) {
        if (!legacy && ts.isArrayLiteralExpression(entry)) {
          const options = entry.elements[1]

          if (
            options &&
            (!ts.isObjectLiteralExpression(options) ||
              options.properties.some(
                (setting) =>
                  !ts.isPropertyAssignment(setting) ||
                  !(
                    ts.isIdentifier(setting.name) ||
                    ts.isStringLiteral(setting.name)
                  ) ||
                  setting.name.text !== "runtimeInjection" ||
                  setting.initializer.kind !== ts.SyntaxKind.FalseKeyword,
              ))
          )
            throw new Error(`Unsupported Babel config in ${path}`)
        }

        return []
      }

      if (
        name === "plugins" &&
        legacy &&
        ts.isIdentifier(plugin) &&
        plugin.text === "expandLocalSpreads"
      )
        return []

      if (!staticLiteral(entry))
        throw new Error(`Unsupported Babel config in ${path}`)

      return [entry.getText(source)]
    })
  }

  return { plugins: entries("plugins"), presets: entries("presets") }
}

function migratePostcss(content: string, path: string) {
  const source = parsed(path, content)
  const config = moduleConfig(source, path)

  if (
    source.statements.some(
      (statement) =>
        !isConfigExport(statement, source) &&
        !(
          ts.isVariableStatement(statement) &&
          statement.getText(source) ===
            'const babelConfig = require("./babel.config.cjs")' &&
          content.includes('"@stylexjs/postcss-plugin"')
        ),
    )
  )
    throw new Error(`Unsupported PostCSS config in ${path}`)

  if (
    config.properties.some(
      (entry) =>
        !ts.isPropertyAssignment(entry) ||
        !(ts.isIdentifier(entry.name) || ts.isStringLiteral(entry.name)) ||
        entry.name.text !== "plugins",
    )
  )
    throw new Error(`Unsupported PostCSS config in ${path}`)
  const plugins = property(config, "plugins")?.initializer

  if (plugins && ts.isArrayLiteralExpression(plugins)) {
    return plugins.elements.map((entry) => {
      if (ts.isStringLiteral(entry))
        return `yopemCreateRequire(import.meta.url)(${JSON.stringify(entry.text)})()`

      if (!ts.isCallExpression(entry))
        throw new Error(`Unsupported PostCSS config in ${path}`)

      const factory = ts.isCallExpression(entry.expression)
        ? entry.expression
        : entry

      if (
        !ts.isIdentifier(factory.expression) ||
        factory.expression.text !== "require" ||
        factory.arguments.length !== 1 ||
        !ts.isStringLiteral(factory.arguments[0]) ||
        (factory === entry && entry.arguments.length !== 1) ||
        (factory !== entry &&
          (entry.arguments.length !== 1 || !staticLiteral(entry.arguments[0]!)))
      )
        throw new Error(`Unsupported PostCSS config in ${path}`)

      const options =
        factory === entry ? "" : entry.arguments[0]!.getText(source)

      return `yopemCreateRequire(import.meta.url)(${JSON.stringify(factory.arguments[0].text)})(${options})`
    })
  }

  if (!plugins || !ts.isObjectLiteralExpression(plugins))
    throw new Error(`Unsupported PostCSS config in ${path}`)

  return plugins.properties.flatMap((entry) => {
    if (
      !ts.isPropertyAssignment(entry) ||
      !(ts.isIdentifier(entry.name) || ts.isStringLiteral(entry.name))
    )
      throw new Error(`Unsupported PostCSS config in ${path}`)
    const name = entry.name.text

    if (name === "@stylexjs/postcss-plugin") {
      if (
        !content.includes(
          'const babelConfig = require("./babel.config.cjs")',
        ) &&
        (!ts.isObjectLiteralExpression(entry.initializer) ||
          entry.initializer.properties.length > 0)
      )
        throw new Error(`Unsupported PostCSS config in ${path}`)

      return []
    }

    if (entry.initializer.kind === ts.SyntaxKind.FalseKeyword) return []

    if (!staticLiteral(entry.initializer))
      throw new Error(`Unsupported PostCSS config in ${path}`)

    const options =
      entry.initializer.kind === ts.SyntaxKind.TrueKeyword
        ? ""
        : entry.initializer.getText(source)

    return [
      `yopemCreateRequire(import.meta.url)(${JSON.stringify(name)})(${options})`,
    ]
  })
}

function babelPlugin(presets = false) {
  return `babel({ plugins: yopemBabelPlugins${presets ? ", presets: yopemBabelPresets" : ""} })`
}

function stylexSetup(
  babelPlugins: string[] = [],
  babelPresets: string[] = [],
  shared?: SharedUI,
) {
  return `import babel from "@rolldown/plugin-babel"
import { createRequire as yopemCreateRequire } from "node:module"
import { fileURLToPath as yopemFileURLToPath } from "node:url"

const yopemSource = yopemFileURLToPath(new URL("./src", import.meta.url))${shared ? `\nconst yopemUISource = yopemFileURLToPath(new URL(${JSON.stringify(shared.source)}, import.meta.url))` : ""}
const yopemBabelPlugins = [${babelPlugins.join(", ")}${babelPlugins.length ? ", " : ""}["@stylexjs/babel-plugin", {
  aliases: { "@/*": [yopemSource + "/*"]${shared ? `, ${JSON.stringify(`${shared.name}/*`)}: [yopemUISource + "/*"]` : ""} },
  dev: process.env.NODE_ENV !== "production",
  runtimeInjection: false,
  treeshakeCompensation: true,
  unstable_moduleResolution: { type: "commonJS" },
}]]${babelPresets.length ? `\nconst yopemBabelPresets = [${babelPresets.join(", ")}]` : ""}
const yopemPostcssPlugin = yopemCreateRequire(import.meta.url)("@stylexjs/postcss-plugin")({
  cwd: yopemFileURLToPath(new URL(".", import.meta.url)),
  include: ["src/**/*.{js,jsx,ts,tsx}", "app/**/*.{js,jsx,ts,tsx}"${shared ? ', yopemUISource + "/**/*.{js,jsx,ts,tsx}"' : ""}],
  babelConfig: {
    babelrc: false,
    parserOpts: { plugins: ["typescript", "jsx"] },
    plugins: yopemBabelPlugins,${babelPresets.length ? "\n    presets: yopemBabelPresets," : ""}
  },
  useCSSLayers: true,
})
if (typeof yopemPostcssPlugin?.postcssPlugin !== "string")
  throw new Error("Invalid StyleX PostCSS plugin")
`
}

function hasYopemStylexConfig(content: string) {
  return content.includes("babel({ plugins: yopemBabelPlugins")
}

function addStylexPostcss(
  source: ts.SourceFile,
  config: ts.ObjectLiteralExpression,
  path: string,
  edits: Edit[],
  existingPlugins: string[],
) {
  const css = property(config, "css")

  if (css) {
    const options = objectValue(css, path)
    const postcss = property(options, "postcss")

    if (postcss) {
      const plugins = property(objectValue(postcss, path), "plugins")

      if (!plugins || !ts.isArrayLiteralExpression(plugins.initializer))
        throw new Error(`Unsupported PostCSS config in ${path}`)
      addArrayEntries(
        source,
        plugins.initializer,
        ["yopemPostcssPlugin", ...existingPlugins],
        edits,
      )

      return
    }

    addProperty(
      source,
      options,
      `postcss: { plugins: [yopemPostcssPlugin${existingPlugins.map((plugin) => `, ${plugin}`).join("")}] }`,
      edits,
    )
  } else {
    addProperty(
      source,
      config,
      `css: { postcss: { plugins: [yopemPostcssPlugin${existingPlugins.map((plugin) => `, ${plugin}`).join("")}] } }`,
      edits,
    )
  }
}

function stripLegacyConfig(content: string, path: string) {
  const legacyImport = 'import yopemBabelConfig from "./babel.config.cjs"'

  if (!content.includes(legacyImport)) return content
  const source = parsed(path, content)
  const pluginText = "babel({ plugins: yopemBabelConfig.plugins })"
  const config = configObject(source, path)

  const vite = path.startsWith("astro.config")
    ? objectValue(property(config, "vite"), path)
    : config

  const plugins = property(vite, "plugins")?.initializer

  if (!plugins || !ts.isArrayLiteralExpression(plugins))
    throw new Error(`Unsupported legacy configuration in ${path}`)

  const index = plugins.elements.findIndex(
    (entry) => entry.getText(source) === pluginText,
  )

  if (index < 0) throw new Error(`Unsupported legacy configuration in ${path}`)
  const entry = plugins.elements[index]!
  const previous = plugins.elements[index - 1]
  const next = plugins.elements[index + 1]

  const edits: Edit[] = [
    {
      start: previous && !next ? previous.end : entry.getStart(source),
      end: next ? next.getStart(source) : entry.end,
      text: "",
    },
  ]

  for (const statement of source.statements) {
    if (
      ts.isImportDeclaration(statement) &&
      ts.isStringLiteral(statement.moduleSpecifier) &&
      ["@rolldown/plugin-babel", "./babel.config.cjs", "node:url"].includes(
        statement.moduleSpecifier.text,
      )
    )
      edits.push({
        start: statement.getStart(source),
        end: statement.end,
        text: "",
      })

    if (
      ts.isVariableStatement(statement) &&
      statement.declarationList.declarations.some(
        (declaration) => declaration.name.getText(source) === "yopemSource",
      )
    )
      edits.push({
        start: statement.getStart(source),
        end: statement.end,
        text: "",
      })
  }

  if (edits.length !== 5)
    throw new Error(`Unsupported legacy configuration in ${path}`)

  return applyEdits(content, edits)
}

function viteConfig(
  content: string,
  path: string,
  babelConfig: ReturnType<typeof migrateBabel>,
  postcssPlugins: string[],
  shared?: SharedUI,
) {
  content = stripLegacyConfig(content, path)

  if (content.includes("stylex.vite(") || hasYopemStylexConfig(content)) {
    if (
      shared &&
      (!content.includes(JSON.stringify(`${shared.name}/*`)) ||
        !content.includes(JSON.stringify(shared.source)))
    )
      throw new Error(
        `Existing StyleX configuration targets a different UI package in ${path}`,
      )

    if (!content.includes('"@":') && !content.includes("'@':")) {
      throw new Error(`Existing StyleX configuration lacks @ alias in ${path}`)
    }

    if (
      !hasYopemStylexConfig(content) ||
      !content.includes("plugins: [yopemPostcssPlugin")
    ) {
      throw new Error(`Incomplete Yopem build configuration in ${path}`)
    }

    return content
  }

  const source = parsed(path, content)
  const config = configObject(source, path)
  const plugins = property(config, "plugins")
  const entries = [babelPlugin(babelConfig.presets.length > 0)]
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
  addStylexPostcss(source, config, path, edits, postcssPlugins)
  edits.push({
    start: 0,
    end: 0,
    text: stylexSetup(babelConfig.plugins, babelConfig.presets, shared),
  })

  return applyEdits(content, edits)
}

function astroConfig(
  content: string,
  path: string,
  babelConfig: ReturnType<typeof migrateBabel>,
  postcssPlugins: string[],
  shared?: SharedUI,
) {
  content = stripLegacyConfig(content, path)
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
    hasYopemStylexConfig(content) && content.includes(`${reactName}()`)

  if (alreadyConfigured) {
    if (
      shared &&
      (!content.includes(JSON.stringify(`${shared.name}/*`)) ||
        !content.includes(JSON.stringify(shared.source)))
    )
      throw new Error(
        `Existing StyleX configuration targets a different UI package in ${path}`,
      )

    if (!content.includes('"@":') && !content.includes("'@':")) {
      throw new Error(`Existing StyleX configuration lacks @ alias in ${path}`)
    }

    if (!content.includes("plugins: [yopemPostcssPlugin")) {
      throw new Error(`Incomplete Yopem build configuration in ${path}`)
    }

    return content
  }

  if (content.includes("stylex.vite(")) {
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
      `vite: { resolve: { alias: { "@": yopemSource } }, plugins: [${babelPlugin(babelConfig.presets.length > 0)}], css: { postcss: { plugins: [yopemPostcssPlugin${postcssPlugins.map((plugin) => `, ${plugin}`).join("")}] } } }`,
      edits,
    )
  } else {
    const nested = objectValue(vite, path)
    addAlias(source, nested, path, edits)
    addStylexPostcss(source, nested, path, edits, postcssPlugins)
    const plugins = property(nested, "plugins")

    if (plugins) {
      if (!ts.isArrayLiteralExpression(plugins.initializer)) {
        throw new Error(`Unsupported Vite plugins in ${path}`)
      }

      addArrayEntries(
        source,
        plugins.initializer,
        [babelPlugin(babelConfig.presets.length > 0)],
        edits,
      )
    } else {
      addProperty(
        source,
        nested,
        `plugins: [${babelPlugin(babelConfig.presets.length > 0)}]`,
        edits,
      )
    }
  }

  edits.push({
    start: 0,
    end: 0,
    text: `${reactImport ? "" : 'import react from "@astrojs/react"\n'}${stylexSetup(babelConfig.plugins, babelConfig.presets, shared)}`,
  })

  return applyEdits(content, edits)
}

function tsconfig(content: string, path: string) {
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
      '"compilerOptions": { "noEmit": true, "allowImportingTsExtensions": true, "paths": { "@/*": ["./src/*"] } }',
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

function reactEntry(content: string, path: string, prefix = "@") {
  if (content.includes("themeMarker") || content.includes("rootStyles.html")) {
    if (
      !content.includes(`"${prefix}/styles/styles.css"`) ||
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
      text: `import "${prefix}/styles/styles.css"\nimport * as stylex from "@stylexjs/stylex"\nimport { lightTheme, rootStyles, themeMarker } from "${prefix}/styles/tokens.stylex"\n`,
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
  framework: "next" | "tanstack-start" | "react-router",
  prefix = "@",
) {
  if (content.includes("stylexProps(") || content.includes("rootStyles.html")) {
    if (
      !content.includes(`"${prefix}/styles/styles.css"`) ||
      !content.includes("rootStyles.html") ||
      !content.includes("rootStyles.body")
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

  const css = `import "${prefix}/styles/styles.css"\n`
  edits.push({
    start: 0,
    end: 0,
    text: `${css}import { stylexProps } from "${prefix}/lib/stylex"\nimport { lightTheme, rootStyles, themeMarker } from "${prefix}/styles/tokens.stylex"\n`,
  })

  return applyEdits(content, edits)
}

function astroLayout(content: string, path: string, prefix = "@") {
  if (content.includes("yopemHtml.className")) {
    if (
      !content.includes(`"${prefix}/styles/styles.css"`) ||
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
    if (content.startsWith("---"))
      throw new Error(`Expected Astro frontmatter in ${path}`)
    content = `---\n---\n${content}`
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
      text: `${content.includes(`"${prefix}/styles/styles.css"`) ? "" : `\nimport "${prefix}/styles/styles.css"`}\nimport * as stylex from "@stylexjs/stylex"\nimport { lightTheme, rootStyles, themeMarker } from "${prefix}/styles/tokens.stylex"\n\nconst yopemHtml = stylex.props(themeMarker, lightTheme, rootStyles.html)\nconst yopemBody = stylex.props(rootStyles.body)`,
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

  return applyEdits(content, edits)
}

function nextBabel(esm: boolean, shared?: SharedUI) {
  const header = esm
    ? `import { createRequire } from "node:module"
import { dirname } from "node:path"
import { fileURLToPath } from "node:url"
const require = createRequire(import.meta.url)
const __dirname = dirname(fileURLToPath(import.meta.url))`
    : ""

  return `${header}
// Next loads this Babel config synchronously through CommonJS.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require("node:path")

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

${esm ? 'export const presets = ["next/babel"]\nexport const plugins = [' : 'module.exports = {\n  presets: ["next/babel"],\n  plugins: ['}expandLocalSpreads, ["@stylexjs/babel-plugin", {
  aliases: { "@/*": [path.join(__dirname, "src/*")]${shared ? `, ${JSON.stringify(`${shared.name}/*`)}: [path.join(__dirname, ${JSON.stringify(`${shared.source}*`)})]` : ""} },
  dev: process.env.NODE_ENV !== "production",
  runtimeInjection: false,
  treeshakeCompensation: true,
  unstable_moduleResolution: { type: "commonJS" },
}]]${esm ? "" : ",\n}"}
`
}

function nextConfig(content: string, path: string, name: string) {
  const source = parsed(path, content)
  const config = moduleConfig(source, path)
  const packages = property(config, "transpilePackages")
  const edits: Edit[] = []

  if (!packages) {
    addProperty(
      source,
      config,
      `transpilePackages: [${JSON.stringify(name)}]`,
      edits,
    )
  } else {
    if (!ts.isArrayLiteralExpression(packages.initializer))
      throw new Error(`Unsupported transpilePackages in ${path}`)

    if (
      !packages.initializer.elements.some(
        (entry) => ts.isStringLiteral(entry) && entry.text === name,
      )
    )
      addArrayEntries(
        source,
        packages.initializer,
        [JSON.stringify(name)],
        edits,
      )
  }

  return applyEdits(content, edits)
}

function nextPostcss(shared?: SharedUI) {
  return `// Next loads this PostCSS config synchronously through CommonJS.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const babelConfig = require("./babel.config.js")

module.exports = {
  plugins: {
    "@stylexjs/postcss-plugin": {
      include: ["src/**/*.{js,jsx,ts,tsx}", "app/**/*.{js,jsx,ts,tsx}", "pages/**/*.{js,jsx,ts,tsx}"${shared ? `, require("node:path").join(__dirname, ${JSON.stringify(`${shared.source}**/*.{js,jsx,ts,tsx}`)})` : ""}],
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

function postcss(
  content: string,
  path: string,
  esm: boolean,
  shared?: SharedUI,
) {
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
      include: ["src/**/*.{js,jsx,ts,tsx}", "app/**/*.{js,jsx,ts,tsx}", "pages/**/*.{js,jsx,ts,tsx}"${shared ? `, ${esm ? "yopemRequire" : "require"}("node:path").resolve(${esm ? 'yopemRequire("node:url").fileURLToPath(new URL(".", import.meta.url))' : "__dirname"}, ${JSON.stringify(`${shared.source}**/*.{js,jsx,ts,tsx}`)})` : ""}],
      babelConfig: { babelrc: false, parserOpts: { plugins: ["typescript", "jsx"] }, plugins: yopemBabelConfig.plugins },
      useCSSLayers: true,
    }`,
    edits,
  )
  edits.push({
    start: 0,
    end: 0,
    text: esm
      ? 'import { createRequire } from "node:module"\nconst yopemRequire = createRequire(import.meta.url)\nconst yopemBabelConfig = yopemRequire("./babel.config.js")\n'
      : 'const yopemBabelConfig = require("./babel.config.js")\n',
  })

  return applyEdits(content, edits)
}

const lintRules = {
  "yopem-ui/enforce-styling-methods": "error",
  "yopem-ui/no-restyle": "error",
  "yopem-ui/no-raw-stylex-colors": "error",
  "yopem-ui/prefer-layout-primitives": "error",
  "yopem-ui/static-stylex": "error",
  "yopem-ui/valid-polymorphic-as": "error",
}

function lintConfig(content: string, shared?: SharedUI) {
  const config: JsonValue = JSON.parse(content)

  if (!object(config)) throw new Error("Invalid .oxlintrc.json")
  const plugins = config.jsPlugins ?? []
  const rules = config.rules ?? {}
  const overrides = config.overrides ?? []

  if (!Array.isArray(plugins) || !object(rules) || !Array.isArray(overrides)) {
    throw new Error("Invalid .oxlintrc.json plugins, rules, or overrides")
  }

  const componentOverride = {
    files: ["src/components/ui/**/*.{tsx,jsx}"],
    rules: Object.fromEntries(
      Object.keys(lintRules).map((name) => [name, "off"]),
    ),
  }

  const existing = plugins.find(
    (plugin) => object(plugin) && plugin.name === "yopem-ui",
  )

  if (
    existing &&
    (!object(existing) || existing.specifier !== "@yopem-ui/oxlint-plugin")
  ) {
    throw new Error("Conflicting yopem-ui plugin in .oxlintrc.json")
  }

  const configuredRules: JsonObject = { ...lintRules, ...rules }

  if (shared) {
    for (const name of [
      "yopem-ui/enforce-styling-methods",
      "yopem-ui/no-restyle",
      "yopem-ui/valid-polymorphic-as",
    ]) {
      const setting = configuredRules[name] ?? "error"
      const level = Array.isArray(setting) ? (setting[0] ?? "error") : setting

      if (level === "off" || level === 0) continue

      const options = Array.isArray(setting) ? (setting[1] ?? {}) : {}

      if (!object(options)) throw new Error(`Invalid options for ${name}`)

      const sources = options.componentSources ?? [
        "@/components/ui/",
        "@registry/components/ui/",
        "@yopem-ui/ui",
      ]

      if (!Array.isArray(sources) || !sources.every(isString)) {
        throw new Error(`Invalid componentSources for ${name}`)
      }

      configuredRules[name] = [
        level,
        {
          ...options,
          componentSources: [
            ...new Set([...sources, `${shared.name}/components/ui/`]),
          ],
        },
      ]
    }
  }

  const next = {
    ...config,
    jsPlugins: existing
      ? plugins
      : [
          ...plugins,
          { name: "yopem-ui", specifier: "@yopem-ui/oxlint-plugin" },
        ],
    rules: configuredRules,
    overrides: overrides.some(
      (entry) => JSON.stringify(entry) === JSON.stringify(componentOverride),
    )
      ? overrides
      : [...overrides, componentOverride],
  }

  return JSON.stringify(config) === JSON.stringify(next)
    ? content
    : `${JSON.stringify(next, null, 2)}\n`
}

function nextScripts(value: JsonValue | undefined) {
  if (!object(value)) throw new Error("Invalid package.json scripts")
  const scripts = { ...value }

  for (const name of ["dev", "build"]) {
    const command = scripts[name]

    if (
      !isString(command) ||
      !new RegExp(`^next ${name}(?:\\s|$)`).test(command) ||
      /--turbopack|--turbo|[;&|`$]/.test(command)
    ) {
      throw new Error(`Unsupported Next.js ${name} script`)
    }

    if (!command.includes("--webpack")) scripts[name] = `${command} --webpack`
  }

  if (scripts.lint === "eslint") scripts.lint = "eslint && oxlint ."

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
  const present = (name: string) => isString(dependencies[name])
  const detected: Framework[] = []

  if (present("next")) detected.push("next")

  if (present("astro")) detected.push("astro")

  if (present("@tanstack/react-start")) detected.push("tanstack-start")
  else if (present("@tanstack/react-router")) detected.push("tanstack-router")
  else if (
    present("@react-router/dev") ||
    present("react-router") ||
    present("react-router-dom")
  )
    detected.push("react-router")
  else if (present("vite") && present("react")) detected.push("vite")

  if (chosen && detected.includes(chosen)) return chosen

  if (detected.length !== 1 || chosen) {
    throw new Error(
      `Cannot detect one supported framework; found: ${detected.join(", ") || "none"}`,
    )
  }

  return detected[0]!
}

export async function initProject(options: InitOptions = {}) {
  if (options.dryRun) throw new Error("--dry-run is not supported for init")
  const root = await realpath(options.cwd ?? process.cwd())

  if (!(await existingFile(root, "package.json"))) {
    throw new Error("Run init from a project with package.json")
  }

  const packageText = await readFile(join(root, "package.json"), "utf8")
  const manifest: JsonValue = JSON.parse(packageText)

  if (
    !object(manifest) ||
    (!object(manifest.dependencies) && !object(manifest.devDependencies))
  ) {
    throw new Error("Invalid project package.json")
  }

  const dependencies = Object.fromEntries(
    [manifest.dependencies, manifest.devDependencies].flatMap((entry) =>
      object(entry) ? Object.entries(entry) : [],
    ),
  )

  const framework = detectFramework(dependencies, options.framework)
  const uiRoot = options.ui ? await realpath(resolve(root, options.ui)) : root
  let shared: SharedUI | undefined

  if (options.ui) {
    if (uiRoot === root)
      throw new Error("Shared UI package must differ from app")

    const uiManifest: JsonValue = JSON.parse(
      await readFile(join(uiRoot, "package.json"), "utf8"),
    )

    if (!object(uiManifest) || !isPackageName(uiManifest.name))
      throw new Error("Shared UI package requires a valid package name")

    const owner = await workspaceRoot(root)

    if ((await workspaceRoot(uiRoot)) !== owner)
      throw new Error("App and UI package must belong to the same workspace")

    shared = {
      name: uiManifest.name,
      source: `${relative(root, join(uiRoot, "src")).replaceAll("\\", "/")}/`,
    }
  }

  const packageRun = await packageRunner(root, options.run)
  const uiRun = await packageRunner(uiRoot, options.run)
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

  const retired = new Map<string, string>()

  let babelConfig: ReturnType<typeof migrateBabel> = {
    plugins: [],
    presets: [],
  }

  let postcssPlugins: string[] = []

  if (framework !== "next") {
    const babelPath = await chooseFile(
      root,
      [
        "babel.config.js",
        "babel.config.cjs",
        "babel.config.mjs",
        ".babelrc",
        ".babelrc.json",
      ],
      "",
    )

    const postcssPath = await chooseFile(
      root,
      ["postcss.config.js", "postcss.config.cjs", "postcss.config.mjs"],
      "",
    )

    if (babelPath) {
      const content = await readFile(join(root, babelPath), "utf8")
      babelConfig = migrateBabel(content, babelPath)
      retired.set(babelPath, content)
    }

    if (postcssPath) {
      const content = await readFile(join(root, postcssPath), "utf8")
      postcssPlugins = migratePostcss(content, postcssPath)
      retired.set(postcssPath, content)
    }
  }

  const tsPath =
    framework !== "next" &&
    framework !== "astro" &&
    (await existingFile(root, "tsconfig.app.json"))
      ? "tsconfig.app.json"
      : "tsconfig.json"

  await plan(tsPath, (content) => tsconfig(content, tsPath))
  await plan(".oxlintrc.json", (content) => lintConfig(content, shared), "{}")

  if (shared) {
    const prefix = relative(root, uiRoot).replaceAll("\\", "/")

    await plan(`${prefix}/package.json`, (content) => {
      const value: JsonValue = JSON.parse(content)

      if (
        !object(value) ||
        (value.exports !== undefined && !object(value.exports))
      )
        throw new Error("Shared UI package requires object exports")
      const exports = object(value.exports) ? { ...value.exports } : {}

      const paths = {
        "./components/ui/*": "./src/components/ui/*.tsx",
        "./lib/*": "./src/lib/*.ts",
        "./styles/tokens.stylex": "./src/styles/tokens.stylex.ts",
        "./styles/styles.css": "./src/styles/styles.css",
        "./theme/*": "./src/theme/*.tsx",
      }

      for (const [path, target] of Object.entries(paths)) {
        if (exports[path] !== undefined && exports[path] !== target)
          throw new Error(`Conflicting UI package export: ${path}`)
        exports[path] = target
      }

      const sideEffects =
        value.sideEffects === false
          ? ["**/*.css"]
          : Array.isArray(value.sideEffects) &&
              !value.sideEffects.includes("**/*.css")
            ? [...value.sideEffects, "**/*.css"]
            : value.sideEffects

      return JSON.stringify(value.exports) === JSON.stringify(exports) &&
        JSON.stringify(value.sideEffects) === JSON.stringify(sideEffects)
        ? content
        : `${JSON.stringify({ ...value, exports, sideEffects }, null, 2)}\n`
    })
  }

  const devDependencies = [
    "oxlint@^1.79.0",
    "@yopem-ui/oxlint-plugin@^0.1.0",
    "@rolldown/plugin-babel@^0.2.4",
    "@babel/core@^7.29.7",
    "@stylexjs/babel-plugin@^0.19.0",
    "@stylexjs/postcss-plugin@^0.19.0",
  ]

  const runtimeDependencies: string[] = shared
    ? [`${shared.name}@workspace:*`, "@stylexjs/stylex@^0.19.0"]
    : []

  if (framework === "astro") {
    const config = await chooseFile(root, [
      "astro.config.mjs",
      "astro.config.ts",
      "astro.config.js",
    ])

    await plan(config, (content) =>
      astroConfig(content, config, babelConfig, postcssPlugins, shared),
    )

    const layout = await chooseFile(root, [
      "src/layouts/Layout.astro",
      "src/layouts/layout.astro",
    ])

    await plan(layout, (content) => astroLayout(content, layout, shared?.name))

    for (const name of ["@astrojs/react", "react", "react-dom"]) {
      if (!(name in dependencies)) runtimeDependencies.push(name)
    }
  } else if (framework === "next") {
    if (shared) {
      const config = await chooseFile(
        root,
        ["next.config.ts", "next.config.mjs", "next.config.js"],
        "next.config.mjs",
      )

      const name = shared.name
      await plan(
        config,
        (content) => nextConfig(content, config, name),
        "export default {}\n",
      )
    }

    if (!object(manifest.scripts))
      throw new Error("Next.js scripts are missing")
    nextScripts(manifest.scripts)

    const layout = await chooseFile(root, [
      "src/app/layout.tsx",
      "app/layout.tsx",
    ])

    await plan(layout, (content) =>
      jsxLayout(content, layout, "next", shared?.name),
    )

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

    const babelContent = nextBabel(manifest.type === "module", shared)
    await plan(
      babel,
      (content) => {
        if (!sameSyntax(parsed(babel, content), parsed(babel, babelContent))) {
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
        postcssPath === "postcss.config.cjs" && content === nextPostcss(shared)
          ? content
          : postcss(
              content,
              postcssPath,
              postcssPath.endsWith(".mjs") ||
                (postcssPath.endsWith(".js") && manifest.type === "module"),
              shared,
            ),
      nextPostcss(shared),
    )
    devDependencies.splice(
      0,
      devDependencies.length,
      "@babel/core@^7.29.7",
      "@stylexjs/babel-plugin@^0.19.0",
      "@stylexjs/postcss-plugin@^0.19.0",
      "autoprefixer@^10.4.0",
      "oxlint@^1.79.0",
      "@yopem-ui/oxlint-plugin@^0.1.0",
    )
  } else {
    const config = await chooseFile(root, [
      "vite.config.ts",
      "vite.config.mts",
      "vite.config.js",
      "vite.config.mjs",
    ])

    await plan(config, (content) =>
      viteConfig(content, config, babelConfig, postcssPlugins, shared),
    )

    if (
      framework === "tanstack-start" ||
      (framework === "react-router" && "@react-router/dev" in dependencies)
    ) {
      const layout = await chooseFile(
        root,
        framework === "tanstack-start"
          ? ["src/routes/__root.tsx"]
          : ["app/root.tsx", "src/root.tsx"],
      )

      await plan(layout, (content) =>
        jsxLayout(content, layout, framework, shared?.name),
      )
    } else {
      const entry = await chooseFile(root, [
        "src/main.tsx",
        "src/main.jsx",
        "src/index.tsx",
        "src/index.jsx",
      ])

      await plan(entry, (content) => reactEntry(content, entry, shared?.name))
    }
  }

  let baseInstalled = false

  try {
    await installItem("base", {
      ...options,
      cwd: uiRoot,
      importPrefix: shared?.name,
      run: uiRun,
    })
    baseInstalled = true

    if (
      !(await readFile(join(uiRoot, "src/styles/styles.css"), "utf8")).includes(
        "@stylex;",
      )
    ) {
      throw new Error(
        "Add @stylex; to src/styles/styles.css before configuring StyleX",
      )
    }

    if (!(await existingFile(root, "package.json")))
      throw new Error("Missing package.json after installation")
    const packages = await readFile(join(root, "package.json"), "utf8")
    const installed: JsonValue = JSON.parse(packages)

    if (!object(installed))
      throw new Error("Invalid package.json after installation")

    const available = Object.fromEntries(
      [installed.dependencies, installed.devDependencies].flatMap((entry) =>
        object(entry) ? Object.entries(entry) : [],
      ),
    )

    const neededRuntime = runtimeDependencies.filter((name) => {
      if (shared && name === `${shared.name}@workspace:*`) {
        const version = available[shared.name]

        return (
          !isString(version) ||
          (version !== "*" && !version.startsWith("workspace:"))
        )
      }

      const packageName = name.includes("@", 1)
        ? name.slice(0, name.lastIndexOf("@"))
        : name

      return !(packageName in available)
    })

    if (neededRuntime.length) await packageRun(["add", ...neededRuntime], root)

    const neededDev = devDependencies.filter(
      (name) => !(name.split("@").slice(0, -1).join("@") in available),
    )

    if (neededDev.length) await packageRun(["add", "-d", ...neededDev], root)

    if (shared) {
      const path = `${relative(root, uiRoot).replaceAll("\\", "/")}/package.json`
      const planned = edits.get(path)

      if (planned) {
        if (!(await existingFile(root, path)))
          throw new Error("Missing UI package.json after installation")
        const current = await readFile(join(uiRoot, "package.json"), "utf8")
        const before: JsonValue = JSON.parse(planned.before!)
        const after: JsonValue = JSON.parse(planned.after)
        const value: JsonValue = JSON.parse(current)

        if (
          !object(before) ||
          !object(after) ||
          !object(value) ||
          value.name !== before.name ||
          JSON.stringify(value.exports) !== JSON.stringify(before.exports) ||
          JSON.stringify(value.sideEffects) !==
            JSON.stringify(before.sideEffects)
        )
          throw new Error("UI package exports changed during installation")

        edits.set(path, {
          before: current,
          after: `${JSON.stringify({ ...value, exports: after.exports, sideEffects: after.sideEffects }, null, 2)}\n`,
        })
      }
    }

    const changes = new Map<string, FileChange>(edits)

    for (const [path, before] of retired) {
      changes.set(path, { before, after: null })
    }

    if (framework === "next") {
      if (!(await existingFile(root, "package.json")))
        throw new Error("Missing package.json after installation")
      const before = await readFile(join(root, "package.json"), "utf8")
      const latest: JsonValue = JSON.parse(before)

      if (!object(latest))
        throw new Error("Invalid package.json after installation")

      if (JSON.stringify(latest.scripts) !== JSON.stringify(manifest.scripts)) {
        throw new Error("Next.js scripts changed during init")
      }

      const scripts = nextScripts(latest.scripts)

      changes.set("package.json", {
        before,
        after:
          JSON.stringify(latest.scripts) === JSON.stringify(scripts)
            ? before
            : `${JSON.stringify({ ...latest, scripts }, null, 2)}\n`,
      })
    }

    await writeFiles(root, changes)

    return { framework, configured: edits.size }
  } catch (cause) {
    if (!baseInstalled) throw cause
    throw new Error(
      `${cause instanceof Error ? cause.message : String(cause)}\nDependencies may have changed (package.json, lockfiles, node_modules); package-manager changes were not rolled back.\nPrior init base install may have changed source files and ui.json; that install was not rolled back.`,
      { cause },
    )
  }
}
