import { expect, test } from "bun:test"

import { stripStandaloneComments } from "@/catalog/source-code"

test("removes standalone comments from displayed code", () => {
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
})
