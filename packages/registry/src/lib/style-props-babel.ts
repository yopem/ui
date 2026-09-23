import type { NodePath, PluginObj, PluginPass } from "@babel/core"
import type * as BabelTypes from "@babel/types"

import { createRequire } from "node:module"
import { dirname, resolve } from "node:path"
import ts from "typescript-api"

// Node loads this build plugin directly from TypeScript in Next.js configs.
import {
  aliases,
  breakpoints,
  getConditions,
  scopes,
} from "./style-props-config.ts"

const conditions = getConditions()
const responsiveOrder = ["base", ...Object.keys(breakpoints)]
const require = createRequire(import.meta.url)
const reactTypes = resolve(
  dirname(require.resolve("@types/react/package.json")),
  "index.d.ts",
)
const program = ts.createProgram([reactTypes], { skipLibCheck: true })
const checker = program.getTypeChecker()
const properties = new Set<string>()
function collectProperties(node: ts.Node) {
  if (ts.isInterfaceDeclaration(node) && node.name.text === "CSSProperties") {
    for (const property of checker.getPropertiesOfType(
      checker.getTypeAtLocation(node),
    )) {
      properties.add(property.name)
    }
  }
  ts.forEachChild(node, collectProperties)
}
const reactSource = program.getSourceFile(reactTypes)
if (!reactSource) throw new Error("React CSS property types are unavailable")
collectProperties(reactSource)
properties.add("spaceX")
properties.add("spaceY")
if (properties.size < 300)
  throw new Error("React CSS property types are incomplete")
const spacing =
  /^(padding|margin|inset|gap$|rowGap$|columnGap$|space[XY]$|width$|height$|minWidth$|maxWidth$|minHeight$|maxHeight$|inlineSize$|blockSize$|minInlineSize$|maxInlineSize$|top$|right$|bottom$|left$|flexBasis$|textIndent$|scrollMargin|scrollPadding)/
const negativeSpacing =
  /^(margin|inset|space[XY]$|top$|right$|bottom$|left$|textIndent$|scrollMargin)/
const childSelector = ":where(*) > :not([hidden]) ~ :not([hidden])"

type StaticValue =
  | string
  | number
  | null
  | BabelTypes.MemberExpression
  | StaticValue[]
  | { [key: string]: StaticValue }
interface Declaration {
  property: string
  scope: string
  active: string[]
  value: string | number | BabelTypes.MemberExpression
}
interface StyleRule {
  [key: string]: string | number | BabelTypes.MemberExpression | StyleRule
}

function isReference(
  value: StaticValue | StyleRule,
): value is BabelTypes.MemberExpression {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    "type" in value &&
    value.type === "MemberExpression"
  )
}

function tokenReference(node: BabelTypes.Node, path: NodePath) {
  if (
    node.type !== "MemberExpression" ||
    node.object.type !== "Identifier" ||
    node.property.type !== "StringLiteral" ||
    !node.property.value.startsWith("--")
  )
    return false
  const binding = path.scope.getBinding(node.object.name)
  return (
    binding?.path.isImportSpecifier() &&
    binding.path.node.imported.type === "Identifier" &&
    binding.path.node.imported.name === "tokens" &&
    binding.path.parent.type === "ImportDeclaration" &&
    /(?:^|\/)styles\/tokens\.stylex$/.test(binding.path.parent.source.value)
  )
}

