import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"

const source = readFileSync(
  new URL("../../src/routes/__root.tsx", import.meta.url),
  "utf8",
)

test("dev stylesheet refreshes without runtime CSS injection", () => {
  expect(source).toContain('href="/virtual:stylex.css"')
  expect(source).toContain('import.meta.hot?.on("stylex:css-update", refresh)')
  expect(source).toContain("import.meta.env.DEV")
  expect(source).not.toContain('src="/@id/virtual:stylex:css-only"')
  expect(source).not.toContain('src="/@id/virtual:stylex:runtime"')
})
