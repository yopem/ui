import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const { compile } = await importPackage("@tailwindcss/node")
const { default: postcss } = await importPackage("postcss")

const sourceDir = path.join(appRoot, "src/components/demos/tailwind")
const targetDir = path.join(appRoot, "src/components/demos/stylex")
const reportPath = path.join(
  appRoot,
  "scripts/stylex-demo-migration-report.json",
)
const check = process.argv.includes("--check")

const files = fs
  .readdirSync(sourceDir)
  .filter((file) => file.endsWith(".tsx"))
  .sort()
const sources = new Map(
  files.map((file) => [
    file,
    fs.readFileSync(path.join(sourceDir, file), "utf8"),
  ]),
)
const literalPattern = /className\s*=\s*(["'])(.*?)\1/gs
const tokens = new Set()

for (const source of sources.values()) {
  for (const match of source.matchAll(literalPattern)) {
    for (const token of splitClasses(match[2])) tokens.add(token)
  }
}

const utilityMap = await buildUtilityMap(tokens)
const generated = new Map()
const unsupportedAttributes = []
const unsupportedExpressions = []
let convertedAttributes = 0
let rewrittenImports = 0

for (const [file, original] of sources) {
  let source = original.replaceAll(
    "@/components/ui/tailwind/",
    "@/components/ui/stylex/",
  )
  rewrittenImports += count(original, "@/components/ui/tailwind/")

  const stylesByClasses = new Map()
  const styleEntries = []
  let styleIndex = 0

  source = source.replace(
    literalPattern,
    (attribute, quote, classes, offset) => {
      const classTokens = splitClasses(classes)
      if (classTokens.length === 0) return attribute

      const unsupported = classTokens.flatMap(
        (token) =>
          utilityMap
            .get(token)
            ?.unsupported.map((reason) => ({ reason, token })) ?? [
            { reason: "utility did not compile", token },
          ],
      )

      if (unsupported.length > 0) {
        unsupportedAttributes.push({
          classes,
          file,
          line: lineAt(source, offset),
          unsupported,
        })
        return attribute
      }

      let styleName = stylesByClasses.get(classes)
      if (!styleName) {
        styleName = `demo${++styleIndex}`
        stylesByClasses.set(classes, styleName)
        styleEntries.push([styleName, mergeUtilities(classTokens, utilityMap)])
      }
      convertedAttributes++
      return `{...stylex.props(demoStyles.${styleName})}`
    },
  )

  if (styleEntries.length > 0) {
    source = addStylexImport(source)
    source = `${source.trimEnd()}\n\nconst demoStyles = stylex.create(${serializeStyles(styleEntries)})\n`
  }

  const lines = source.split("\n")
  for (let index = 0; index < lines.length; index++) {
    if (/className\s*=\s*\{/.test(lines[index])) {
      unsupportedExpressions.push({
        expression: lines[index].trim(),
        file,
        line: index + 1,
        reason: "dynamic className requires manual StyleX variant selection",
      })
    }
  }

  generated.set(file, source)
}

const report = {
  normalizations: [
    "Tailwind range media queries use equivalent min/max-width syntax accepted by StyleX 0.19.",
    "Tailwind hover-capability guards collapse to :hover, matching registry component conventions.",
    "Tailwind not-hover media syntax uses the equivalent (hover: none) query accepted by StyleX 0.19.",
  ],
  summary: {
    convertedAttributes,
    demoFiles: files.length,
    rewrittenImports,
    staticAttributesUnsupported: unsupportedAttributes.length,
    dynamicExpressionsUnsupported: unsupportedExpressions.length,
    uniqueUtilities: tokens.size,
    utilitiesSupported: [...utilityMap.values()].filter(
      (value) => value.unsupported.length === 0,
    ).length,
    utilitiesUnsupported: [...utilityMap.values()].filter(
      (value) => value.unsupported.length > 0,
    ).length,
  },
  unsupportedAttributes,
  unsupportedExpressions,
  unsupportedUtilities: [...utilityMap]
    .filter(([, value]) => value.unsupported.length > 0)
    .map(([token, value]) => ({ reasons: value.unsupported, token })),
}
const reportText = `${JSON.stringify(report, null, 2)}\n`

if (check) {
  const mismatches = []
  for (const [file, source] of generated) {
    const target = path.join(targetDir, file)
    if (!fs.existsSync(target) || fs.readFileSync(target, "utf8") !== source)
      mismatches.push(file)
  }
  const extras = fs.existsSync(targetDir)
    ? fs
        .readdirSync(targetDir)
        .filter((file) => file.endsWith(".tsx") && !generated.has(file))
    : []
  if (
    !fs.existsSync(reportPath) ||
    fs.readFileSync(reportPath, "utf8") !== reportText
  )
    mismatches.push(path.basename(reportPath))
  if (mismatches.length > 0 || extras.length > 0) {
    console.error(
      `StyleX demos stale: ${[...mismatches, ...extras].join(", ")}`,
    )
    process.exitCode = 1
  }
} else {
  fs.rmSync(targetDir, { force: true, recursive: true })
  fs.mkdirSync(targetDir, { recursive: true })
  for (const [file, source] of generated)
    fs.writeFileSync(path.join(targetDir, file), source)
  fs.writeFileSync(reportPath, reportText)
}

console.info(JSON.stringify(report.summary, null, 2))

async function buildUtilityMap(classTokens) {
  const tailwindCss = fs.readFileSync(
    path.join(packageDirectory("tailwindcss"), "index.css"),
    "utf8",
  )
  const appCss = fs
    .readFileSync(path.join(appRoot, "src/styles.css"), "utf8")
    .replace(/^@import .*;\s*$/gm, "")
  const compiler = await compile(`${tailwindCss}\n${appCss}`, {
    base: path.join(appRoot, "src"),
  })
  const root = postcss.parse(compiler.build([...classTokens]))
  const themeVariables = collectThemeVariables(root)
  const records = new Map([...classTokens].map((token) => [token, []]))
  const errors = new Map([...classTokens].map((token) => [token, new Set()]))
  const localInternalVariables = new Map(
    [...classTokens].map((token) => [token, new Map()]),
  )
  const globalInternalVariables = new Map()
  let order = 0

  root.walkAtRules("property", (atRule) => {
    if (!atRule.params.startsWith("--tw-")) return
    const initial = atRule.nodes?.find(
      (node) => node.type === "decl" && node.prop === "initial-value",
    )
    if (initial) globalInternalVariables.set(atRule.params, initial.value)
  })
  root.walkDecls(/^--tw-/, (declaration) => {
    const context = declarationContext(declaration, classTokens)
    if (context?.token && !context.unsupported)
      localInternalVariables
        .get(context.token)
        .set(declaration.prop, declaration.value)
  })

  root.walkDecls((declaration) => {
    const context = declarationContext(declaration, classTokens)
    if (!context) return
    const { conditions, token } = context
    if (context.unsupported) {
      errors.get(token).add(context.unsupported)
      return
    }

    if (declaration.prop.startsWith("--tw-")) return
    if (declaration.prop.startsWith("--")) {
      errors.get(token).add(`custom property ${declaration.prop}`)
      return
    }

    let value = replaceInternalVariables(
      declaration.value,
      new Map([
        ...globalInternalVariables,
        ...localInternalVariables.get(token),
      ]),
    )
    if (value === null) {
      errors
        .get(token)
        .add(`unresolved Tailwind variable in ${declaration.prop}`)
      return
    }
    value = resolveThemeVariables(value, themeVariables)
    if (!value.trim()) {
      errors.get(token).add(`empty generated value in ${declaration.prop}`)
      return
    }
    if (
      /\b(?:spin|ping|pulse|bounce)\b/.test(value) &&
      declaration.prop === "animation"
    ) {
      errors
        .get(token)
        .add("keyframe animation requires manual stylex.keyframes")
      return
    }

    const property = logicalProperty(declaration.prop)
    if (!property) {
      errors.get(token).add(`unsupported property ${declaration.prop}`)
      return
    }
    records.get(token).push({ conditions, order: order++, property, value })
  })

  return new Map(
    [...classTokens].map((token) => {
      const unsupported = [...errors.get(token)]
      const tokenRecords = records.get(token)
      if (tokenRecords.length === 0 && unsupported.length === 0)
        unsupported.push("no generated declaration")
      return [token, { records: tokenRecords, unsupported }]
    }),
  )
}

function declarationContext(declaration, classTokens) {
  const ancestors = []
  for (let node = declaration.parent; node; node = node.parent)
    ancestors.unshift(node)

  let token
  let selector = "&"
  let matchedRule = false
  const conditions = []

  for (const node of ancestors) {
    if (node.type === "atrule") {
      if (node.name === "layer") continue
      if (
        node.name !== "media" &&
        node.name !== "supports" &&
        node.name !== "container"
      ) {
        if (token) return markUnsupported(token, `unsupported @${node.name}`)
        continue
      }
      conditions.push(`@${node.name} ${node.params}`)
      continue
    }
    if (node.type !== "rule") continue

    const parsed = parseSelector(node.selector, classTokens)
    if (parsed?.token) {
      if (token && token !== parsed.token)
        return markUnsupported(token, "selector combines utilities")
      token = parsed.token
      selector = parsed.selector
      matchedRule = true
      continue
    }
    if (!matchedRule) continue
    if (node.selector.includes(","))
      return markUnsupported(token, "selector list")
    selector = node.selector.replaceAll("&", selector)
  }

  if (!token) return null
  const normalized = normalizeSelector(selector)
  if (normalized === null)
    return markUnsupported(token, `relational selector ${selector}`)
  const normalizedConditions = conditions.map(normalizeAtRule)
  if (normalized === ":hover") {
    const hoverGuard = normalizedConditions.indexOf("@media (hover: hover)")
    if (hoverGuard !== -1) normalizedConditions.splice(hoverGuard, 1)
  }
  if (normalized) normalizedConditions.unshift(normalized)
  return { conditions: normalizedConditions, token }

  function markUnsupported(utility, reason) {
    return { conditions: [], token: utility, unsupported: reason }
  }
}

function parseSelector(selector, classTokens) {
  if (selector.includes(",")) return null
  for (const token of [...classTokens].sort(
    (left, right) => right.length - left.length,
  )) {
    const marker = `.${cssEscape(token)}`
    const index = selector.indexOf(marker)
    if (index === -1) continue
    const next = selector[index + marker.length]
    if (next && /[a-zA-Z0-9_-]/.test(next)) continue
    return {
      selector: `${selector.slice(0, index)}&${selector.slice(index + marker.length)}`,
      token,
    }
  }
  return null
}

function cssEscape(value) {
  let result = ""
  for (let index = 0; index < value.length; index++) {
    const code = value.charCodeAt(index)
    const character = value[index]
    if (code === 0) {
      result += "\uFFFD"
    } else if (
      (code >= 1 && code <= 31) ||
      code === 127 ||
      (index === 0 && code >= 48 && code <= 57) ||
      (index === 1 && code >= 48 && code <= 57 && value[0] === "-")
    ) {
      result += `\\${code.toString(16)} `
    } else if (index === 0 && character === "-" && value.length === 1) {
      result += "\\-"
    } else if (
      code >= 128 ||
      character === "-" ||
      character === "_" ||
      /[a-zA-Z0-9]/.test(character)
    ) {
      result += character
    } else {
      result += `\\${character}`
    }
  }
  return result
}

function normalizeSelector(selector) {
  selector = selector.trim()
  if (selector === "&") return ""
  if (!selector.startsWith("&")) return null
  selector = selector.slice(1)
  selector = selector.replace(/^:where\((\[[^)]+\])\)$/, "$1")
  selector = selector.replace(/^:where\((:[^)]+)\)$/, "$1")
  if (/^\[[^\]]+\]$/.test(selector)) return selector
  if (/^::(?:after|before|placeholder)$/.test(selector)) return selector
  if (
    /^:(?:active|checked|disabled|empty|enabled|first-child|first-of-type|focus|focus-visible|focus-within|invalid|last-child|last-of-type|link|not\([^)]*\)|only-child|optional|placeholder-shown|read-only|required|target|valid|visited|where\([^)]*\)|hover)$/.test(
      selector,
    )
  )
    return selector
  return null
}

