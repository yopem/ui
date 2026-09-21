import type { Page } from "@playwright/test"

import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

async function openLayoutExample(
  page: Page,
  theme: "light" | "dark" = "light",
) {
  await page.goto(`/examples/p-layout-1?theme=${theme}`)
  await expect(page.locator("[data-example-root]")).toBeVisible()
}

test.describe("layout and typography primitives", () => {
  test("renders all ten primitives with semantic native elements", async ({
    page,
  }) => {
    await openLayoutExample(page)

    for (const testId of [
      "box",
      "flex",
      "vstack",
      "hstack",
      "stack",
      "grid",
      "center",
      "native-link",
      "paragraph-ref",
      "preserved-heading",
    ]) {
      await expect(page.getByTestId(testId)).toBeVisible()
    }

    await expect(page.getByTestId("box")).toHaveJSProperty("tagName", "SECTION")
    await expect(page.getByTestId("native-link")).toHaveJSProperty(
      "tagName",
      "A",
    )
    await expect(page.getByTestId("paragraph-ref")).toHaveJSProperty(
      "tagName",
      "P",
    )

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

  test("preserves layout geometry, gap, direction, and RTL", async ({
    page,
  }) => {
    await openLayoutExample(page)

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

  test("respects spacing tokens and xstyle over layout defaults and props", async ({
    page,
  }) => {
    await openLayoutExample(page)
    await page
      .getByTestId("layout-root")
      .evaluate((element) => element.style.setProperty("--spacing", "8px"))
    await expect(page.getByTestId("stack")).toHaveCSS("gap", "32px")
    await expect(page.getByTestId("vstack")).toHaveCSS("gap", "32px")
    await expect(page.getByTestId("hstack")).toHaveCSS("gap", "32px")
    await expect(page.getByTestId("flex")).toHaveCSS("gap", "24px")
    await expect(page.getByTestId("override-hstack")).toHaveCSS("gap", "5px")
    await expect(page.getByTestId("override-hstack")).toHaveCSS(
      "justify-content",
      "flex-end",
    )
  })

  test("keeps responsive overrides on the same native tag", async ({
    page,
  }) => {
    await openLayoutExample(page)
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
    await openLayoutExample(page)

    const name = page.getByLabel("Name")
    await expect(name).toHaveAttribute("name", "name")
    await expect(name).toHaveAttribute("required", "")
    await expect(name).toHaveJSProperty("type", "text")

    await page.getByTestId("focus-name").press("Enter")
    await expect(name).toBeFocused()

    await page.getByTestId("inspect-refs").click()
    await expect(page.getByTestId("paragraph-ref-status")).toHaveText("P A")

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
      await openLayoutExample(page, theme)
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
