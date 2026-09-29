import { dirname, relative, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { format } from "oxfmt"
import ts from "typescript-api"

import { sourceItems } from "./items/index"
import { sourceFilePath } from "./source-files"

const root = dirname(fileURLToPath(import.meta.url))

export function extractDocs() {
  const configPath = resolve(root, "../tsconfig.json")
  const config = ts.readConfigFile(configPath, ts.sys.readFile)

  const parsed = ts.parseJsonConfigFileContent(
    config.config,
    ts.sys,
    dirname(configPath),
    undefined,
    configPath,
  )

  if (config.error || parsed.errors.length) {
    throw new Error(
      ts.formatDiagnosticsWithColorAndContext(
        config.error ? [config.error] : parsed.errors,
        {
          getCanonicalFileName: (name) => name,
          getCurrentDirectory: () => root,
          getNewLine: () => "\n",
        },
      ),
    )
  }

  const files = sourceItems.flatMap((item) =>
    item.files
      .filter((file) => /\.tsx?$/.test(file.path))
      .map((file) => sourceFilePath(file.path)),
  )

  const program = ts.createProgram([...new Set(files)], parsed.options)
  const diagnostics = ts.getPreEmitDiagnostics(program)

  if (diagnostics.length)
    throw new Error(
      ts.formatDiagnosticsWithColorAndContext(diagnostics, {
        getCanonicalFileName: (name) => name,
        getCurrentDirectory: () => root,
        getNewLine: () => "\n",
      }),
    )
  const checker = program.getTypeChecker()
  const flags = ts.TypeFormatFlags.NoTruncation

  const text = (type: ts.Type, node: ts.Node) => {
    const externalAlias = type.aliasSymbol?.declarations?.some((d) =>
      d.getSourceFile().fileName.includes("node_modules"),
    )

    const types = type.isUnion() && !externalAlias ? type.types : [type]

    const values = types.map((t) => {
      const value = checker.typeToString(t, node, flags)

      return types.length > 1 && t.getCallSignatures().length
        ? `(${value})`
        : value
    })

    if (values.includes("false") && values.includes("true")) {
      values.splice(values.indexOf("false"), 1, "boolean")
      values.splice(values.indexOf("true"), 1)
    }

    return values
      .join(" | ")
      .replaceAll(/import\("[^"]*node_modules\//g, 'import("')
  }

  const resolveSymbol = (symbol: ts.Symbol) =>
    symbol.flags & ts.SymbolFlags.Alias
      ? checker.getAliasedSymbol(symbol)
      : symbol

  const source = (node: ts.Node) => {
    const path = node.getSourceFile().fileName.replaceAll("\\", "/")
    const dependency = path.lastIndexOf("node_modules/")

    return dependency >= 0 ? path.slice(dependency + 13) : relative(root, path)
  }

  function defaults(node: ts.Node, seen = new Set<ts.Node>()) {
    const values: Record<string, string> = {}

    if (seen.has(node)) return values
    seen.add(node)
    let implementation: ts.FunctionLikeDeclaration | undefined

    function find(child: ts.Node) {
      if (implementation) return

      if (
        ts.isFunctionDeclaration(child) ||
        ts.isFunctionExpression(child) ||
        ts.isArrowFunction(child)
      )
        implementation = child
      else ts.forEachChild(child, find)
    }

    find(node)

    if (!implementation) return values
    const parameter = implementation.parameters[0]?.name

    const rest =
      parameter && ts.isObjectBindingPattern(parameter)
        ? parameter.elements.find((e) => e.dotDotDotToken)?.name.getText()
        : parameter?.getText()

    if (parameter && ts.isObjectBindingPattern(parameter)) {
      for (const binding of parameter.elements) {
        if (binding.initializer)
          values[(binding.propertyName ?? binding.name).getText()] =
            binding.initializer.getText()
      }
    }

    function visit(child: ts.Node) {
      if (
        child !== implementation &&
        (ts.isFunctionExpression(child) ||
          ts.isArrowFunction(child) ||
          ts.isFunctionDeclaration(child))
      )
        return

      if (
        ts.isJsxAttributes(child) &&
        child.properties.some(
          (p) => ts.isJsxSpreadAttribute(p) && p.expression.getText() === rest,
        )
      ) {
        for (const attr of child.properties) {
          if (!ts.isJsxAttribute(attr)) continue
          const initializer = attr.initializer

          const expression =
            initializer && ts.isJsxExpression(initializer)
              ? initializer.expression
              : initializer

          if (!initializer) values[attr.name.getText()] ??= "true"
          else if (
            expression &&
            (ts.isStringLiteral(expression) ||
              ts.isNumericLiteral(expression) ||
              expression.kind === ts.SyntaxKind.TrueKeyword ||
              expression.kind === ts.SyntaxKind.FalseKeyword ||
              expression.kind === ts.SyntaxKind.NullKeyword)
          )
            values[attr.name.getText()] ??= expression.getText()
        }

        const element = child.parent

        if (
          ts.isJsxOpeningElement(element) ||
          ts.isJsxSelfClosingElement(element)
        ) {
          const symbol = checker.getSymbolAtLocation(element.tagName)
          const declaration = symbol && resolveSymbol(symbol).valueDeclaration

          if (declaration?.getSourceFile().fileName.startsWith(root)) {
            for (const [name, value] of Object.entries(
              defaults(declaration, seen),
            ))
              values[name] ??= value
          }
        }
      }

      ts.forEachChild(child, visit)
    }

    visit(implementation)

    return values
  }

  function properties(
    types: ts.Type[],
    node: ts.Node,
    fallback: Record<string, string> = {},
  ) {
    const branches = types
      .flatMap((type) => (type.isUnion() ? type.types : [type]))
      .filter(
        (t) =>
          !(
            t.flags &
            (ts.TypeFlags.Undefined |
              ts.TypeFlags.Null |
              ts.TypeFlags.StringLike |
              ts.TypeFlags.NumberLike |
              ts.TypeFlags.BooleanLike |
              ts.TypeFlags.ESSymbolLike |
              ts.TypeFlags.BigIntLike)
          ),
      )

    const branchProperties = branches.map(
      (t) => new Map(checker.getPropertiesOfType(t).map((p) => [p.name, p])),
    )

    const names = new Set(
      branchProperties.flatMap((props) => [...props.keys()]),
    )

    return [...names].sort().map((name) => {
      const symbols = branchProperties.map((props) => props.get(name))
      const symbol = symbols.find((p) => p !== undefined)!
      const declaration = symbol.declarations?.[0] ?? node

      const types = symbols.flatMap((p) =>
        p ? [text(checker.getTypeOfSymbolAtLocation(p, node), node)] : [],
      )

      const tag = symbol
        .getJsDocTags(checker)
        .find((t) => t.name === "default" || t.name === "defaultValue")

      const defaultValue =
        (Object.hasOwn(fallback, name) ? fallback[name] : undefined) ??
        (tag?.text ? ts.displayPartsToString(tag.text) : undefined)

      const property = {
        name:
          name.startsWith("__@") &&
          (ts.isPropertySignature(declaration) ||
            ts.isMethodSignature(declaration)) &&
          ts.isComputedPropertyName(declaration.name)
            ? declaration.name.getText()
            : name,
        type: [...new Set(types)].join(" | "),
        required: symbols.every(
          (p) => p && !(p.flags & ts.SymbolFlags.Optional),
        ),
        description: [
          ...new Set(
            symbols
              .flatMap((p) =>
                p
                  ? [
                      ts.displayPartsToString(
                        p.getDocumentationComment(checker),
                      ),
                    ]
                  : [],
              )
              .filter(Boolean),
          ),
        ].join("\n\n"),
      }

      return defaultValue === undefined
        ? { ...property, source: source(declaration) }
        : { ...property, default: defaultValue, source: source(declaration) }
    })
  }

  // Only inspect direct record fields, never array, callable, React or built-in internals.
  function recordTypes(type: ts.Type) {
    return (type.isUnion() ? type.types : [type]).filter(
      (branch) =>
        !!(branch.flags & (ts.TypeFlags.Object | ts.TypeFlags.Intersection)) &&
        !branch.getCallSignatures().length &&
        !checker.isArrayType(branch) &&
        !checker.isTupleType(branch) &&
        !branch.getProperty("$$typeof") &&
        !branch.getProperty("then") &&
        !branch
          .getSymbol()
          ?.declarations?.some((declaration) =>
            /(?:@types\/react\/|typescript[^/]*\/lib\/lib\.)/.test(
              declaration.getSourceFile().fileName,
            ),
          ),
    )
  }

  function part(exported: ts.Symbol, name: string, memberType?: ts.Type) {
    const symbol = resolveSymbol(exported)
    const node = symbol.valueDeclaration ?? symbol.declarations?.[0]

    if (!node) throw new Error(`Missing declaration for ${name}`)
    const isType = !(symbol.flags & ts.SymbolFlags.Value)

    const type =
      memberType ??
      (isType
        ? checker.getDeclaredTypeOfSymbol(symbol)
        : checker.getTypeOfSymbolAtLocation(symbol, node))

    const signatures = type.getCallSignatures()

    const kind = isType
      ? "type"
      : name.endsWith("Context")
        ? "value"
        : signatures.length
          ? /^[A-Z]/.test(name.split(".").at(-1)!) &&
            !name.includes("CreateHandle")
            ? "component"
            : "function"
          : symbol.flags & ts.SymbolFlags.Namespace
            ? "namespace"
            : "value"

    const propsTypes =
      signatures.length && kind !== "value" && !isType
        ? signatures.flatMap((signature) =>
            signature.parameters[0]
              ? [
                  checker.getTypeOfSymbolAtLocation(
                    signature.parameters[0],
                    node,
                  ),
                ]
              : [],
          )
        : [type]

    const variants = propsTypes
      .flatMap((t) => (t.isUnion() ? t.types : [t]))
      .filter(
        (t) => t.flags & (ts.TypeFlags.Object | ts.TypeFlags.Intersection),
      )

    return {
      name,
      kind,
      source: source(node),
      aliasOf:
        symbol.name !== exported.name &&
        node.getSourceFile().fileName.startsWith(root)
          ? symbol.name
          : null,
      description: ts.displayPartsToString(
        symbol.getDocumentationComment(checker),
      ),
      signatures: signatures.length
        ? signatures.map((s) => checker.signatureToString(s, node, flags))
        : [
            kind === "namespace"
              ? `typeof ${name}`
              : checker.typeToString(
                  type,
                  node,
                  flags | ts.TypeFormatFlags.InTypeAlias,
                ),
          ],
      parameters:
        kind === "function"
          ? (signatures[0]?.parameters ?? []).map((parameter) => {
              const declaration = parameter.valueDeclaration

              const parameterType = checker.getTypeOfSymbolAtLocation(
                parameter,
                node,
              )

              const fallback: Record<string, string> = {}

              if (
                declaration &&
                ts.isParameter(declaration) &&
                ts.isObjectBindingPattern(declaration.name)
              ) {
                for (const binding of declaration.name.elements)
                  if (binding.initializer)
                    fallback[(binding.propertyName ?? binding.name).getText()] =
                      binding.initializer.getText()
              }

              return {
                source: source(declaration ?? node),
                properties: properties(
                  recordTypes(parameterType),
                  node,
                  fallback,
                ),
                name: parameter.name.startsWith("__")
                  ? "options"
                  : parameter.name,
                type: text(
                  checker.getTypeOfSymbolAtLocation(parameter, node),
                  node,
                ),
                required:
                  declaration && ts.isParameter(declaration)
                    ? !declaration.questionToken &&
                      !declaration.initializer &&
                      !declaration.dotDotDotToken
                    : !(parameter.flags & ts.SymbolFlags.Optional),
                description: ts.displayPartsToString(
                  parameter.getDocumentationComment(checker),
                ),
                default:
                  declaration && ts.isParameter(declaration)
                    ? (declaration.initializer?.getText() ?? null)
                    : null,
              }
            })
          : [],
      returns:
        kind === "function" && signatures.length
          ? {
              type: [
                ...new Set(
                  signatures.map((signature) =>
                    text(signature.getReturnType(), node),
                  ),
                ),
              ].join(" | "),
              properties: properties(
                signatures.flatMap((signature) =>
                  recordTypes(signature.getReturnType()),
                ),
                node,
              ),
            }
          : null,
      props:
        kind === "namespace"
          ? []
          : properties(propsTypes, node, defaults(node)),
      propVariants:
        variants.length > 1
          ? variants.map((t) => ({
              type: checker.typeToString(
                t,
                node,
                flags | ts.TypeFormatFlags.InTypeAlias,
              ),
              props: properties([t], node).map(({ name, type, required }) => ({
                name,
                type,
                required,
              })),
              required: properties([t], node)
                .filter((property) => property.required)
                .map((property) => property.name),
            }))
          : [],
    }
  }

  return sourceItems.map((item) => ({
    name: item.name,
    parts: item.files
      .filter((file) => /\.tsx?$/.test(file.path))
      .flatMap((file) => {
        const source = program.getSourceFile(sourceFilePath(file.path))
        const symbol = source && checker.getSymbolAtLocation(source)

        if (!symbol) throw new Error(`Cannot extract ${file.path}`)

        return checker.getExportsOfModule(symbol).flatMap((exported) => {
          const result = part(exported, exported.name)
          const target = resolveSymbol(exported)
          const node = target.valueDeclaration ?? target.declarations?.[0]
          const type = node && checker.getTypeOfSymbolAtLocation(target, node)

          const memberTypes =
            type && !exported.name.endsWith("Context")
              ? result.kind === "value"
                ? recordTypes(type)
                : result.kind === "function" && exported.name.startsWith("use")
                  ? type
                      .getCallSignatures()
                      .flatMap((signature) =>
                        recordTypes(signature.getReturnType()),
                      )
                  : []
              : []

          const callableMembers = new Map<string, ReturnType<typeof part>>()

          for (const memberType of memberTypes) {
            for (const member of checker.getPropertiesOfType(memberType)) {
              const callable = checker.getTypeOfSymbolAtLocation(member, node!)

              if (
                /^[A-Za-z_$][\w$]*$/.test(member.name) &&
                !member
                  .getJsDocTags(checker)
                  .some((tag) => tag.name === "internal") &&
                callable.getCallSignatures().length
              )
                callableMembers.set(
                  member.name,
                  part(member, `${exported.name}.${member.name}`, callable),
                )
            }
          }

          const members =
            result.kind === "namespace"
              ? checker
                  .getExportsOfModule(target)
                  .map((member) =>
                    part(member, `${exported.name}.${member.name}`),
                  )
              : [...callableMembers.values()]

          return [result, ...members]
        })
      }),
  }))
}

export function compactDocs(docs: ReturnType<typeof extractDocs>) {
  const properties: ReturnType<
    typeof extractDocs
  >[number]["parts"][number]["props"] = []

  const indices = new Map<string, number>()

  const items = docs.map((item) => ({
    ...item,
    parts: item.parts.map((part) => ({
      ...part,
      props: part.props.map((prop) => {
        const key = JSON.stringify(prop)
        let index = indices.get(key)

        if (index === undefined) {
          index = properties.length
          indices.set(key, index)
          properties.push(prop)
        }

        return index
      }),
    })),
  }))

  return { items, properties }
}

export async function writeDocsData(data: ReturnType<typeof compactDocs>) {
  const output = await format(
    "docs.generated.json",
    JSON.stringify(data, null, 2),
    { printWidth: 80 },
  )

  if (output.errors.length)
    throw new Error("Could not format generated API documentation")
  await Bun.write(resolve(root, "docs.generated.json"), output.code)
}

if (import.meta.main) {
  await writeDocsData(compactDocs(extractDocs()))
}