function normalizeAtRule(condition) {
  return condition
    .replace("@media not (hover: hover)", "@media (hover: none)")
    .replace(/@media \(width >= ([^)]+)\)/, "@media (min-width: $1)")
    .replace(
      /@media \(width < ([0-9.]+)rem\)/,
      (_, value) => `@media (max-width: ${Number(value) - 0.001}rem)`,
    )
}

function collectThemeVariables(root) {
  const variables = new Map()
  root.walkDecls(/^--/, (declaration) => {
    if (
      isResolvableThemeVariable(declaration.prop) &&
      !variables.has(declaration.prop)
    ) {
      variables.set(declaration.prop, declaration.value)
    }
  })
  return variables
}

function isResolvableThemeVariable(name) {
  return /^--(?:animate-|aspect-|blur-|breakpoint-|color-|container-|default-|drop-shadow-|ease-|font-(?!feature|variation)|leading-|perspective-|radius-.+|shadow-|spacing$|text-|tracking-)/.test(
    name,
  )
}

function resolveThemeVariables(value, variables, seen = new Set()) {
  return replaceVariables(value, (name, fallback) => {
    if (!variables.has(name) || seen.has(name))
      return fallback ?? `var(${name})`
    const nextSeen = new Set(seen).add(name)
    return resolveThemeVariables(variables.get(name), variables, nextSeen)
  })
}

