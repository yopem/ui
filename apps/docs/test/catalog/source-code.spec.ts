import { runDocsSourceContract } from "@test/helpers/docs-source-contract"
import { expect, test } from "bun:test"

import { stripStandaloneComments } from "@/catalog/source-code"

runDocsSourceContract("catalog/source-code.ts")

test("removes standalone comments while preserving inline context", () => {
  expect(
    stripStandaloneComments(`// oxlint-disable jsx-a11y/no-autofocus
const url = "https://ui.yopem.com" // Keep inline context.

/**
 * Internal implementation note.
 */
function Example() {
  return <div />
}
`),
  ).toBe(`const url = "https://ui.yopem.com" // Keep inline context.

function Example() {
  return <div />
}
`)

  expect(stripStandaloneComments("const value = 1\n")).toBe("const value = 1\n")
})
