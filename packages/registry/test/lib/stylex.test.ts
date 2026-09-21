import type { CSSProperties } from "react"

import { mergeStyleProps, stylexProps } from "@registry/lib/stylex"
import { describe, expect, expectTypeOf, test } from "bun:test"

const generated = {
  className: "generated",
  style: { "--gap": "8px", padding: 8, color: "red" },
}

describe("mergeStyleProps", () => {
  test("keeps generated CSS variables and required props with inline overrides", () => {
    function onClick() {
      return "clicked"
    }
    const merged = mergeStyleProps(generated, {
      value: 0,
      length: 6,
      disabled: true,
      onClick,
      style: { padding: 16, "--gap": "12px" },
    })

    const expectedStyle = { "--gap": "12px", padding: 16, color: "red" }
    expect(merged.style).toEqual(expectedStyle)
    expect(merged.className).toBe("generated")
    expect(merged.value).toBe(0)
    expect(merged.length).toBe(6)
    expect(merged.disabled).toBe(true)
    expect(merged.onClick).toBe(onClick)
    expectTypeOf(merged.value).toEqualTypeOf<number>()
    expectTypeOf(merged.length).toEqualTypeOf<number>()
    expectTypeOf(merged.style).toEqualTypeOf<CSSProperties>()
  })

  test("evaluates style callbacks with original state on every call", () => {
    const states: { checked: boolean }[] = []
    function style(state: { checked: boolean }) {
      states.push(state)
      return state.checked ? { padding: 24, color: "blue" } : undefined
    }
    const merged = mergeStyleProps(generated, { style, value: "required" })
    const checked = { checked: true }
    const unchecked = { checked: false }

    expectTypeOf(merged.style).toEqualTypeOf<
      (state: { checked: boolean }) => CSSProperties
    >()
    expect(states).toHaveLength(0)
    expect(merged.style(checked)).toEqual({
      ...generated.style,
      padding: 24,
      color: "blue",
    })
    expect(merged.style(unchecked)).toEqual(generated.style)
    expect(states[0]).toBe(checked)
    expect(states[1]).toBe(unchecked)
    expect(generated.style.padding).toBe(8)
    expect(merged.value).toBe("required")
  })

  test("preserves className callbacks composed by stylexProps", () => {
    function className(state: { checked: boolean }) {
      return state.checked ? "checked" : undefined
    }
    const styled = stylexProps(className)
    const merged = mergeStyleProps(styled, { style: { padding: 4 } })

    if (typeof merged.className !== "function") {
      throw new Error("Expected className callback")
    }
    expect(merged.className({ checked: true })).toBe("checked")
    expect(merged.className({ checked: false })).toBe("")
  })

  test("combines generated and explicit string or callback class names", () => {
    const stringProps = mergeStyleProps(generated, { className: "consumer" })
    expect(stringProps.className).toBe("generated consumer")
    function className(state: { active: boolean }) {
      return state.active ? "active" : undefined
    }
    const callbackProps = mergeStyleProps(generated, { className })
    if (typeof callbackProps.className !== "function") {
      throw new Error("Expected className callback")
    }
    expect(callbackProps.className({ active: true })).toBe("generated active")
    expect(callbackProps.className({ active: false })).toBe("generated")
    const both = mergeStyleProps({ className }, { className })
    expect(both.className({ active: true })).toBe("active active")
  })

  test("handles missing styles without mutating generated props", () => {
    const merged = mergeStyleProps(generated, { value: 0, length: 6 })
    expectTypeOf(merged.value).toEqualTypeOf<number>()
    expectTypeOf(merged.length).toEqualTypeOf<number>()
    expectTypeOf(merged.style).toEqualTypeOf<CSSProperties>()
    expect(merged.style).toEqual(generated.style)
    expect(merged.value).toBe(0)
    expect(merged.length).toBe(6)
    expect(mergeStyleProps(generated, {}).style).toEqual(generated.style)
    expect(mergeStyleProps({}, { style: undefined }).style).toEqual({})
    expect(mergeStyleProps(stylexProps("consumer"), {}).className).toBe(
      "consumer",
    )
  })
})
