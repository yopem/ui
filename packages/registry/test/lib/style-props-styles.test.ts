import type { Browser, Page } from "@playwright/test"

import { chromium } from "@playwright/test"
import * as stylex from "@stylexjs/stylex"
import { afterAll, beforeAll, describe, expect, test } from "bun:test"

import {
  compiledSource,
  core,
  css,
  escapeStyles,
  resolvedProps,
  spaciousThemeProps,
} from "./style-props-fixture"

let browser: Browser
let page: Page
beforeAll(async () => {
  browser = await chromium.launch({ headless: true })
  page = await browser.newPage({ viewport: { width: 800, height: 600 } })
})
afterAll(async () => {
  await browser?.close()
})

async function render(input: unknown, children = "Target", defaults?: unknown) {
  await page.setContent(
    `<style>${css}</style><button id="target">${children}</button>`,
  )
  await page.locator("#target").evaluate(
    (element, props) => {
      element.setAttribute("class", props.className ?? "")
      for (const [name, value] of Object.entries(props.style ?? {})) {
        element.style.setProperty(name, String(value))
      }
    },
    resolvedProps(input, defaults),
  )
}

function computed(property: string, pseudo: string | null = null) {
  return page
    .locator("#target")
    .evaluate(
      (element, args) =>
        getComputedStyle(element, args.pseudo).getPropertyValue(args.property),
      { property, pseudo },
    )
}

