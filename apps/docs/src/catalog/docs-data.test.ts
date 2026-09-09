import { sourceItems } from "@registry/items"
import { expect, test } from "bun:test"

import { compositionItems, getRequiredItems } from "./docs-data"
import { getExampleDependencies } from "./example-dependencies"

test("example dependencies distinguish local source from npm packages", () => {
  expect(
    getExampleDependencies(`
    import { Button } from "@registry/components/ui/button"
    import { ButtonProps } from "@registry/components/ui/button"
    import { useMediaQuery } from "@registry/hooks/use-media-query"
    import { useState } from "react"
    import { Root } from "@base-ui/react/dialog"
  `),
  ).toEqual({ components: ["button"], packages: ["react", "@base-ui/react"] })
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
