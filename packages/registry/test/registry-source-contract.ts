import { sourceItems } from "@registry/items/index"
import { registryItemSchema, registrySchema } from "@registry/schema"
import { rewriteImports } from "@registry/source-files"
import { expect, test } from "bun:test"
import { existsSync, readFileSync } from "node:fs"
import { relative, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import ts from "typescript-api"

const registryRoot = resolve(import.meta.dirname, "..")
const sourceRoot = resolve(registryRoot, "src")
const testRoot = resolve(registryRoot, "test")
const sourceExtensions = [".tsx", ".ts", ".css", ".json"] as const

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function sourceForSpec(specUrl: string) {
  const specPath = fileURLToPath(specUrl)
  const sourceStem = relative(testRoot, specPath).replace(/\.spec\.ts$/, "")
  const sourcePath = sourceExtensions
    .map((extension) => resolve(sourceRoot, `${sourceStem}${extension}`))
    .find(existsSync)
  if (!sourcePath) throw new Error(`Missing source for ${specPath}`)
  return {
    path: sourcePath,
    relativePath: relative(sourceRoot, sourcePath),
    source: readFileSync(sourcePath, "utf8"),
  }
}

function expectTypeScriptContract(
  source: string,
  sourcePath: string,
  relativePath: string,
) {
  const result = ts.transpileModule(source, {
    compilerOptions: {
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: sourcePath,
    reportDiagnostics: true,
  })
  const errors = (result.diagnostics ?? []).filter(
    (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error,
  )
  expect(errors).toEqual([])
  expect(result.outputText.length).toBeGreaterThan(0)
  if (relativePath !== "build.ts") {
    expect(source).toMatch(/export\s+(?:const|function|interface|type|\{)/)
  }
  expect(source).not.toContain("as any")
  expect(source).not.toContain("as unknown as")

  if (!relativePath.startsWith("components/ui/")) return

  expect(source).not.toMatch(/className=["'][^"']+["']/)
  expect(source).not.toMatch(/style=\{\{/)
  expect(source).toMatch(/data-slot|useRender|@base-ui\/react/)
  if (source.includes("@stylexjs/stylex")) {
    expect(source).toContain("stylex.create")
  }

  const generatedValue: unknown = JSON.parse(
    readFileSync(resolve(sourceRoot, "docs.generated.json"), "utf8"),
  )
  expect(isRecord(generatedValue)).toBe(true)
  if (!isRecord(generatedValue) || !Array.isArray(generatedValue.items)) return
  const componentName = relativePath.split("/").at(-1)?.replace(".tsx", "")
  const documented = generatedValue.items.some(
    (item) => isRecord(item) && item.name === componentName,
  )
  expect(documented).toBe(true)
}

function expectJsonContract(source: string) {
  const value: unknown = JSON.parse(source)
  const serialized = JSON.stringify(value)
  expect(serialized.length).toBeGreaterThan(100)
  expect(JSON.parse(serialized)).toEqual(value)
}

function expectCssContract(source: string) {
  expect(source).toContain("@layer yopem-reset, yopem-base")
  expect(source).toContain("prefers-reduced-motion: reduce")
  expect(source).toContain('[data-slot="popover-viewport"]')
  expect(source).not.toContain("@tailwind")
}

function expectMetadataContract() {
  expect(sourceItems.length).toBeGreaterThan(50)
  expect(new Set(sourceItems.map((item) => item.name)).size).toBe(
    sourceItems.length,
  )
  for (const item of sourceItems) {
    expect(item.name).toMatch(/^[a-z0-9-]+$/)
    expect(item.description.length).toBeGreaterThan(0)
    expect(item.files.length).toBeGreaterThan(0)
    expect(item.files.every((file) => file.path && file.target)).toBe(true)
  }
}

function expectSchemaContract() {
  expect(
    registrySchema.safeParse({
      homepage: "https://yopem.com/ui",
      items: [],
      name: "yopem-ui",
      schemaVersion: 1,
      version: "0.1.0",
    }).success,
  ).toBe(true)
  expect(
    registrySchema.safeParse({
      homepage: "not-a-url",
      items: [],
      name: "yopem-ui",
      schemaVersion: 2,
      version: "0.1.0",
    }).success,
  ).toBe(false)
  expect(
    registryItemSchema.safeParse({
      description: "Invalid empty file list",
      files: [],
      name: "invalid item",
      registryVersion: "0.1.0",
      schemaVersion: 1,
      title: "Invalid",
      type: "registry:ui",
    }).success,
  ).toBe(false)
}

function expectImportRewriteContract() {
  const rewritten = rewriteImports(
    'import { Button } from "@registry/components/ui/button"\n' +
      'import { stylexProps } from "@registry/lib/stylex"',
  )
  expect(rewritten).toContain('from "@/components/ui/button"')
  expect(rewritten).toContain('from "@/lib/stylex"')
  expect(rewritten).not.toContain("@registry/")
}

function expectThemeContract(source: string, relativePath: string) {
  expect(source).toMatch(/dark|light/)
  expect(source).toMatch(/theme/i)
  if (relativePath === "styles/tokens.stylex.ts") {
    expect(source).toContain("stylex.defineVars")
    expect(source).toContain("stylex.createTheme")
  }
  if (relativePath === "theme/theme.tsx") {
    expect(source).toContain("createThemeConfig")
    expect(source).toContain("ThemeScript")
    expect(source).toContain("prefers-color-scheme: dark")
  }
  if (relativePath === "theme/theme-provider.tsx") {
    expect(source).toContain("useSyncExternalStore")
    expect(source).toContain("localStorage")
  }
}

export function defineRegistrySourceContract(specUrl: string) {
  const contract = sourceForSpec(specUrl)

  test(`${contract.relativePath} compiles and preserves its source contract`, () => {
    if (contract.path.endsWith(".json")) {
      expectJsonContract(contract.source)
    } else if (contract.path.endsWith(".css")) {
      expectCssContract(contract.source)
    } else {
      expectTypeScriptContract(
        contract.source,
        contract.path,
        contract.relativePath,
      )
    }

    if (contract.relativePath.startsWith("items/")) expectMetadataContract()
    if (contract.relativePath === "schema.ts") expectSchemaContract()
    if (contract.relativePath === "source-files.ts") {
      expectImportRewriteContract()
    }
    if (
      contract.relativePath.startsWith("theme/") ||
      contract.relativePath === "styles/tokens.stylex.ts"
    ) {
      expectThemeContract(contract.source, contract.relativePath)
    }
    if (contract.relativePath === "build.ts") {
      expect(contract.source).toContain("registrySchema.parse")
      expect(contract.source).toContain("registryItemSchema.parse")
      expect(contract.source).toContain("writeFile")
    }
    if (contract.relativePath.startsWith("docs")) {
      const value: unknown = JSON.parse(
        readFileSync(resolve(sourceRoot, "docs.generated.json"), "utf8"),
      )
      expect(JSON.stringify(value).length).toBeGreaterThan(10_000)
    }
  })
}