function replaceInternalVariables(value, variables, seen = new Set()) {
  let failed = false
  const replaced = replaceVariables(value, (name, fallback) => {
    if (!name.startsWith("--tw-"))
      return fallback === undefined
        ? `var(${name})`
        : `var(${name}, ${fallback})`
    const replacement = variables.get(name) ?? fallback
    if (replacement === undefined || seen.has(name)) {
      failed = true
      return ""
    }
    return (
      replaceInternalVariables(
        replacement,
        variables,
        new Set(seen).add(name),
      ) ?? ""
    )
  })
  return failed ? null : replaced
}

function replaceVariables(value, replacer) {
  let output = ""
  for (let index = 0; index < value.length;) {
    const start = value.indexOf("var(", index)
    if (start === -1) return output + value.slice(index)
    output += value.slice(index, start)
    const end = matchingParen(value, start + 3)
    if (end === -1) return output + value.slice(start)
    const body = value.slice(start + 4, end)
    const comma = topLevelComma(body)
    const name = (comma === -1 ? body : body.slice(0, comma)).trim()
    const fallback = comma === -1 ? undefined : body.slice(comma + 1).trim()
    output += replacer(name, fallback)
    index = end + 1
  }
  return output
}

function matchingParen(value, openIndex) {
  let depth = 0
  for (let index = openIndex; index < value.length; index++) {
    if (value[index] === "(") depth++
    if (value[index] === ")" && --depth === 0) return index
  }
  return -1
}

