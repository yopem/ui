import { sourceItems } from "@registry/items"
import { runDocsSourceContract } from "@test/helpers/docs-source-contract"
import { expect, test } from "bun:test"

import { compositionItems, getRequiredItems } from "@/catalog/docs-data"

runDocsSourceContract("catalog/docs-data.ts")

test("copy lists include every transitive dependency exactly once", () => {
  for (const name of [
    ...sourceItems.map((item) => item.name),
    ...Object.keys(compositionItems),
  ]) {
    const required = getRequiredItems(name)
    const names = required.map((item) => item.name)
    expect(new Set(names).size).toBe(names.length)
    for (const item of required) {
      for (const dependency of item.registryDependencies) {
        expect(names).toContain(dependency)
      }
    }
    expect(names).toContain("base")
  }

  expect(getRequiredItems("date-picker").map((item) => item.name)).toContain(
    "popover",
  )
  expect(() => getRequiredItems("missing-component")).toThrow(
    "Component not found",
  )
})
