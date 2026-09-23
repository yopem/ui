import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"

const source = readFileSync(
  new URL("../../../src/routes/components/$name.tsx", import.meta.url),
  "utf8",
)

test("component installation keeps init, add, update and manual paths", () => {
  expect(source).toContain('code="bunx @yopem-ui/cli init"')
  expect(source).toContain("`bunx @yopem-ui/cli add ${installName}`")
  expect(source).toContain("`bunx @yopem-ui/cli update ${installName}`")
  expect(source).toContain('value="manual">Manual</TabsTab>')
  expect(source).toContain("data.files.map((file) => (")
})