describe("statically extracted style props in Chromium", () => {
  test("padding aliases replace compiled Button axis defaults without losing raw shorthands", async () => {
    for (const [p, expected] of [
      [4, ["16px", "16px", "16px", "16px"]],
      ["4px 8px", ["4px", "8px", "4px", "8px"]],
      ["1px 2px 3px 4px", ["1px", "2px", "3px", "4px"]],
    ] as const) {
      await render({ css: escapeStyles.buttonSize, p })
      for (const [index, side] of [
        "top",
        "right",
        "bottom",
        "left",
      ].entries()) {
        expect(await computed(`padding-${side}`)).toBe(expected[index])
      }
    }
  })

  test("padding and margin shorthands clear compiled logical defaults before side overrides", async () => {
    await render({
      css: escapeStyles.spacingDefaults,
      p: 4,
      m: 2,
      ps: 3,
      pr: "5px",
      ms: -1,
    })
    expect(await computed("padding-top")).toBe("16px")
    expect(await computed("padding-bottom")).toBe("16px")
    expect(await computed("padding-left")).toBe("12px")
    expect(await computed("padding-right")).toBe("5px")
    expect(await computed("margin-top")).toBe("8px")
    expect(await computed("margin-left")).toBe("-4px")
    expect(await computed("margin-right")).toBe("8px")
    await page
      .locator("#target")
      .evaluate((element) => element.setAttribute("dir", "rtl"))
    expect(await computed("padding-left")).toBe("16px")
    expect(await computed("padding-right")).toBe("5px")
    expect(await computed("margin-right")).toBe("-4px")
    expect(await computed("margin-left")).toBe("8px")
  })
  test("shorthands clear physical and logical sides, including pseudo-elements", async () => {
    await render({ css: escapeStyles.spacingSides, p: 4, m: "1px 2px 3px 4px" })
    for (const side of ["top", "right", "bottom", "left"]) {
      expect(await computed(`padding-${side}`)).toBe("16px")
    }
    expect(await computed("margin-right")).toBe("2px")
    expect(await computed("margin-top")).toBe("1px")
    expect(await computed("margin-bottom")).toBe("3px")
    await render({ css: escapeStyles.pseudoSpacing, _before: { p: 4, m: 2 } })
    expect(await computed("padding-right", "::before")).toBe("16px")
    expect(await computed("margin-top", "::before")).toBe("8px")
  })

  test("axis aliases replace logical side defaults and retain vertical writing-mode mapping", async () => {
    await render({
      css: escapeStyles.spacingSides,
      px: "4px 8px",
      my: 2,
      writingMode: "vertical-rl",
    })
    expect(await computed("padding-top")).toBe("4px")
    expect(await computed("padding-bottom")).toBe("8px")
    expect(await computed("padding-left")).toBe("15px")
    expect(await computed("margin-left")).toBe("8px")
    expect(await computed("margin-top")).toBe("0px")
  })

  test("conditional-only values reset unmatched properties; explicit base preserves intended fallback", async () => {
    await page.setViewportSize({ width: 700, height: 600 })
    await render({ p: { md: 2 } }, "Target", { p: 4 })
    expect(await computed("padding-top")).toBe("0px")
    await render({ p: { base: 4, md: 2 } }, "Target", { p: 4 })
    expect(await computed("padding-top")).toBe("16px")
    await page.setViewportSize({ width: 800, height: 600 })
    expect(await computed("padding-top")).toBe("8px")
  })
  test("numeric spacing responds to a compiled StyleX theme without rerendering props", async () => {
    await render({ p: 4, ms: -2, gap: 0.5 })
    expect(await computed("padding-top")).toBe("16px")
    expect(await computed("margin-inline-start")).toBe("-8px")
    await page.locator("body").evaluate((element, props) => {
      element.setAttribute("class", props.className ?? "")
    }, spaciousThemeProps)
    expect(await computed("padding-top")).toBe("32px")
    expect(await computed("margin-inline-start")).toBe("-16px")
    expect(await computed("gap")).toBe("4px")
  })

  test("static css supports arbitrary compiled selectors and composition order", async () => {
    await render({ css: escapeStyles.custom }, "<span>Target</span>", { p: 8 })
    expect(await computed("padding-top")).toBe("3px")
    expect(await computed("color")).toBe("rgb(128, 0, 128)")
    await render({ css: escapeStyles.custom, p: 4 }, "<span>Target</span>", {
      p: 8,
    })
    expect(await computed("padding-top")).toBe("16px")
    const props = stylex.props(
      core.resolveStyleProps({ css: escapeStyles.custom, p: 4 }),
      escapeStyles.override,
    )
    await page.locator("#target").evaluate((element, value) => {
      element.setAttribute("class", value.className ?? "")
    }, props)
    expect(await computed("padding-top")).toBe("24px")
  })

  test("theme conditions follow data-theme, not operating system or class names", async () => {
    await render({
      color: "green",
      _dark: { color: "white" },
      _light: { color: "black" },
    })
    await page.emulateMedia({ colorScheme: "dark" })
    await page.locator("html").evaluate((element) => {
      element.setAttribute("class", "dark")
    })
    expect(await computed("color")).toBe("rgb(0, 128, 0)")
    await page.locator("html").evaluate((element) => {
      element.dataset.theme = "dark"
    })
    expect(await computed("color")).toBe("rgb(255, 255, 255)")
    await page.locator("html").evaluate((element) => {
      element.dataset.theme = "light"
    })
    expect(await computed("color")).toBe("rgb(0, 0, 0)")
    await page.locator("html").evaluate((element) => {
      delete element.dataset.theme
      element.setAttribute("class", "")
    })
    await page.locator("#target").evaluate((element) => {
      element.dataset.theme = "dark"
    })
    expect(await computed("color")).toBe("rgb(255, 255, 255)")
    await page.emulateMedia({ colorScheme: "light" })
  })

  test("contrast conditions track more, less, and no preference", async () => {
    await render({
      opacity: 1,
      _moreContrast: { opacity: 0.75 },
      _lessContrast: { opacity: 0.5 },
    })
    const session = await page.context().newCDPSession(page)
    for (const [value, expected] of [
      ["more", "0.75"],
      ["less", "0.5"],
      ["no-preference", "1"],
    ]) {
      await session.send("Emulation.setEmulatedMedia", {
        features: [{ name: "prefers-contrast", value }],
      })
      expect(await computed("opacity")).toBe(expected)
    }
    await session.detach()
  })

  test("compiler extracts CSS without runtime creation or injection", () => {
    expect(compiledSource).not.toContain("stylex.create(")
    expect(compiledSource).not.toContain("inject(")
    expect(css).toContain("@media (min-width: 768px)")
    expect(css).toContain("margin-inline-start")
    expect(css).toContain("::before")
  })

  test("responsive fallbacks, breakpoint edges, ranges, and nested states", async () => {
    await render({
      p: { base: 1, mdOnly: 3, lg: 5 },
      color: { base: "red", mdToXl: "blue" },
      _hover: { md: { _focus: { color: "green", borderWidth: 3 } } },
    })
    await page.setViewportSize({ width: 767, height: 600 })
    expect(await computed("padding-top")).toBe("4px")
    expect(await computed("color")).toBe("rgb(255, 0, 0)")
    await page.setViewportSize({ width: 768, height: 600 })
    expect(await computed("padding-top")).toBe("12px")
    expect(await computed("color")).toBe("rgb(0, 0, 255)")
    await page.locator("#target").hover()
    expect(await computed("color")).toBe("rgb(0, 0, 255)")
    await page.locator("#target").focus()
    expect(await computed("color")).toBe("rgb(0, 128, 0)")
    expect(await computed("border-top-width")).toBe("3px")
    await page.mouse.move(700, 500)
    await page.setViewportSize({ width: 1024, height: 600 })
    expect(await computed("padding-top")).toBe("20px")
    await page.setViewportSize({ width: 1536, height: 600 })
    expect(await computed("color")).toBe("rgb(255, 0, 0)")
  })

  test("negative spacing, RTL, pseudo-elements, and sibling spacing", async () => {
    await render(
      {
        ms: -2,
        pe: 3,
        spaceX: -1,
        _before: { content: '"Before"', fontSize: 18, color: "purple" },
      },
      '<span id="first">One</span><span id="second">Two</span>',
    )
    await page
      .locator("#target")
      .evaluate((element) => element.setAttribute("dir", "rtl"))
    expect(await computed("margin-right")).toBe("-8px")
    expect(await computed("padding-left")).toBe("12px")
    expect(await computed("content", "::before")).toBe('"Before"')
    expect(await computed("font-size", "::before")).toBe("18px")
    expect(await computed("color", "::before")).toBe("rgb(128, 0, 128)")
    expect(
      await page
        .locator("#second")
        .evaluate((element) => getComputedStyle(element).marginInlineStart),
    ).toBe("-4px")
    expect(
      await page
        .locator("#first")
        .evaluate((element) => getComputedStyle(element).marginInlineStart),
    ).toBe("0px")
  })

  test("disabled state blocks hover and supports aria/data state selectors", async () => {
    await render({
      color: "red",
      _hover: { color: "blue" },
      _disabled: { color: "gray" },
    })
    await page.locator("#target").hover()
    expect(await computed("color")).toBe("rgb(0, 0, 255)")
    await page
      .locator("#target")
      .evaluate((element) => element.setAttribute("aria-disabled", "true"))
    expect(await computed("color")).toBe("rgb(128, 128, 128)")
    await page.locator("#target").evaluate((element) => {
      element.removeAttribute("aria-disabled")
      element.setAttribute("data-disabled", "")
    })
    expect(await computed("color")).toBe("rgb(128, 128, 128)")
  })

  test("mdDown, raw values, custom variables, and system conditions", async () => {
    await page.setViewportSize({ width: 700, height: 600 })
    await render({
      css: { "--brand": "rgb(10, 20, 30)", color: "var(--brand)" },
      width: "calc(100px + 20px)",
      opacity: { base: 1, mdDown: 0.5 },
      _motionReduce: { opacity: 0.25 },
    })
    expect(await computed("width")).toBe("120px")
    expect(await computed("color")).toBe("rgb(10, 20, 30)")
    expect(await computed("opacity")).toBe("0.5")
    await page.emulateMedia({ reducedMotion: "reduce" })
    expect(await computed("opacity")).toBe("0.25")
    await page.emulateMedia({ reducedMotion: "no-preference" })
    await page.setViewportSize({ width: 768, height: 600 })
    expect(await computed("opacity")).toBe("1")
  })
})