function staticValue(
  node: BabelTypes.Node | null,
  path: NodePath,
): StaticValue {
  switch (node?.type) {
    case "StringLiteral":
    case "NumericLiteral":
      return node.value
    case "NullLiteral":
      return null
    case "Identifier":
      if (node.name === "undefined" && !path.scope.getBinding("undefined"))
        return null
      break
    case "MemberExpression":
      if (tokenReference(node, path)) return node
      break
    case "UnaryExpression":
      if (node.operator === "-" && node.argument.type === "NumericLiteral")
        return -node.argument.value
      break
    case "ArrayExpression":
      return node.elements.map((entry) => entry && staticValue(entry, path))
    case "ObjectExpression": {
      const result: Record<string, StaticValue> = Object.create(null)
      for (const entry of node.properties) {
        if (
          entry.type !== "ObjectProperty" ||
          entry.computed ||
          (entry.key.type !== "Identifier" &&
            entry.key.type !== "StringLiteral")
        )
          break
        result[
          entry.key.type === "Identifier" ? entry.key.name : entry.key.value
        ] = staticValue(entry.value, path)
      }
      if (
        node.properties.every(
          (entry) =>
            entry.type === "ObjectProperty" &&
            !entry.computed &&
            (entry.key.type === "Identifier" ||
              entry.key.type === "StringLiteral"),
        )
      )
        return result
      break
    }
  }
  throw path.buildCodeFrameError("Style props require static JSX literals")
}

function compiledStyleReference(
  node: BabelTypes.Node,
  path: NodePath,
): node is BabelTypes.MemberExpression {
  if (
    node.type !== "MemberExpression" ||
    node.computed ||
    node.object.type !== "Identifier" ||
    node.property.type !== "Identifier"
  )
    return false
  const binding = path.scope.getBinding(node.object.name)
  if (!binding?.path.isVariableDeclarator()) return false
  const init = binding.path.node.init
  if (
    init?.type !== "CallExpression" ||
    init.callee.type !== "MemberExpression" ||
    init.callee.object.type !== "Identifier" ||
    init.callee.property.type !== "Identifier" ||
    init.callee.property.name !== "create"
  )
    return false
  const stylex = path.scope.getBinding(init.callee.object.name)
  return !!(
    stylex?.path.isImportNamespaceSpecifier() &&
    stylex.path.parent.type === "ImportDeclaration" &&
    stylex.path.parent.source.value === "@stylexjs/stylex"
  )
}

function jsxValue(
  attribute: BabelTypes.JSXAttribute,
  path: NodePath,
): StaticValue {
  const value = attribute.value
  if (value?.type === "StringLiteral") return value.value
  if (value?.type === "JSXExpressionContainer")
    return staticValue(value.expression, path)
  throw path.buildCodeFrameError("Style props require static JSX literals")
}

function normalized(
  property: string,
  value: StaticValue,
  path: NodePath,
): string | number | BabelTypes.MemberExpression {
  if (isReference(value)) return value
  if (
    (typeof value !== "string" && typeof value !== "number") ||
    (typeof value === "number" && !Number.isFinite(value))
  )
    throw path.buildCodeFrameError(
      `Style prop ${property} must be a finite string or number`,
    )
  if (typeof value === "number" && spacing.test(property)) {
    if (value < 0 && !negativeSpacing.test(property))
      throw path.buildCodeFrameError(
        `Style prop ${property} does not accept negative spacing`,
      )
    return `calc(var(--spacing) * ${value})`
  }
  return value
}

function isSingleCssValue(value: string) {
  let depth = 0
  for (const character of value.trim()) {
    if (character === "(") depth++
    if (character === ")") depth--
    if (depth === 0 && /\s/.test(character)) return false
  }
  return true
}

