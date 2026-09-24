import {
  aliases,
  breakpoints,
  getConditions,
  scopes,
} from "@yopem-ui/registry/lib/style-props-config"
import { createRequire } from "node:module"
import { dirname, resolve } from "node:path"
import ts from "typescript-api"
import { createUnplugin } from "unplugin"

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
    ))
      properties.add(property.name)
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
const componentImport =
  /^(?:@registry|@yopem-ui\/registry|@)\/components\/ui\/(?:stylex\/)?[a-z][a-z-]*$/
const adapterImport =
  /^(?:@registry|@yopem-ui\/registry|@)\/lib\/style-props(?:\.tsx?)?$/
const preservedExternalProps = new Set(["size", "color", "width", "height"])

type StaticValue =
  | string
  | number
  | null
  | ts.PropertyAccessExpression
  | ts.ElementAccessExpression
  | StaticValue[]
  | { [key: string]: StaticValue }
type StyleRule =
  | string
  | number
  | ts.PropertyAccessExpression
  | ts.ElementAccessExpression
  | { [key: string]: StyleRule }
interface Declaration {
  property: string
  scope: string
  active: string[]
  value:
    | string
    | number
    | ts.PropertyAccessExpression
    | ts.ElementAccessExpression
}

function isReference(
  value: StaticValue | StyleRule,
): value is ts.PropertyAccessExpression | ts.ElementAccessExpression {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    "kind" in value
  )
}

function propertyName(node: ts.PropertyName) {
  if (ts.isIdentifier(node) || ts.isStringLiteral(node)) return node.text
  return undefined
}

function isShadowed(name: string, node: ts.Node) {
  for (
    let scope = node.parent;
    scope && !ts.isSourceFile(scope);
    scope = scope.parent
  ) {
    if (
      ts.isFunctionLike(scope) &&
      scope.parameters.some(
        (parameter) =>
          ts.isIdentifier(parameter.name) && parameter.name.text === name,
      )
    )
      return true
    if (ts.isBlock(scope) || ts.isModuleBlock(scope)) {
      for (const statement of scope.statements) {
        if (
          ts.isVariableStatement(statement) &&
          statement.declarationList.declarations.some(
            (declaration) =>
              ts.isIdentifier(declaration.name) &&
              declaration.name.text === name,
          )
        )
          return true
        if (
          (ts.isFunctionDeclaration(statement) ||
            ts.isClassDeclaration(statement)) &&
          statement.name?.text === name
        )
          return true
      }
    }
  }
  return false
}

function staticValue(
  node: ts.Expression,
  tokens: Set<string>,
  source: ts.SourceFile,
): StaticValue {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node))
    return node.text
  if (ts.isNumericLiteral(node)) return Number(node.text)
  if (node.kind === ts.SyntaxKind.NullKeyword) return null
  if (
    ts.isIdentifier(node) &&
    node.text === "undefined" &&
    !isShadowed("undefined", node)
  )
    return null
  if (
    ts.isPrefixUnaryExpression(node) &&
    node.operator === ts.SyntaxKind.MinusToken &&
    ts.isNumericLiteral(node.operand)
  )
    return -Number(node.operand.text)
  if (
    ts.isElementAccessExpression(node) &&
    ts.isIdentifier(node.expression) &&
    tokens.has(node.expression.text) &&
    !isShadowed(node.expression.text, node) &&
    ts.isStringLiteral(node.argumentExpression) &&
    node.argumentExpression.text.startsWith("--")
  )
    return node
  if (ts.isArrayLiteralExpression(node))
    return node.elements.map((entry) => staticValue(entry, tokens, source))
  if (ts.isObjectLiteralExpression(node)) {
    const result: Record<string, StaticValue> = Object.create(null)
    for (const entry of node.properties) {
      if (!ts.isPropertyAssignment(entry))
        throw new Error("Style props require static JSX literals")
      const key = propertyName(entry.name)
      if (key === undefined)
        throw new Error("Style props require static JSX literals")
      result[key] = staticValue(entry.initializer, tokens, source)
    }
    return result
  }
  throw new Error(
    `Style props require static JSX literals (${source.fileName}:${source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1})`,
  )
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