function topLevelComma(value) {
  let depth = 0
  for (let index = 0; index < value.length; index++) {
    if (value[index] === "(") depth++
    else if (value[index] === ")") depth--
    else if (value[index] === "," && depth === 0) return index
  }
  return -1
}

function logicalProperty(property) {
  const logical = {
    "border-bottom-color": "borderBlockEndColor",
    "border-bottom-style": "borderBlockEndStyle",
    "border-bottom-width": "borderBlockEndWidth",
    "border-left-color": "borderInlineStartColor",
    "border-left-style": "borderInlineStartStyle",
    "border-left-width": "borderInlineStartWidth",
    "border-right-color": "borderInlineEndColor",
    "border-right-style": "borderInlineEndStyle",
    "border-right-width": "borderInlineEndWidth",
    "border-top-color": "borderBlockStartColor",
    "border-top-style": "borderBlockStartStyle",
    "border-top-width": "borderBlockStartWidth",
    bottom: "insetBlockEnd",
    height: "blockSize",
    left: "insetInlineStart",
    "margin-bottom": "marginBlockEnd",
    "margin-left": "marginInlineStart",
    "margin-right": "marginInlineEnd",
    "margin-top": "marginBlockStart",
    "max-height": "maxBlockSize",
    "max-width": "maxInlineSize",
    "min-height": "minBlockSize",
    "min-width": "minInlineSize",
    "padding-bottom": "paddingBlockEnd",
    "padding-left": "paddingInlineStart",
    "padding-right": "paddingInlineEnd",
    "padding-top": "paddingBlockStart",
    right: "insetInlineEnd",
    top: "insetBlockStart",
    width: "inlineSize",
  }
  if (logical[property]) return logical[property]
  if (property.startsWith("--")) return null
  return property
    .replace(/^-([a-z])/, (_, letter) => letter.toUpperCase())
    .replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())
}

