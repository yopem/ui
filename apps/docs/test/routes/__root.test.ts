import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"

const source = readFileSync(
  new URL("../../src/routes/__root.tsx", import.meta.url),
  "utf8",
)

test("dev stylesheet blocks first paint without a virtual runtime", () => {
  expect(source).toContain('href="/virtual:stylex.css"')
  expect(source).toContain("import.meta.env.DEV")
  expect(source).not.toContain("virtual:stylex:runtime")
})
