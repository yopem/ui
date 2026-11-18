import { expect, test } from "@playwright/test"

import {
  defineChartExampleTests,
  defineChartSelectionTest,
} from "./chart-example-helpers"
import { openPreview } from "./helpers"

defineChartExampleTests([
  {
    name: "Pie",
    variants: [
      "Pie",
      "Donut",
      "Center text",
      "Active",
      "Labels",
      "Custom labels",
      "Legend",
      "No separator",
      "Stacked",
      "Interactive",
    ],
  },
  {
    name: "Radar",
    variants: [
      "Default",
      "Dots",
      "Multiple",
      "Lines",
      "Labels",
      "Custom labels",
      "Circle grid",
      "Filled grid",
      "No grid",
      "Icons",
      "Legend",
    ],
  },
  {
    name: "Radial",
    variants: [
      "Default",
      "Grid",
      "Label",
      "Shape",
      "Stacked",
      "Concentric",
      "Text",
    ],
  },
])

defineChartSelectionTest("Pie")

test("radial progress tooltips ignore decorative tracks", async ({ page }) => {
  await openPreview(page, "chart")

  const section = page.getByRole("region", {
    name: "Radial examples",
    exact: true,
  })

  for (const variant of ["Default", "Stacked", "Concentric", "Text"]) {
    const example = section.getByRole("region", {
      name: `Radial ${variant}`,
      exact: true,
    })

    await example.locator("svg[role=img]").focus()
    await page.keyboard.press("ArrowRight")
    const tooltip = page.getByRole("status").filter({ hasText: /\S/ })
    await expect(tooltip).toBeVisible()

    const values =
      variant === "Stacked"
        ? [72, 28]
        : variant === "Concentric"
          ? [72, 55]
          : [72]

    const value = Number(
      await tooltip.locator('[data-slot="chart-tooltip-value"]').innerText(),
    )

    expect(values).toContain(value)
    await expect(tooltip).not.toContainText("Track")
    await page.keyboard.press("Escape")
    await expect(tooltip).toBeHidden()
  }
})

test("radar chart decoration does not add keyboard stops", async ({ page }) => {
  test.setTimeout(90_000)
  await openPreview(page, "chart")

  const section = page.getByRole("region", {
    name: "Radar examples",
    exact: true,
  })

  for (const variant of ["Default", "Dots", "Labels", "Custom labels"]) {
    const example = section.getByRole("region", {
      name: `Radar ${variant}`,
      exact: true,
    })

    await example.locator("svg[role=img]").first().focus()
    await page.keyboard.press("Home")
    const tooltip = page.getByRole("status").filter({ hasText: /\S/ })
    const categories: string[] = []

    for (let point = 0; point < 5; point++) {
      await expect(tooltip).toBeVisible()
      await expect(
        tooltip.locator('[data-slot="chart-tooltip-row"]'),
      ).toHaveCount(1)
      categories.push(
        await tooltip.locator('[data-slot="chart-tooltip-label"]').innerText(),
      )

      if (point < 4) await page.keyboard.press("ArrowRight")
    }

    expect(new Set(categories).size).toBe(5)
    await page.keyboard.press("ArrowRight")
    await expect(
      tooltip.locator('[data-slot="chart-tooltip-label"]'),
    ).toHaveText(categories[4] ?? "")
    await page.keyboard.press("Escape")
    await expect(tooltip).toBeHidden()
  }
})