function mergeUtilities(classTokens, utilities) {
  const root = new Map()
  const pseudos = new Map()
  const records = classTokens
    .flatMap((token) => utilities.get(token).records)
    .sort((left, right) => left.order - right.order)

  for (const record of records) {
    const conditions = [...record.conditions]
    const pseudo = conditions[0]?.startsWith("::")
      ? conditions.shift()
      : undefined
    const trees = pseudo ? getOrCreate(pseudos, pseudo, () => new Map()) : root
    const tree = trees.get(record.property) ?? {
      children: new Map(),
      value: undefined,
    }
    let node = tree
    for (const condition of conditions) {
      if (!node.children.has(condition))
        node.children.set(condition, { children: new Map(), value: undefined })
      node = node.children.get(condition)
    }
    node.value = record.value
    trees.set(record.property, tree)
  }
  return { pseudos, root }
}

function getOrCreate(map, key, create) {
  if (!map.has(key)) map.set(key, create())
  return map.get(key)
}

function serializeStyles(entries) {
  const lines = ["{"]
  for (const [name, style] of entries) {
    lines.push(`  ${name}: {`)
    for (const [property, tree] of style.root)
      lines.push(`    ${property}: ${serializeTree(tree, 4)},`)
    for (const [pseudo, properties] of style.pseudos) {
      lines.push(`    ${JSON.stringify(pseudo)}: {`)
      for (const [property, tree] of properties)
        lines.push(`      ${property}: ${serializeTree(tree, 6)},`)
      lines.push("    },")
    }
    lines.push("  },")
  }
  lines.push("}")
  return lines.join("\n")
}

function serializeTree(tree, indent) {
  if (tree.children.size === 0) return JSON.stringify(tree.value)
  const lines = ["{"]
  lines.push(
    `${" ".repeat(indent + 2)}default: ${tree.value === undefined ? "null" : JSON.stringify(tree.value)},`,
  )
  for (const [condition, child] of tree.children) {
    lines.push(
      `${" ".repeat(indent + 2)}${JSON.stringify(condition)}: ${serializeTree(child, indent + 2)},`,
    )
  }
  lines.push(`${" ".repeat(indent)}}`)
  return lines.join("\n")
}

function addStylexImport(source) {
  const statement = 'import * as stylex from "@stylexjs/stylex"\n'
  const directive = source.match(/^("use client"\n\n)/)
  if (directive)
    return `${directive[1]}${statement}${source.slice(directive[1].length)}`
  const firstImport = source.indexOf("import ")
  if (firstImport !== -1)
    return `${source.slice(0, firstImport)}${statement}${source.slice(firstImport)}`
  return `${statement}\n${source}`
}

function splitClasses(classes) {
  return classes.trim().split(/\s+/).filter(Boolean)
}

function lineAt(source, offset) {
  return source.slice(0, offset).split("\n").length
}

function count(source, value) {
  return source.split(value).length - 1
}

function packageDirectory(name) {
  const workspaceRoot = path.resolve(appRoot, "../..")
  const projectPackage = path.join(
    workspaceRoot,
    "node_modules/.bun/node_modules",
    name,
  )
  if (fs.existsSync(projectPackage)) return fs.realpathSync(projectPackage)

  const cacheRoot = path.join(os.homedir(), ".bun/install/cache")
  const [scope, packageName] = name.startsWith("@")
    ? name.split("/")
    : [undefined, name]
  const cache = scope ? path.join(cacheRoot, scope) : cacheRoot
  const prefix = `${packageName}@`
  const candidates = fs
    .readdirSync(cache)
    .filter((entry) => entry.startsWith(prefix))
    .map((entry) => path.join(cache, entry))
    .filter((entry) => fs.existsSync(path.join(entry, "package.json")))
    .sort()
  const directory = candidates.at(-1)
  if (!directory) throw new Error(`Missing ${name}; run bun install first`)
  return directory
}

function importPackage(name) {
  const directory = packageDirectory(name)
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(directory, "package.json"), "utf8"),
  )
  const exported = packageJson.exports?.["."]
  const entry =
    (typeof exported === "string"
      ? exported
      : (exported?.import ?? exported?.default ?? exported?.require)) ??
    packageJson.module ??
    packageJson.main
  if (!entry) throw new Error(`Cannot resolve entry for ${name}`)
  return import(pathToFileURL(path.join(directory, entry)).href)
}
