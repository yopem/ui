import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"

const source = readFileSync(
  new URL(
    "../../../../src/components/examples/stylex/p-preview-card-1.tsx",
    import.meta.url,
  ),
  "utf8",
)

test("preview card title follows the example page heading without skipping levels", () => {
  expect(source).toMatch(/<h2[^>]*>coss\.com\/ui<\/h2>/)
  expect(source).not.toMatch(/<h[3-6]\b/)
  expect(new Bun.Transpiler({ loader: "tsx" }).transformSync(source)).toContain(
    "PreviewCardPopup",
  )
})
