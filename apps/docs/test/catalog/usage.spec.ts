import { runDocsSourceContract } from "@test/helpers/docs-source-contract"
import { expect, test } from "bun:test"

import { usageExamples } from "@/catalog/usage"

runDocsSourceContract("catalog/usage.ts")

test("usage examples use consumer component aliases", () => {
  expect(Object.keys(usageExamples).length).toBeGreaterThan(50)
  for (const source of Object.values(usageExamples)) {
    expect(source).not.toContain("@registry/")
    expect(source).not.toContain("@/components/ui/stylex/")
  }
})