function parse(input: StaticValue) {
  const declarations = new Map<string, Declaration>()
  function condition(name: string, active: string[], scope: string) {
    if (name === "base") return { active, scope }
    if (Object.hasOwn(scopes, name)) {
      if (scope) throw new Error("Pseudo-elements cannot be nested")
      return { active, scope: scopes[name as keyof typeof scopes] }
    }
    if (!Object.hasOwn(conditions, name))
      throw new Error(`Unknown style condition: ${name}`)
    return { active: [...new Set([...active, name])].sort(), scope }
  }
  function normalized(property: string, value: StaticValue) {
    if (isReference(value)) return value
    if (
      (typeof value !== "string" && typeof value !== "number") ||
      (typeof value === "number" && !Number.isFinite(value))
    )
      throw new Error(
        `Style prop ${property} must be a finite string or number`,
      )
    if (typeof value === "number" && spacing.test(property)) {
      if (value < 0 && !negativeSpacing.test(property))
        throw new Error(
          `Style prop ${property} does not accept negative spacing`,
        )
      return `calc(var(--spacing) * ${value})`
    }
    return value
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
        throw new Error("Too many responsive array entries")
      value.forEach((entry, index) => {
        const next = condition(responsiveOrder[index]!, active, scope)
        property(name, entry, next.active, next.scope)
      })
      return
    }
    if (typeof value === "object" && !isReference(value)) {
      for (const [key, entry] of Object.entries(value)) {
        const next = condition(key, active, scope)
        property(name, entry, next.active, next.scope)
      }
      return
    }
    const canonicalNames = Object.hasOwn(aliases, name)
      ? aliases[name as keyof typeof aliases]
      : [name]
    for (const canonical of canonicalNames) {
      const names =
        canonical === "padding" &&
        (typeof value === "number" ||
          (typeof value === "string" && isSingleCssValue(value)))
          ? ["paddingBlock", "paddingInline"]
          : [canonical]
      for (const current of names) {
        declarations.set(JSON.stringify([current, scope, active]), {
          property: current,
          scope,
          active,
          value: normalized(current, value),
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
      throw new Error("Style objects must be objects")
    if (Object.hasOwn(value, "css")) object(value.css, active, scope)
    for (const [name, entry] of Object.entries(value)) {
      if (name === "css" || entry == null) continue
      if (
        name === "base" ||
        Object.hasOwn(conditions, name) ||
        Object.hasOwn(scopes, name)
      ) {
        const next = condition(name, active, scope)
        object(entry, next.active, next.scope)
      } else if (
        name.startsWith("_") ||
        /^(sm|md|lg|xl|2xl)(Only|Down|To)/.test(name)
      )
        throw new Error(`Unknown style condition: ${name}`)
      else if (
        properties.has(name) ||
        Object.hasOwn(aliases, name) ||
        name.startsWith("--")
      )
        property(name, entry, active, scope)
      else throw new Error(`Unknown style property: ${name}`)
    }
  }
  object(input)
  return [...declarations.values()]
}

function nested(rule: Record<string, StyleRule>, key: string) {
  const value = rule[key]
  if (typeof value === "object" && value !== null && !isReference(value))
    return value as Record<string, StyleRule>
  const child: Record<string, StyleRule> = Object.create(null)
  rule[key] = child
  return child
}

function styleObject(declarations: Declaration[]) {
  const styles: Record<string, StyleRule> = Object.create(null)
  for (const { property, scope, active, value } of declarations) {
    const selector = active
      .filter((name) => !conditions[name]!.startsWith("@media"))
      .map((name) => conditions[name])
      .join("")
    const media = active
      .filter((name) => conditions[name]!.startsWith("@media"))
      .map((name) => conditions[name]!)
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

function printStyle(value: StyleRule, source: ts.SourceFile): string {
  if (isReference(value)) return value.getText(source)
  if (typeof value === "object" && value !== null)
    return `{${Object.entries(value)
      .map(
        ([key, entry]) => `${JSON.stringify(key)}:${printStyle(entry, source)}`,
      )
      .join(",")}}`
  return JSON.stringify(value)
}

function isStyleName(name: string) {
  return (
    name === "css" ||
    name === "base" ||
    Object.hasOwn(conditions, name) ||
    Object.hasOwn(scopes, name) ||
    Object.hasOwn(aliases, name) ||
    properties.has(name) ||
    name.startsWith("--") ||
    name.startsWith("_") ||
    /^(sm|md|lg|xl|2xl)(Only|Down|To)/.test(name)
  )
}

function compile(code: string, id: string) {
  const source = ts.createSourceFile(
    id,
    code,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  )
  const components = new Map<string, string>()
  const adapters = new Set<string>()
  const external = new Map<string, Set<string>>()
  const tokens = new Set<string>()
  const stylex = new Set<string>()
  const compiled = new Map<string, Set<string>>()
  let lastImport = 0
  for (const statement of source.statements) {
    if (
      !ts.isImportDeclaration(statement) ||
      !ts.isStringLiteral(statement.moduleSpecifier)
    )
      continue
    lastImport = statement.end
    const specifier = statement.moduleSpecifier.text
    if (
      adapterImport.test(specifier) &&
      statement.importClause?.namedBindings &&
      ts.isNamedImports(statement.importClause.namedBindings)
    )
      for (const element of statement.importClause.namedBindings.elements)
        if (
          (element.propertyName?.text ?? element.name.text) ===
          "createStyleProps"
        )
          adapters.add(element.name.text)
    if (
      componentImport.test(specifier) &&
      statement.importClause?.namedBindings &&
      ts.isNamedImports(statement.importClause.namedBindings)
    ) {
      const moduleName = specifier.split("/").at(-1)
      for (const element of statement.importClause.namedBindings.elements) {
        const name = element.propertyName?.text ?? element.name.text
        const kebab = name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()
        if (
          /^[A-Z]/.test(name) &&
          (moduleName === kebab || kebab.startsWith(`${moduleName}-`))
        )
          components.set(element.name.text, name)
      }
    }
    if (
      /(?:^|\/)styles\/tokens\.stylex$/.test(specifier) &&
      statement.importClause?.namedBindings &&
      ts.isNamedImports(statement.importClause.namedBindings)
    )
      for (const element of statement.importClause.namedBindings.elements)
        if ((element.propertyName?.text ?? element.name.text) === "tokens")
          tokens.add(element.name.text)
    if (
      specifier === "@stylexjs/stylex" &&
      statement.importClause?.namedBindings &&
      ts.isNamespaceImport(statement.importClause.namedBindings)
    )
      stylex.add(statement.importClause.namedBindings.name.text)
  }
  for (const statement of source.statements) {
    if (!ts.isVariableStatement(statement)) continue
    for (const declaration of statement.declarationList.declarations) {
      if (
        !ts.isIdentifier(declaration.name) ||
        !declaration.initializer ||
        !ts.isCallExpression(declaration.initializer) ||
        !ts.isIdentifier(declaration.initializer.expression) ||
        !adapters.has(declaration.initializer.expression.text) ||
        isShadowed(declaration.initializer.expression.text, declaration)
      )
        continue
      const preserved = new Set(preservedExternalProps)
      const options = declaration.initializer.arguments[1]
      if (options) {
        if (!ts.isObjectLiteralExpression(options))
          throw new Error("createStyleProps options must be static literals")
        for (const property of options.properties) {
          if (
            !ts.isPropertyAssignment(property) ||
            propertyName(property.name) !== "preserve" ||
            !ts.isArrayLiteralExpression(property.initializer)
          )
            throw new Error("createStyleProps preserve must be a string array")
          for (const item of property.initializer.elements) {
            if (!ts.isStringLiteral(item))
              throw new Error(
                "createStyleProps preserve must be a string array",
              )
            preserved.add(item.text)
          }
        }
      }
      external.set(declaration.name.text, preserved)
    }
  }
  if (!components.size && !external.size) return null
  function scanStyles(node: ts.Node) {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.initializer &&
      ts.isCallExpression(node.initializer)
    ) {
      const call = node.initializer
      if (
        ts.isPropertyAccessExpression(call.expression) &&
        call.expression.name.text === "create" &&
        ts.isIdentifier(call.expression.expression) &&
        stylex.has(call.expression.expression.text)
      ) {
        const names = new Set<string>()
        const argument = call.arguments[0]
        if (argument && ts.isObjectLiteralExpression(argument))
          for (const property of argument.properties)
            if (ts.isPropertyAssignment(property)) {
              const name = propertyName(property.name)
              if (name) names.add(name)
            }
        compiled.set(node.name.text, names)
      }
    }
    ts.forEachChild(node, scanStyles)
  }
  scanStyles(source)
  const edits: { start: number; end: number; text: string }[] = []
  const styles: string[] = []
  const identifiers = new Set<string>()
  function collectIdentifiers(node: ts.Node) {
    if (ts.isIdentifier(node)) identifiers.add(node.text)
    ts.forEachChild(node, collectIdentifiers)
  }
  collectIdentifiers(source)
  function unique(base: string) {
    let name = base
    for (let i = 2; identifiers.has(name); i++) name = `${base}${i}`
    identifiers.add(name)
    return name
  }
  const styleName = unique("_ysp")
  const importName = unique("_stylex")
  function expression(attribute: ts.JsxAttribute) {
    if (!attribute.initializer)
      throw new Error("Style props require static JSX literals")
    if (ts.isStringLiteral(attribute.initializer)) return attribute.initializer
    if (
      ts.isJsxExpression(attribute.initializer) &&
      attribute.initializer.expression
    )
      return attribute.initializer.expression
    throw new Error("Style props require static JSX literals")
  }
  function compiledCss(node: ts.Expression) {
    return (
      ts.isPropertyAccessExpression(node) &&
      ts.isIdentifier(node.expression) &&
      !isShadowed(node.expression.text, node) &&
      compiled.get(node.expression.text)?.has(node.name.text)
    )
  }
  function scan(node: ts.Node) {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      if (ts.isIdentifier(node.tagName)) {
        const component = components.get(node.tagName.text)
        const preserved = external.get(node.tagName.text)
        if ((component || preserved) && !isShadowed(node.tagName.text, node)) {
          const attributes = node.attributes.properties
          if (preserved && attributes.some(ts.isJsxSpreadAttribute))
            throw new Error(
              "Static style props cannot be combined with JSX spreads",
            )
          const as = attributes.find(
            (entry) =>
              ts.isJsxAttribute(entry) &&
              ts.isIdentifier(entry.name) &&
              entry.name.text === "as",
          )
          const nativeTag =
            as && ts.isJsxAttribute(as) && as.initializer
              ? ts.isStringLiteral(as.initializer)
                ? as.initializer.text
                : ts.isJsxExpression(as.initializer) &&
                    as.initializer.expression &&
                    ts.isStringLiteral(as.initializer.expression)
                  ? as.initializer.expression.text
                  : undefined
              : undefined
          const input: Record<string, StaticValue> = Object.create(null)
          const removed: ts.JsxAttribute[] = []
          let xstyle: ts.JsxAttribute | undefined
          let cssRef: string | undefined
          for (const attribute of attributes) {
            if (
              !ts.isJsxAttribute(attribute) ||
              !ts.isIdentifier(attribute.name)
            )
              continue
            const name = attribute.name.text
            if (name === "xstyle") {
              xstyle = attribute
              continue
            }
            if (
              (component === "Box" &&
                ((nativeTag === "img" &&
                  (name === "width" || name === "height")) ||
                  (nativeTag === "input" && name === "size") ||
                  (nativeTag === "meta" && name === "content"))) ||
              ((component === "Autocomplete" || component === "Command") &&
                name === "filter") ||
              (component === "ScrollArea" &&
                (name === "overscrollContain" ||
                  name === "scrollbarGutter" ||
                  name === "fill"))
            )
              continue
            if (preserved?.has(name) || !isStyleName(name)) continue
            const value = expression(attribute)
            if (name === "css" && compiledCss(value))
              cssRef = value.getText(source)
            else input[name] = staticValue(value, tokens, source)
            removed.push(attribute)
          }
          if (!removed.length) {
            for (const attribute of attributes) {
              if (!ts.isJsxSpreadAttribute(attribute)) continue
              const spread = ts.isObjectLiteralExpression(attribute.expression)
                ? attribute.expression
                : ts.isIdentifier(attribute.expression)
                  ? source.statements
                      .flatMap((statement) =>
                        ts.isVariableStatement(statement)
                          ? statement.declarationList.declarations
                          : [],
                      )
                      .find(
                        (declaration) =>
                          ts.isIdentifier(declaration.name) &&
                          declaration.name.text ===
                            attribute.expression.getText(source) &&
                          declaration.initializer &&
                          ts.isObjectLiteralExpression(declaration.initializer),
                      )?.initializer
                  : undefined
              if (
                spread &&
                ts.isObjectLiteralExpression(spread) &&
                spread.properties.some(
                  (entry) =>
                    ts.isPropertyAssignment(entry) &&
                    isStyleName(propertyName(entry.name) ?? ""),
                )
              )
                throw new Error(
                  "Static style props cannot be combined with JSX spreads",
                )
            }
          } else {
            if (attributes.some(ts.isJsxSpreadAttribute))
              throw new Error(
                "Static style props cannot be combined with JSX spreads",
              )
            const css = input.css == null ? [] : parse(input.css)
            delete input.css
            const direct = parse(input)
            const refs: string[] = []
            if (cssRef) refs.push(cssRef)
            for (const declarations of [css, direct]) {
              if (!declarations.length) continue
              const key = `s${styles.length}`
              styles.push(
                `${key}:${printStyle(styleObject(declarations), source)}`,
              )
              refs.push(`${styleName}.${key}`)
            }
            if (xstyle) {
              if (
                !xstyle.initializer ||
                !ts.isJsxExpression(xstyle.initializer) ||
                !xstyle.initializer.expression
              )
                throw new Error("xstyle must be a JSX expression")
              refs.push(xstyle.initializer.expression.getText(source))
              removed.push(xstyle)
            }
            const start = Math.min(
              ...removed.map((entry) => entry.getFullStart()),
            )
            for (const attribute of removed)
              edits.push({
                start: attribute.getFullStart(),
                end: attribute.end,
                text: "",
              })
            if (refs.length)
              edits.push({
                start: start,
                end: start,
                text: ` xstyle={${refs.length === 1 ? refs[0] : `[${refs.join(", ")}]`}}`,
              })
          }
        }
      }
    }
    ts.forEachChild(node, scan)
  }
  scan(source)
  if (!edits.length) return null
  if (styles.length)
    edits.push({
      start: lastImport,
      end: lastImport,
      text: `\nimport * as ${importName} from "@stylexjs/stylex";\nconst ${styleName} = ${importName}.create({${styles.join(",")}});`,
    })
  edits.sort((a, b) => b.start - a.start || b.end - a.end)
  let output = code
  for (const edit of edits)
    output = output.slice(0, edit.start) + edit.text + output.slice(edit.end)
  return { code: output, map: null }
}

export const styleProps = createUnplugin(() => ({
  name: "yopem-style-props",
  enforce: "pre",
  transformInclude(id) {
    return /\.[cm]?[jt]sx?(?:\?.*)?$/.test(id)
  },
  transform(code, id) {
    if (
      !/["'](?:@registry|@yopem-ui\/registry|@)\/(?:components\/ui\/|lib\/style-props)/.test(
        code,
      )
    )
      return null
    return compile(code, id.split("?", 1)[0]!)
  },
}))
