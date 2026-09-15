import { describe, expect, test } from "bun:test"
import { execFileSync } from "node:child_process"
import { existsSync, readFileSync } from "node:fs"
import { createRequire } from "node:module"
import { dirname, resolve } from "node:path"

const docsRoot = resolve(import.meta.dirname, "../..")
const repositoryRoot = resolve(docsRoot, "../..")
const docsRequire = createRequire(resolve(docsRoot, "package.json"))
const babelPath = docsRequire.resolve("@babel/core")
const stylexPluginPath = docsRequire.resolve("@stylexjs/babel-plugin")

function moduleExists(path: string) {
  return [
    path,
    `${path}.ts`,
    `${path}.tsx`,
    resolve(path, "index.ts"),
    resolve(path, "index.tsx"),
  ].some(existsSync)
}

interface CompilationResult {
  error: null | string
  hasDefaultExport: boolean
  hasRuntimeStylexCreate: boolean
}

let compilationResults: Record<string, CompilationResult> | undefined

function isCompilationResult(value: unknown): value is CompilationResult {
  if (typeof value !== "object" || value === null) return false
  return (
    "error" in value &&
    (value.error === null || typeof value.error === "string") &&
    "hasDefaultExport" in value &&
    typeof value.hasDefaultExport === "boolean" &&
    "hasRuntimeStylexCreate" in value &&
    typeof value.hasRuntimeStylexCreate === "boolean"
  )
}

function isCompilationResults(
  value: unknown,
): value is Record<string, CompilationResult> {
  return (
    typeof value === "object" &&
    value !== null &&
    Object.values(value).every(isCompilationResult)
  )
}

function getCompilationResult(name: string) {
  if (!compilationResults) {
    const output = execFileSync(
      "node",
      [
        "-e",
        `
const babel = require(${JSON.stringify(babelPath)})
const stylexPlugin = require(${JSON.stringify(stylexPluginPath)})
const { readdirSync, readFileSync } = require("node:fs")
const { join } = require("node:path")
const directory = ${JSON.stringify(
          resolve(docsRoot, "src/components/examples/stylex"),
        )}
const results = {}
for (const file of readdirSync(directory).filter((name) => name.endsWith(".tsx"))) {
  const name = file.slice(0, -4)
  const filename = join(directory, file)
  const source = readFileSync(filename, "utf8").replaceAll(
    "@registry/styles/",
    ${JSON.stringify(`${repositoryRoot}/packages/registry/src/styles/`)},
  )
  try {
    const result = babel.transformSync(source, {
      babelrc: false,
      configFile: false,
      filename,
      parserOpts: { plugins: ["jsx", "typescript"] },
      plugins: [[stylexPlugin, {
        runtimeInjection: false,
        unstable_moduleResolution: {
          rootDir: ${JSON.stringify(repositoryRoot)},
          type: "commonJS",
        },
      }]],
    })
    results[name] = {
      error: null,
      hasDefaultExport: result?.code?.includes("export default function") ?? false,
      hasRuntimeStylexCreate: result?.code?.includes("stylex.create(") ?? false,
    }
  } catch (error) {
    results[name] = {
      error: error instanceof Error ? error.message : String(error),
      hasDefaultExport: false,
      hasRuntimeStylexCreate: false,
    }
  }
}
process.stdout.write(JSON.stringify(results))
`,
      ],
      { encoding: "utf8", maxBuffer: 4 * 1024 * 1024 },
    )
    const parsed: unknown = JSON.parse(output)
    if (!isCompilationResults(parsed))
      throw new Error("StyleX compiler returned invalid results")
    compilationResults = parsed
  }

  const result = compilationResults[name]
  if (!result) throw new Error(`Missing StyleX compilation for ${name}`)
  return result
}

function dependencyExists(specifier: string, sourcePath: string) {
  if (specifier.startsWith("@/"))
    return moduleExists(resolve(docsRoot, "src", specifier.slice(2)))

  if (specifier.startsWith("@registry/"))
    return moduleExists(
      resolve(
        repositoryRoot,
        "packages/registry/src",
        specifier.slice("@registry/".length),
      ),
    )

  if (specifier.startsWith("."))
    return moduleExists(resolve(dirname(sourcePath), specifier))

  try {
    docsRequire.resolve(specifier)
    return true
  } catch {
    return false
  }
}

export function defineExampleSourceContract(name: string) {
  const sourcePath = resolve(
    docsRoot,
    "src/components/examples/stylex",
    `${name}.tsx`,
  )
  const source = readFileSync(sourcePath, "utf8")
  const imports = [...source.matchAll(/\bfrom\s+["']([^"']+)["']/g)].map(
    (match) => match[1] ?? "",
  )
  const compilation = getCompilationResult(name)

  describe(name, () => {
    test("declares a default component export and imports dependencies", () => {
      expect(source).toMatch(/export default function\s+\w+\s*\(/)
      expect(imports.length).toBeGreaterThan(0)
    })

    test("compiles its TSX and StyleX source", () => {
      expect(compilation.error).toBeNull()
      expect(compilation.hasDefaultExport).toBe(true)

      const usesStylex = imports.includes("@stylexjs/stylex")
      expect(source.includes("stylex.create(")).toBe(usesStylex)
      if (usesStylex) expect(compilation.hasRuntimeStylexCreate).toBe(false)
      expect(source).not.toMatch(/\bclassName\s*=\s*["']/)
      expect(source).not.toMatch(/\bstyle\s*=\s*\{/)
    })

    test("resolves every declared dependency", () => {
      expect(imports.filter((specifier) => specifier.startsWith(".."))).toEqual(
        [],
      )
      expect(
        imports.filter((specifier) => !dependencyExists(specifier, sourcePath)),
      ).toEqual([])
    })
  })
}
