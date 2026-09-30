import type { Page } from "@playwright/test"

import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

async function openLayoutPreview(
  page: Page,
  theme: "light" | "dark" = "light",
) {
  await page.addInitScript(
    (value) => localStorage.setItem("yopem-ui-theme", value),
    theme,
  )
  await page.goto("/components/layout")
  await expect(page.getByTestId("layout-root")).toBeVisible()
}

test.describe("layout and typography primitives", () => {
  test("renders all eleven primitives with semantic native elements", async ({
    page,
  }) => {
    await openLayoutPreview(page)

    for (const testId of [
      "box",
      "flex",
      "vstack",
      "hstack",
      "stack",
      "grid",
      "center",
      "container",
      "fluid-container",
      "native-link",
      "text-ref",
      "preserved-heading",
    ]) {
      await expect(page.getByTestId(testId)).toBeVisible()
    }

    await expect(page.getByTestId("box")).toHaveJSProperty("tagName", "SECTION")
    await expect(page.getByTestId("native-link")).toHaveJSProperty(
      "tagName",
      "A",
    )
    await expect(page.getByTestId("router-link")).toHaveAttribute(
      "href",
      "/docs/installation",
    )
    await expect(page.getByTestId("text-ref")).toHaveJSProperty("tagName", "P")

    for (const [testId, tagName] of [
      ["heading-h1", "H1"],
      ["preserved-heading", "H2"],
      ["heading-h3", "H3"],
      ["heading-h4", "H4"],
      ["heading-h5", "H5"],
      ["heading-h6", "H6"],
    ] as const) {
      await expect(page.getByTestId(testId)).toHaveJSProperty(
        "tagName",
        tagName,
      )
    }
  })

  test("renders TanStack Router links without losing navigation", async ({
    page,
  }) => {
    await openLayoutPreview(page)
    await page.getByTestId("router-link").click()
    await expect(page).toHaveURL(/\/docs\/installation\/?$/)
  })

  test("preserves layout geometry, gap, direction, and RTL", async ({
    page,
  }) => {
    await openLayoutPreview(page)

    await expect(page.getByTestId("flex")).toHaveCSS("flex-direction", "row")
    await expect(page.getByTestId("flex")).toHaveCSS("gap", "12px")
    await expect(page.getByTestId("vstack")).toHaveCSS(
      "flex-direction",
      "column",
    )
    await expect(page.getByTestId("vstack")).toHaveCSS("align-items", "center")
    await expect(page.getByTestId("vstack")).toHaveCSS("gap", "16px")
    await expect(page.getByTestId("hstack")).toHaveCSS("flex-direction", "row")
    await expect(page.getByTestId("stack")).toHaveCSS(
      "flex-direction",
      "column",
    )
    await expect(page.getByTestId("grid")).toHaveCSS("display", "grid")
    await expect(page.getByTestId("center")).toHaveCSS("align-items", "center")
    await expect(page.getByTestId("center")).toHaveCSS(
      "justify-content",
      "center",
    )
    await expect(page.getByTestId("rtl-flex")).toHaveCSS("direction", "rtl")
    await expect(page.getByTestId("rtl-flex")).toHaveCSS(
      "flex-direction",
      "row",
    )

    const gridItems = page.getByTestId("grid").locator(":scope > span")
    const gridFirst = await gridItems.nth(0).boundingBox()
    const gridSecond = await gridItems.nth(1).boundingBox()
    expect(gridFirst).not.toBeNull()
    expect(gridSecond).not.toBeNull()

    if (gridFirst && gridSecond) {
      expect(gridSecond.x).toBeGreaterThan(gridFirst.x)
      expect(Math.abs(gridSecond.y - gridFirst.y)).toBeLessThan(2)
    }

    const stackItems = page.getByTestId("vstack").locator(":scope > span")
    const firstItem = await stackItems.nth(0).boundingBox()
    const secondItem = await stackItems.nth(1).boundingBox()
    expect(firstItem).not.toBeNull()
    expect(secondItem).not.toBeNull()

    if (firstItem && secondItem)
      expect(secondItem.y).toBeGreaterThan(firstItem.y)

    const center = await page.getByTestId("center").boundingBox()

    const centeredItem = await page
      .getByTestId("center")
      .locator(":scope > span")
      .boundingBox()

    expect(center).not.toBeNull()
    expect(centeredItem).not.toBeNull()

    if (center && centeredItem) {
      expect(
        Math.abs(
          center.x +
            center.width / 2 -
            (centeredItem.x + centeredItem.width / 2),
        ),
      ).toBeLessThan(2)
    }
  })

  test("constrains content, remains fluid, and accepts xstyle overrides", async ({
    page,
  }) => {
    await openLayoutPreview(page)
    const container = page.getByTestId("container")
    const fluid = page.getByTestId("fluid-container")
    await expect(container).toHaveAttribute("data-slot", "container")
    await expect(container).toHaveCSS("max-width", "960px")
    await expect(fluid).toHaveCSS("max-width", "none")
    await expect(container).toHaveCSS("padding-inline-start", "24px")

    await page.setViewportSize({ width: 500, height: 800 })
    const narrow = await container.boundingBox()
    expect(narrow?.width).toBeLessThanOrEqual(500)
    await page.setViewportSize({ width: 1280, height: 800 })
    const wide = await container.boundingBox()
    const parent = await fluid.boundingBox()
    expect(wide?.width).toBeLessThanOrEqual(960)
    expect(
      Math.abs(
        (wide?.x ?? 0) +
          (wide?.width ?? 0) / 2 -
          ((parent?.x ?? 0) + (parent?.width ?? 0) / 2),
      ),
    ).toBeLessThan(2)
  })

  test("centers overlays, floats corners, and wraps content", async ({
    page,
  }) => {
    await openLayoutPreview(page)

    for (const testId of [
      "positioned-layout",
      "absolute-center",
      "float",
      "rtl-positioned-layout",
      "rtl-absolute-center",
      "rtl-float",
    ]) {
      await expect(page.getByTestId(testId)).toBeVisible()
    }

    const area = await page.getByTestId("positioned-layout").boundingBox()
    const center = await page.getByTestId("absolute-center").boundingBox()
    const float = await page.getByTestId("float").boundingBox()
    expect(
      Math.abs(
        (center?.x ?? 0) +
          (center?.width ?? 0) / 2 -
          ((area?.x ?? 0) + (area?.width ?? 0) / 2),
      ),
    ).toBeLessThan(2)
    expect(float?.x).toBeGreaterThan(center?.x ?? 0)

    const rtlArea = await page
      .getByTestId("rtl-positioned-layout")
      .boundingBox()

    for (const testId of ["rtl-absolute-center", "rtl-float"]) {
      const item = await page.getByTestId(testId).boundingBox()
      expect(
        Math.abs(
          (item?.x ?? 0) +
            (item?.width ?? 0) / 2 -
            ((rtlArea?.x ?? 0) + (rtlArea?.width ?? 0) / 2),
        ),
      ).toBeLessThan(2)
    }

    await expect(page.getByTestId("wrap")).toHaveCSS("flex-wrap", "wrap")
    await expect(page.getByTestId("bleed")).toHaveCSS(
      "margin-inline-start",
      "-16px",
    )
  })

  test("composes xstyle with layout defaults", async ({ page }) => {
    await openLayoutPreview(page)
    await expect(page.getByTestId("stack")).toHaveCSS("gap", "16px")
    await expect(page.getByTestId("vstack")).toHaveCSS("gap", "16px")
    await expect(page.getByTestId("hstack")).toHaveCSS("gap", "16px")
    await expect(page.getByTestId("flex")).toHaveCSS("gap", "12px")
    await expect(page.getByTestId("override-hstack")).toHaveCSS("gap", "5px")
    await expect(page.getByTestId("override-hstack")).toHaveCSS(
      "justify-content",
      "flex-end",
    )
  })

  test("Box applies defaults and composes xstyle", async ({ page }) => {
    await openLayoutPreview(page)
    const box = page.getByTestId("box")
    await expect(box).toHaveAttribute("data-slot", "box")
    await expect(box).toHaveCSS("box-sizing", "border-box")
    await expect(box).toHaveCSS("min-inline-size", "0px")
    await expect(box).toHaveCSS("padding-top", "8px")
    await expect(box).not.toHaveAttribute("p")
  })

  test("keeps responsive StyleX overrides on the same native tag", async ({
    page,
  }) => {
    await openLayoutPreview(page)
    const responsive = page.getByTestId("responsive-tag")

    await page.setViewportSize({ height: 800, width: 500 })
    await expect(responsive).toHaveCSS("display", "block")
    await expect(responsive).toHaveJSProperty("tagName", "DIV")

    await page.setViewportSize({ height: 800, width: 1024 })
    await expect(responsive).toHaveCSS("display", "flex")
    await expect(responsive).toHaveJSProperty("tagName", "DIV")
  })

  test("keeps native navigation, keyboard focus, refs, and form names", async ({
    page,
  }) => {
    await openLayoutPreview(page)

    const name = page.getByLabel("Name")
    await expect(name).toHaveAttribute("name", "name")
    await expect(name).toHaveAttribute("required", "")
    await expect(name).toHaveJSProperty("type", "text")

    await page.getByTestId("focus-name").press("Enter")
    await expect(name).toBeFocused()

    await page.getByTestId("inspect-refs").click()
    await expect(page.getByTestId("text-ref-status")).toHaveText("P A")

    await page.getByRole("link", { name: "Go to destination" }).press("Enter")
    await expect(page).toHaveURL(/#destination$/)
    await expect(page.getByTestId("destination")).toBeVisible()

    await name.fill("Ada")
    await name.press("Enter")
    await expect(page.getByTestId("submit-status")).toHaveText("Submitted")
  })

  for (const theme of ["light", "dark"] as const) {
    test(`has no detectable accessibility violations in ${theme} theme`, async ({
      page,
    }) => {
      await openLayoutPreview(page, theme)
      const results = await new AxeBuilder({ page }).analyze()
      expect(
        results.violations.map(({ help, id, nodes }) => ({
          help,
          id,
          targets: nodes.flatMap((node) => node.target),
        })),
      ).toEqual([])
    })
  }
})
