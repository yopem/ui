import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"

const source = readFileSync(
  new URL("../../src/catalog/components.ts", import.meta.url),
  "utf8",
)

test("catalog discovers style props fixture and normalizes named exports before lazy rendering", () => {
  const pattern = source.match(/const match = (\/.*\/).exec\(file\)/)?.[1]
  expect(pattern).toBeDefined()
  if (!pattern) throw new Error("Missing catalog filename pattern")
  const match = new RegExp(pattern.slice(1, -1)).exec("p-style-props-1.tsx")
  expect(match?.slice(1)).toEqual(["style-props", "1"])
  expect(source).toContain(".then(resolveExampleModule)")
  expect(source).toContain(".catch(() => ({ default: UnavailableExample }))")
  expect(source).toContain('query: "?raw"')
})

test("catalog keeps public stack names and uses Paragraph for load failures", () => {
  expect(source).toContain('if (value === "hstack") return "HStack"')
  expect(source).toContain('if (value === "vstack") return "VStack"')
  expect(source).toContain("Paragraph,")
  expect(source).not.toMatch(/createElement\(\s*["']p["']/)
})
