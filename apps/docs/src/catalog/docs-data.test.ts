import { sourceItems } from "@registry/items"
import { expect, test } from "bun:test"

import { compositionItems, getRequiredItems } from "./docs-data"
import { getExampleDependencies } from "./example-dependencies"
import { usageExamples } from "./usage"

test("example dependencies distinguish local source from npm packages", () => {
  expect(
    getExampleDependencies(`
    import { Button } from "@/components/ui/button"
    import { ButtonProps } from "@/components/ui/button"
    import { useMediaQuery } from "@/hooks/use-media-query"
    import { useState } from "react"
    import { Root } from "@base-ui/react/dialog"
  `),
  ).toEqual({ components: ["button"], packages: ["react", "@base-ui/react"] })
})

test("usage examples use the standard component alias", () => {
  for (const source of Object.values(usageExamples)) {
    expect(source).not.toContain("@registry/")
    expect(source).not.toContain("@/components/ui/stylex/")
  }
})

test("copy lists include every transitive dependency exactly once", () => {
  for (const name of [
    ...sourceItems.map((item) => item.name),
    ...Object.keys(compositionItems),
  ]) {
    const required = getRequiredItems(name)
    const names = required.map((item) => item.name)
    expect(new Set(names).size).toBe(names.length)
    for (const item of required) {
      for (const dependency of item.registryDependencies)
        expect(names).toContain(dependency)
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
