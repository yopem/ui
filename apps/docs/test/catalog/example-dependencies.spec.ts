import { runDocsSourceContract } from "@test/helpers/docs-source-contract"
import { expect, test } from "bun:test"

import { getExampleDependencies } from "@/catalog/example-dependencies"

runDocsSourceContract("catalog/example-dependencies.ts")

test("distinguishes component aliases from deduplicated npm packages", () => {
  expect(
    getExampleDependencies(`
      import { Button } from "@/components/ui/button"
      import type { ButtonProps } from "@/components/ui/button"
      import { useMediaQuery } from "@/hooks/use-media-query"
      import { useState } from "react"
      import { Root } from "@base-ui/react/dialog"
      import { Dialog } from "@base-ui/react/dialog"
    `),
  ).toEqual({
    components: ["button"],
    packages: ["react", "@base-ui/react"],
  })

  expect(getExampleDependencies("const value = 1")).toEqual({
    components: [],
    packages: [],
  })
})