function parse(input: StaticValue, path: NodePath) {
  const declarations = new Map<string, Declaration>()
  function condition(
    name: string,
    active: string[],
    scope: string,
  ): [string[], string] {
    if (name === "base") return [active, scope]
    if (Object.hasOwn(scopes, name)) {
      if (scope)
        throw path.buildCodeFrameError("Pseudo-elements cannot be nested")
      return [active, scopes[name as keyof typeof scopes]]
    }
    if (!Object.hasOwn(conditions, name))
      throw path.buildCodeFrameError(`Unknown style condition: ${name}`)
    return [[...new Set([...active, name])].sort(), scope]
  }
  function property(
    name: string,
    value: StaticValue,
    active: string[],
    scope: string,
  ): void {
    if (value == null) return
    if (Array.isArray(value)) {
      if (value.length > responsiveOrder.length)
        throw path.buildCodeFrameError("Too many responsive array entries")
      value.forEach((entry, index) => {
        const [next, nextScope] = condition(
          responsiveOrder[index],
          active,
          scope,
        )
        property(name, entry, next, nextScope)
      })
      return
    }
    if (typeof value === "object" && !isReference(value)) {
      for (const [key, entry] of Object.entries(value)) {
        const [next, nextScope] = condition(key, active, scope)
        property(name, entry, next, nextScope)
      }
      return
    }
    const canonicalNames = Object.hasOwn(aliases, name)
      ? aliases[name as keyof typeof aliases]
      : [name]
    for (const canonical of canonicalNames) {
      const properties =
        canonical === "padding" &&
        (typeof value === "number" ||
          (typeof value === "string" && isSingleCssValue(value)))
          ? ["paddingBlock", "paddingInline"]
          : [canonical]
      for (const property of properties) {
        const key = JSON.stringify([property, scope, active])
        declarations.set(key, {
          property,
          scope,
          active,
          value: normalized(property, value, path),
        })
      }
    }
  }
  function object(value: StaticValue, active: string[] = [], scope = ""): void {
    if (
      value === null ||
      typeof value !== "object" ||
      Array.isArray(value) ||
      isReference(value)
    )
      throw path.buildCodeFrameError("Style objects must be objects")
    if (Object.hasOwn(value, "css")) object(value.css, active, scope)
    for (const [name, entry] of Object.entries(value)) {
      if (name === "css" || entry == null) continue
      if (
        name === "base" ||
        Object.hasOwn(conditions, name) ||
        Object.hasOwn(scopes, name)
      ) {
        const [next, nextScope] = condition(name, active, scope)
        object(entry, next, nextScope)
      } else if (
        name.startsWith("_") ||
        /^(sm|md|lg|xl|2xl)(Only|Down|To)/.test(name)
      ) {
        throw path.buildCodeFrameError(`Unknown style condition: ${name}`)
      } else if (
        properties.has(name) ||
        Object.hasOwn(aliases, name) ||
        name.startsWith("--")
      ) {
        property(name, entry, active, scope)
      } else {
        throw path.buildCodeFrameError(`Unknown style property: ${name}`)
      }
    }
  }
  object(input)
  return [...declarations.values()]
}

function nested(rule: StyleRule, key: string): StyleRule {
  const value = rule[key]
  if (typeof value === "object" && value !== null && !("type" in value))
    return value
  const child: StyleRule = Object.create(null)
  rule[key] = child
  return child
}

function styleObject(declarations: Declaration[]) {
  const styles: StyleRule = Object.create(null)
  for (const { property, scope, active, value } of declarations) {
    const selector = active
      .filter((name) => !conditions[name].startsWith("@media"))
      .map((name) => conditions[name])
      .join("")
    const media = active
      .filter((name) => conditions[name].startsWith("@media"))
      .map((name) => conditions[name])
    const target =
      scope ||
      (property === "spaceX" || property === "spaceY" ? childSelector : "")
    const name =
      property === "spaceX"
        ? "marginInlineStart"
        : property === "spaceY"
          ? "marginBlockStart"
          : property
    const group = target ? nested(styles, target) : styles
    const rule = nested(group, name)
    let targetRule = selector ? nested(rule, selector) : rule
    for (const query of media) targetRule = nested(targetRule, query)
    if (selector || media.length) {
      if (media.length) targetRule.default = value
      else rule[selector] = value
    } else rule.default = value
  }
  return styles
}

function babelObject(
  value: StyleRule | string | number | BabelTypes.MemberExpression,
  t: typeof BabelTypes,
): BabelTypes.Expression {
  if (isReference(value)) return t.cloneNode(value)
  if (value !== null && typeof value === "object") {
    return t.objectExpression(
      Object.entries(value).map(([key, entry]) =>
        t.objectProperty(t.stringLiteral(key), babelObject(entry, t)),
      ),
    )
  }
  return typeof value === "number"
    ? t.numericLiteral(value)
    : t.stringLiteral(value)
}

