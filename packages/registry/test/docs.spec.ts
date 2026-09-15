import { defineRegistrySourceContract } from "@registry/../test/registry-source-contract"
import { componentDocs } from "@registry/docs"
import { compactDocs, extractDocs } from "@registry/docs-extract"
import generated from "@registry/docs.generated.json"
import { sourceItems } from "@registry/items/index"
import {
  rewriteImports,
  sourceImportReplacements,
} from "@registry/source-files"
import { expect, test } from "bun:test"
import { readdirSync, readFileSync } from "node:fs"
import { resolve } from "node:path"
import ts from "typescript-api"

const root = resolve(import.meta.dir, "../src/components/ui")

test("every canonical component file and named export has documentation", () => {
  for (const file of readdirSync(root).filter((name) =>
    name.endsWith(".tsx"),
  )) {
    const doc = componentDocs.find(
      (item) => item.name === file.replace(/\.tsx$/, ""),
    )
    expect(doc, file).toBeDefined()
    expect(doc!.usage.length).toBeGreaterThan(30)
    const source = ts.createSourceFile(
      file,
      readFileSync(resolve(root, file), "utf8"),
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX,
    )
    const names: string[] = []
    for (const node of source.statements) {
      if (
        ts.isExportDeclaration(node) &&
        node.exportClause &&
        ts.isNamedExports(node.exportClause)
      ) {
        names.push(
          ...node.exportClause.elements.map((element) => element.name.text),
        )
      } else if (
        ts.canHaveModifiers(node) &&
        ts
          .getModifiers(node)
          ?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)
      ) {
        if (ts.isVariableStatement(node))
          names.push(
            ...node.declarationList.declarations.map((declaration) =>
              declaration.name.getText(source),
            ),
          )
        else if (
          (ts.isFunctionDeclaration(node) ||
            ts.isTypeAliasDeclaration(node) ||
            ts.isInterfaceDeclaration(node)) &&
          node.name
        )
          names.push(node.name.text)
      }
    }
    expect(
      doc!.parts
        .filter((part) => !part.name.includes("."))
        .map((part) => part.name)
        .sort(),
      file,
    ).toEqual(names.sort())
  }
})

test("committed API data matches canonical and installed dependency types", () => {
  expect(compactDocs(extractDocs())).toEqual(generated)
}, 120000)

function part(item: string, name: string) {
  const result = componentDocs
    .find((doc) => doc.name === item)
    ?.parts.find((entry) => entry.name === name)
  expect(result, `${item}.${name}`).toBeDefined()
  return result!
}

test("own props, inherited props, aliases and union-only props remain visible", () => {
  const button = part("button", "Button")
  expect(button.props.map((prop) => prop.name)).toEqual(
    expect.arrayContaining([
      "loading",
      "size",
      "variant",
      "disabled",
      "render",
      "onClick",
      "aria-label",
      "ref",
    ]),
  )
  expect(button.props.find((prop) => prop.name === "loading")?.default).toBe(
    "false",
  )
  expect(button.props.find((prop) => prop.name === "variant")?.default).toBe(
    '"default"',
  )
  expect(
    part("dialog", "DialogPopup").props.find(
      (prop) => prop.name === "showCloseButton",
    )?.default,
  ).toBe("true")
  expect(part("dialog", "DialogContent").props).toEqual(
    part("dialog", "DialogPopup").props,
  )
  expect(part("select", "Select").props.map((prop) => prop.name)).toEqual(
    expect.arrayContaining([
      "multiple",
      "value",
      "onValueChange",
      "itemToStringLabel",
      "items",
    ]),
  )
  expect(part("calendar", "Calendar").props.map((prop) => prop.name)).toEqual(
    expect.arrayContaining([
      "mode",
      "selected",
      "onSelect",
      "min",
      "max",
      "excludeDisabled",
    ]),
  )
  expect(
    part("drawer", "Drawer").props.find((prop) => prop.name === "position")
      ?.type,
  ).toContain('"bottom"')
  expect(
    part("menu", "MenuPrimitive.Positioner").props.map((prop) => prop.name),
  ).toContain("collisionAvoidance")
  expect(part("toast", "toastManager").props.map((prop) => prop.name)).toEqual(
    expect.arrayContaining(["add", "update", "close", "promise"]),
  )
  expect(part("tabs", "TabsSize").props).toEqual([])
  expect(part("sidebar", "useSidebar.setOpen").description).toContain(
    "value returned by useSidebar()",
  )
  const autocomplete = part("autocomplete", "Autocomplete")
  expect(
    autocomplete.props.find((prop) => prop.name === "items")?.required,
  ).toBe(false)
  expect(autocomplete.propVariants).toHaveLength(2)
  expect(
    part("calendar", "Calendar").propVariants.some((variant) =>
      variant.props.some(
        (prop) => prop.name === "selected" && prop.type.includes("DateRange"),
      ),
    ),
  ).toBe(true)
  expect(
    part("combobox", "ComboboxContext").props.map((prop) => prop.name),
  ).toContain("Provider")
})

test("metadata export lists and copyable source aliases agree with documentation", () => {
  for (const item of sourceItems) {
    const doc = componentDocs.find((entry) => entry.name === item.name)!
    expect([...(item.docs?.api ?? [])].sort(), item.name).toEqual(
      doc.parts
        .filter((entry) => !entry.name.includes("."))
        .map((entry) => entry.name)
        .sort(),
    )
    for (const file of item.files) {
      const source = readFileSync(resolve(root, "../..", file.path), "utf8")
      const rewritten = rewriteImports(source)
      expect(rewritten).not.toContain("@registry/")
      expect(file.target).toBeTruthy()
    }
  }
  for (const [source, target] of sourceImportReplacements)
    expect(rewriteImports(`${source}example`)).toBe(`${target}example`)
})

test("data is serializable, readable and has no machine paths or CLI instructions", () => {
  const serialized = JSON.stringify(componentDocs)
  expect(JSON.parse(serialized)).toEqual(componentDocs)
  expect(serialized).not.toMatch(
    /\/home\/|\/Users\/|npx @yopem\/ui|bunx @yopem\/ui/,
  )
  const incomplete = componentDocs.flatMap((doc) =>
    doc.parts.flatMap((entry) => [
      ...(!entry.description ? [`${doc.name}/${entry.name}`] : []),
      ...entry.props
        .filter((prop) => !prop.type || !prop.description || !prop.source)
        .map((prop) => `${doc.name}/${entry.name}/${prop.name}`),
    ]),
  )
  expect(incomplete).toEqual([])
})

defineRegistrySourceContract(import.meta.url)
