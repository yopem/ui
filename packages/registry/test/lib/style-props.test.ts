import type { StyleComponentProps, StyleProps } from "@registry/lib/style-props"

import { describe, expect, test } from "bun:test"

import {
  core,
  escapeStyles,
  resolvedProps,
  spacingToken,
} from "./style-props-fixture"

describe("style props", () => {
  test("public types allow nested responsive values and preserve own semantic props", () => {
    const props: StyleProps = {
      p: [2, null, 4],
      _hover: { color: { mdOnly: "red" } },
      css: { "--brand": "blue", gridTemplateColumns: "1fr 1fr" },
    }
    const component: StyleComponentProps<
      { id?: string; color?: string },
      { color: "primary" | "secondary" }
    > = { color: "primary", p: 2, id: "target" }
    expect(core.normalizeStyleProps(props)).toHaveLength(5)
    expect(component.color).toBe("primary")
    // @ts-expect-error Misspelled properties must not enter the CSS escape hatch.
    const invalid: StyleProps = { css: { paddding: 2 } }
    // @ts-expect-error CSS keyword types remain checked through aliases.
    const invalidPosition: StyleProps = { pos: "not-a-position" }
    expect(invalid.css).toBeDefined()
    expect(invalidPosition.pos).toBeDefined()
  })
  test("component types preserve discriminated primitive unions", () => {
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
    for (const selection of [single, multiple]) {
      const { domProps } = core.splitStyleProps<Selection>(selection)
      if (domProps.mode === "single") {
        expect(domProps.selected.getTime()).toBe(0)
      } else {
        expect(domProps.selected).toHaveLength(0)
      }
      // @ts-expect-error Style props are removed from every union member.
      expect(domProps.p).toBeUndefined()
    }
  })
  test("normalizes all major groups, logical aliases, tokens, and raw strings", () => {
    const result = core.normalizeStyleProps({
      p: 4,
      mx: -2,
      ps: 0.5,
      w: 80,
      h: "calc(100vh - 2rem)",
      display: "grid",
      gridTemplateColumns: "1fr 2fr",
      gap: 3,
      flexDir: "column",
      bg: "red",
      border: "1px solid",
      rounded: "8px",
      fontWeight: 700,
      opacity: 0.5,
      transform: "scale(1.1)",
      transition: "opacity 1s",
      cursor: "pointer",
      scrollMarginTop: 2,
      fill: "currentColor",
      spaceY: -1,
    })
    expect(result.map(({ property, value }) => [property, value])).toEqual([
      ["padding", `calc(${spacingToken} * 4)`],
      ["marginInline", `calc(${spacingToken} * -2)`],
      ["paddingInlineStart", `calc(${spacingToken} * 0.5)`],
      ["width", `calc(${spacingToken} * 80)`],
      ["height", "calc(100vh - 2rem)"],
      ["display", "grid"],
      ["gridTemplateColumns", "1fr 2fr"],
      ["gap", `calc(${spacingToken} * 3)`],
      ["flexDirection", "column"],
      ["background", "red"],
      ["border", "1px solid"],
      ["borderRadius", "8px"],
      ["fontWeight", 700],
      ["opacity", 0.5],
      ["transform", "scale(1.1)"],
      ["transition", "opacity 1s"],
      ["cursor", "pointer"],
      ["scrollMarginTop", `calc(${spacingToken} * 2)`],
      ["fill", "currentColor"],
      ["spaceY", `calc(${spacingToken} * -1)`],
    ])
  })

  test("responsive arrays skip holes and nested conditions form conjunctions", () => {
    expect(
      core.normalizeStyleProps({
        p: [1, null, 3],
        _hover: { mdOnly: { _focus: { color: "red" } } },
      }),
    ).toEqual([
      {
        property: "padding",
        value: `calc(${spacingToken} * 1)`,
        conditions: [],
        scope: "",
      },
      {
        property: "padding",
        value: `calc(${spacingToken} * 3)`,
        conditions: ["md"],
        scope: "",
      },
      {
        property: "color",
        value: "red",
        conditions: ["_focus", "_hover", "mdOnly"],
        scope: "",
      },
    ])
  })

  test("css supplies typed properties and variables; direct props win", () => {
    const props = resolvedProps({
      css: { color: "red", "--brand": "tomato", appearance: "none" },
      color: "var(--brand)",
    })
    expect(props.className).not.toBe("")
    expect(Object.values(props.style ?? {})).toContain("var(--brand)")
    expect(props.style).toHaveProperty("--brand", "tomato")
    expect(Object.values(props.style ?? {})).not.toContain("red")
  })

  test("compiled css accepts StyleX styles, arrays, and direct overrides", () => {
    const compiled: StyleProps = { css: escapeStyles.custom, p: 4 }
    const array: StyleProps = { css: [false, [escapeStyles.custom, null]] }
    expect(core.normalizeStyleProps(compiled)).toHaveLength(1)
    expect(core.normalizeStyleProps(array)).toHaveLength(0)
    expect(resolvedProps(array).className).toBe(
      resolvedProps({ css: escapeStyles.custom }).className,
    )
    expect(Object.values(resolvedProps(compiled).style ?? {})).toContain(
      `calc(${spacingToken} * 4)`,
    )
    const dynamic = core.resolveStyleProps({ p: 2 })
    const dynamicProps: StyleProps = { css: dynamic }
    expect(resolvedProps(dynamicProps)).toEqual(resolvedProps({ p: 2 }))
    // @ts-expect-error Raw selectors require static stylex.create, not runtime objects.
    const invalid: StyleProps = { css: { ":has(> span)": { color: "red" } } }
    expect(() => core.resolveStyleProps(invalid)).toThrow()
    expect(() =>
      core.resolveStyleProps({ _hover: { css: escapeStyles.custom } }),
    ).toThrow("top-level")
  })

  test("unsupported conditions cannot leak through DOM filtering", () => {
    for (const name of ["_unknown", "_groupHover", "lgToSm"]) {
      expect(core.isStyleProp(name)).toBe(true)
      expect(() => core.splitStyleProps({ [name]: { color: "red" } })).toThrow()
    }
    for (const name of ["_moreContrast", "_lessContrast", "_dark", "_light"]) {
      expect(
        core.splitStyleProps({ [name]: { color: "red" }, id: "target" })
          .domProps,
      ).toEqual({ id: "target" })
    }
    const cycle: unknown[] = []
    cycle.push(cycle)
    expect(() => core.resolveStyleProps({ css: cycle })).toThrow()
    expect(() =>
      core.resolveStyleProps({ css: { $$css: true, color: 123 } }),
    ).toThrow()
  })

  test("filters style props without dropping refs, events, data, aria, or xstyle", () => {
    const onClick = () => undefined
    const ref = { current: null }
    const props = {
      p: 4,
      md: { color: "red" },
      css: { userSelect: "none" },
      id: "target",
      "aria-label": "Target",
      "data-id": 2,
      onClick,
      ref,
      className: "consumer",
      xstyle: null,
    }
    const { domProps, xstyle } = core.splitStyleProps(props)
    expect(domProps).toEqual({
      id: "target",
      "aria-label": "Target",
      "data-id": 2,
      onClick,
      ref,
      className: "consumer",
      xstyle: null,
    })
    expect(xstyle).not.toEqual([])
    expect(props.p).toBe(4)
  })

  test("rejects malformed conditions, cycles, nonfinite values, and invalid spacing", () => {
    for (const input of [
      { p: { typo: 1 } },
      { css: { typo: 1 } },
      { p: true },
      { p: -1 },
      { w: Number.NaN },
      { p: [0, 1, 2, 3, 4, 5, 6] },
      { _before: { _after: { color: "red" } } },
    ]) {
      expect(() => core.resolveStyleProps(input)).toThrow()
    }
    const cycle: Record<string, unknown> = {}
    cycle._hover = cycle
    expect(() => core.resolveStyleProps(cycle)).toThrow("Cyclic")
    expect(() =>
      core.resolveStyleProps({
        _hover: { color: "red" },
        _focus: { color: "red" },
      }),
    ).not.toThrow()
  })

  test("condition fallback chains are independent of breakpoint key insertion order", () => {
    expect(
      resolvedProps({ color: { md: "blue", base: "red", lg: "green" } }),
    ).toEqual(
      resolvedProps({ color: { lg: "green", md: "blue", base: "red" } }),
    )
    expect(resolvedProps({ color: { _hover: { md: "blue" } } })).toEqual(
      resolvedProps({ md: { _hover: { color: "blue" } } }),
    )
  })
})
