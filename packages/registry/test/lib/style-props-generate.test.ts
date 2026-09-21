import { generateStyleProps } from "@registry/lib/style-props-generate"
import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { runInNewContext } from "node:vm"

function canonical(source: string) {
  const executable = new Bun.Transpiler({ loader: "ts" })
    .transformSync(source)
    .replace(/import[\s\S]*?from\s*["'][^"']+["'];?/g, "")
    .replaceAll("export ", "")
  const serialized: string = runInNewContext(
    `${executable}; JSON.stringify({propertyStyles, scopedPropertyStyles, conditionStyles, variableStyles}, (key, value) => typeof value === 'function' ? value('test-value') : value)`,
    { stylex: { create: (value: unknown) => value } },
  )
  return Bun.hash(serialized)
}

test("checked-in declarations match generator and cover CSS property groups", () => {
  const source = generateStyleProps()
  expect(
    canonical(
      readFileSync(
        new URL("../../src/lib/style-props-styles.ts", import.meta.url),
        "utf8",
      ),
    ),
  ).toBe(canonical(source))
  for (const property of [
    "display",
    "gridTemplateColumns",
    "flexGrow",
    "marginInlineStart",
    "backgroundImage",
    "borderRadius",
    "fontVariant",
    "textDecoration",
    "transform",
    "transition",
    "animation",
    "filter",
    "cursor",
    "scrollMargin",
    "fill",
    "stroke",
    "spaceX",
  ]) {
    expect(source).toContain(`${property}: (value:`)
  }
  expect(source).toContain('"--ysp-_hover"')
  expect(source).not.toContain("document.")
})
