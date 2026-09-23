import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"

const source = readFileSync(
  new URL("../../../src/routes/docs/primitives.tsx", import.meta.url),
  "utf8",
)

test("old combined guide redirects to layout", () => {
  expect(source).toContain('createFileRoute("/docs/primitives")')
  expect(source).toContain('throw redirect({ to: "/docs/layout" })')
})
