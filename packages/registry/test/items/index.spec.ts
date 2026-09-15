import { getRequiredItems } from "@docs/catalog/docs-data"
import { usageExamples } from "@docs/catalog/usage"
import { defineRegistrySourceContract } from "@registry/../test/registry-source-contract"
import { sourceItems } from "@registry/items"
import { expect, test } from "bun:test"
import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"
import ts from "typescript-api"

test("every component has a type-safe, copyable usage example", () => {
  const docsRoot = resolve(import.meta.dir, "../../../../apps/docs")
  const directory = mkdtempSync(resolve(docsRoot, ".usage-test-"))
  try {
    const names = sourceItems
      .filter((item) => item.type === "registry:ui")
      .map((item) => item.name)
    expect(Object.keys(usageExamples)).toEqual(
      expect.arrayContaining([...names, "date-picker", "navigation"]),
    )
    const files = Object.entries(usageExamples).map(([name, code]) => {
      expect(code, name).not.toContain("@registry/")
      expect(code, name).not.toMatch(/\bstyle\s*=/)
      expect(code, name).not.toMatch(/\bclassName\s*=\s*["']/)
      const required = getRequiredItems(name).map((item) => item.name)
      for (const match of code.matchAll(/@\/components\/ui\/([^"']+)/g)) {
        expect(required, `${name} usage imports ${match[1]}`).toContain(
          match[1],
        )
      }
      const file = resolve(directory, `${name}.tsx`)
      writeFileSync(
        file,
        code.replaceAll("@/components/ui/", "@registry/components/ui/"),
      )
      return file
    })
    const program = ts.createProgram(files, {
      strict: true,
      skipLibCheck: true,
      noEmit: true,
      jsx: ts.JsxEmit.ReactJSX,
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      esModuleInterop: true,
      paths: { "@registry/*": [resolve(import.meta.dir, "../../src/*")] },
    })
    const diagnostics = ts.getPreEmitDiagnostics(program)
    expect(
      ts.formatDiagnostics(diagnostics, {
        getCanonicalFileName: (file) => file,
        getCurrentDirectory: () => docsRoot,
        getNewLine: () => "\n",
      }),
    ).toBe("")
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
}, 60_000)

defineRegistrySourceContract(import.meta.url)
