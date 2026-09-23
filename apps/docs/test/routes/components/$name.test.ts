import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"

const source = readFileSync(
  new URL("../../../src/routes/components/$name.tsx", import.meta.url),
  "utf8",
)

test("component installation keeps CLI and manual source paths", () => {
  expect(source).toContain("`bunx @yopem-ui/cli add ${installName}`")
  expect(source).toContain("`bunx @yopem-ui/cli update ${installName}`")
  expect(source).toContain('value="manual">Manual</TabsTab>')
  expect(source).toContain("data.files.map((file) => (")
})
