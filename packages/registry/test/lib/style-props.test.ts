import type { StyleComponentProps, StyleProps } from "@registry/lib/style-props"

import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"

const source = readFileSync(
  new URL("../../src/lib/style-props.ts", import.meta.url),
  "utf8",
)

describe("compile-time style props", () => {
  test("types preserve aliases, responsive values, and semantic props", () => {
    const props: StyleProps = {
      p: [2, null, 4],
      _hover: { color: { mdOnly: "red" } },
      css: { "--brand": "blue", gridTemplateColumns: "1fr 1fr" },
    }
    const component: StyleComponentProps<
      { id?: string; color?: string },
      { color: "primary" | "secondary" }
    > = { color: "primary", p: 2, id: "target" }
    // @ts-expect-error Misspelled properties must not enter the CSS escape hatch.
    const invalid: StyleProps = { css: { paddding: 2 } }
    // @ts-expect-error CSS keyword types remain checked through aliases.
    const invalidPosition: StyleProps = { pos: "not-a-position" }
    expect(props.p).toEqual([2, null, 4])
    expect(component.color).toBe("primary")
    expect(invalid.css).toBeDefined()
    expect(invalidPosition.pos).toBeDefined()
  })

  test("preserves primitive discriminated unions", () => {
    type Selection = StyleComponentProps<
      | { mode: "single"; selected: Date }
      | { mode: "multiple"; selected: Date[] }
    >
    const single: Selection = { mode: "single", selected: new Date(0), p: 2 }
    const multiple: Selection = { mode: "multiple", selected: [], p: [1, 2] }
    // @ts-expect-error Styling must not erase the primitive discriminant.
    const invalid: Selection = { mode: "single", selected: [] }
    expect(single.selected.getTime()).toBe(0)
    expect(multiple.selected).toHaveLength(0)
    expect(invalid.mode).toBe("single")
  })

  test("ships only types, not a runtime CSS resolver", () => {
    expect(source).not.toContain("stylex.create")
    expect(source).not.toContain("--ysp-")
    expect(source).not.toContain("splitStyleProps")
    expect(source).not.toContain("resolveStyleProps")
  })
})