export default function stylePropsBabel({
  types: t,
}: {
  types: typeof BabelTypes
}): PluginObj<PluginPass> {
  return {
    name: "yopem-static-style-props",
    visitor: {
      Program: {
        enter(path) {
          const styles: BabelTypes.ObjectProperty[] = []
          let identifier: BabelTypes.Identifier | undefined
          path.traverse({
            JSXOpeningElement(element) {
              const tag = element.node.name
              if (tag.type !== "JSXIdentifier") return
              const binding = element.scope.getBinding(tag.name)
              if (!binding?.path.isImportSpecifier()) return
              const declaration = binding.path.parent
              if (declaration.type !== "ImportDeclaration") return
              if (
                !/^(?:@registry|@yopem\/registry|@)\/components\/ui\/(?:stylex\/)?[a-z][a-z-]*$/.test(
                  declaration.source.value,
                )
              )
                return
              const component = binding.path.node.imported
              if (
                component.type !== "Identifier" ||
                !/^[A-Z]/.test(component.name)
              )
                return
              const moduleName = declaration.source.value.split("/").at(-1)
              const componentName = component.name
                .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
                .toLowerCase()
              if (
                moduleName !== componentName &&
                !componentName.startsWith(`${moduleName}-`)
              )
                return
              const attributes = element.node.attributes
              const as = attributes.find(
                (attribute) =>
                  attribute.type === "JSXAttribute" &&
                  attribute.name.type === "JSXIdentifier" &&
                  attribute.name.name === "as",
              )
              const nativeTag =
                as?.type === "JSXAttribute" &&
                as.value?.type === "StringLiteral"
                  ? as.value.value
                  : as?.type === "JSXAttribute" &&
                      as.value?.type === "JSXExpressionContainer" &&
                      as.value.expression.type === "StringLiteral"
                    ? as.value.expression.value
                    : undefined
              const input: Record<string, StaticValue> = Object.create(null)
              const retained: BabelTypes.JSXOpeningElement["attributes"] = []
              let xstyle: BabelTypes.JSXAttribute | undefined
              let found = false
              for (const attribute of attributes) {
                if (
                  attribute.type !== "JSXAttribute" ||
                  attribute.name.type !== "JSXIdentifier"
                ) {
                  retained.push(attribute)
                  continue
                }
                const name = attribute.name.name
                if (name === "xstyle") {
                  xstyle = attribute
                  continue
                }
                if (
                  (component.name === "Box" &&
                    ((nativeTag === "img" &&
                      (name === "width" || name === "height")) ||
                      (nativeTag === "input" && name === "size") ||
                      (nativeTag === "meta" && name === "content"))) ||
                  ((component.name === "Autocomplete" ||
                    component.name === "Command") &&
                    name === "filter") ||
                  (component.name === "ScrollArea" &&
                    (name === "overscrollContain" ||
                      name === "scrollbarGutter" ||
                      name === "fill"))
                ) {
                  retained.push(attribute)
                  continue
                }
                if (
                  name === "css" ||
                  name === "base" ||
                  Object.hasOwn(conditions, name) ||
                  Object.hasOwn(scopes, name) ||
                  Object.hasOwn(aliases, name) ||
                  properties.has(name) ||
                  name.startsWith("--") ||
                  name.startsWith("_") ||
                  /^(sm|md|lg|xl|2xl)(Only|Down|To)/.test(name)
                ) {
                  if (
                    name === "css" &&
                    attribute.value?.type === "JSXExpressionContainer" &&
                    compiledStyleReference(attribute.value.expression, element)
                  ) {
                    input[name] = attribute.value.expression
                  } else input[name] = jsxValue(attribute, element)
                  found = true
                } else retained.push(attribute)
              }
              if (!found) {
                for (const attribute of attributes) {
                  if (attribute.type !== "JSXSpreadAttribute") continue
                  const argument = attribute.argument
                  const spreadBinding =
                    argument.type === "Identifier"
                      ? element.scope.getBinding(argument.name)
                      : undefined
                  const spread =
                    argument.type === "ObjectExpression"
                      ? argument
                      : spreadBinding?.path.isVariableDeclarator() &&
                          spreadBinding.constant &&
                          spreadBinding.path.node.init?.type ===
                            "ObjectExpression"
                        ? spreadBinding.path.node.init
                        : undefined
                  if (!spread) continue
                  for (const entry of spread.properties) {
                    if (
                      entry.type !== "ObjectProperty" ||
                      (entry.key.type !== "Identifier" &&
                        entry.key.type !== "StringLiteral")
                    )
                      continue
                    const key =
                      entry.key.type === "Identifier"
                        ? entry.key.name
                        : entry.key.value
                    if (
                      key === "css" ||
                      key === "base" ||
                      Object.hasOwn(conditions, key) ||
                      Object.hasOwn(scopes, key) ||
                      Object.hasOwn(aliases, key) ||
                      properties.has(key) ||
                      key.startsWith("--") ||
                      key.startsWith("_") ||
                      /^(sm|md|lg|xl|2xl)(Only|Down|To)/.test(key)
                    )
                      throw element.buildCodeFrameError(
                        "Static style props cannot be combined with JSX spreads",
                      )
                  }
                }
                return
              }
              if (
                attributes.some(
                  (attribute) => attribute.type === "JSXSpreadAttribute",
                )
              )
                throw element.buildCodeFrameError(
                  "Static style props cannot be combined with JSX spreads",
                )
              const compiledCss =
                input.css !== undefined && isReference(input.css)
                  ? input.css
                  : undefined
              const css =
                input.css == null || compiledCss
                  ? []
                  : parse(input.css, element)
              delete input.css
              const direct = parse(input, element)
              const refs: BabelTypes.Expression[] = []
              if (compiledCss) refs.push(compiledCss)
              for (const declarations of [css, direct]) {
                if (!declarations.length) continue
                identifier ??= path.scope.generateUidIdentifier("ysp")
                const key = `s${styles.length}`
                styles.push(
                  t.objectProperty(
                    t.identifier(key),
                    babelObject(styleObject(declarations), t),
                  ),
                )
                refs.push(
                  t.memberExpression(
                    t.cloneNode(identifier),
                    t.identifier(key),
                  ),
                )
              }
              if (
                xstyle?.value?.type === "JSXExpressionContainer" &&
                xstyle.value.expression.type !== "JSXEmptyExpression"
              )
                refs.push(xstyle.value.expression)
              else if (xstyle)
                throw element.buildCodeFrameError(
                  "xstyle must be a JSX expression",
                )
              if (refs.length)
                retained.push(
                  t.jsxAttribute(
                    t.jsxIdentifier("xstyle"),
                    t.jsxExpressionContainer(
                      refs.length === 1 ? refs[0] : t.arrayExpression(refs),
                    ),
                  ),
                )
              element.node.attributes = retained
            },
          })
          if (!styles.length || !identifier) return
          const importName = path.scope.generateUidIdentifier("stylex")
          const imports = path
            .get("body")
            .filter((entry) => entry.isImportDeclaration())
          const lastImport = imports.at(-1)
          const declaration = t.importDeclaration(
            [t.importNamespaceSpecifier(importName)],
            t.stringLiteral("@stylexjs/stylex"),
          )
          const call = t.variableDeclaration("const", [
            t.variableDeclarator(
              identifier,
              t.callExpression(
                t.memberExpression(
                  t.cloneNode(importName),
                  t.identifier("create"),
                ),
                [t.objectExpression(styles)],
              ),
            ),
          ])
          if (lastImport) lastImport.insertAfter([declaration, call])
          else path.unshiftContainer("body", [declaration, call])
        },
      },
    },
  }
}
