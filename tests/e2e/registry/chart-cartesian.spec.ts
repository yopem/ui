import { expect, test } from "@playwright/test"

import {
  defineChartExampleTests,
  defineChartSelectionTest,
} from "./chart-example-helpers"
import { openPreview } from "./helpers"

defineChartExampleTests([
  {
    name: "Area",
    variants: [
      "Default",
      "Linear",
      "Step",
      "Stacked",
      "Expanded",
      "Gradient",
      "Axes",
      "Legend",
      "Icons",
      "Interactive",
    ],
  },
  {
    name: "Bar",
    variants: [
      "Default",
      "Horizontal",
      "Grouped",
      "Stacked",
      "Mixed",
      "Negative",
      "Labels",
      "Custom labels",
      "Active",
      "Interactive",
    ],
  },
  {
    name: "Line",
    variants: [
      "Default",
      "Linear",
      "Step",
      "Multiple",
      "Dots",
      "Custom dots",
      "Labels",
      "Custom labels",
      "Interactive",
    ],
  },
])

defineChartSelectionTest("Bar")

test("decorative chart labels and dots keep one tooltip row per datum", async ({
  page,
}) => {
  test.setTimeout(90_000)
  await openPreview(page, "chart")

  for (const [family, variants] of [
    ["Bar", ["Labels", "Custom labels"]],
    ["Line", ["Dots", "Custom dots", "Labels", "Custom labels"]],
  ] as const) {
    const section = page.getByRole("region", {
      name: `${family} examples`,
      exact: true,
    })

    for (const variant of variants) {
      const example = section.getByRole("region", {
        name: `${family} ${variant}`,
        exact: true,
      })

      const svg = example.locator("svg[role=img]").first()
      await svg.focus()
      await page.keyboard.press("Home")
      const tooltip = page.getByRole("status").filter({ hasText: /\S/ })

      for (const month of ["Jan", "Feb", "Mar", "Apr", "May", "Jun"]) {
        await expect(tooltip).toBeVisible()
        await expect(
          tooltip.locator('[data-slot="chart-tooltip-label"]'),
        ).toHaveText(month)
        await expect(
          tooltip.locator('[data-slot="chart-tooltip-row"]'),
        ).toHaveCount(1)

        if (month !== "Jun") await page.keyboard.press("ArrowRight")
      }

      await page.keyboard.press("Escape")
      await expect(tooltip).toBeHidden()
      await svg.scrollIntoViewIfNeeded()

      const point =
        family === "Bar"
          ? svg.locator("rect").last()
          : variant === "Dots" || variant === "Custom dots"
            ? svg.locator("circle").first()
            : svg.getByText(
                variant === "Custom labels" ? "186 visits" : "186",
                { exact: true },
              )

      const bounds = await point.boundingBox()
      expect(bounds).not.toBeNull()

      if (!bounds) throw new Error("Chart point bounds are missing")
      await page.mouse.move(
        bounds.x + bounds.width / 2,
        bounds.y + bounds.height / 2,
      )

      await expect(tooltip).toBeVisible()
      await expect(
        tooltip.locator('[data-slot="chart-tooltip-row"]'),
      ).toHaveCount(1)
      await page.keyboard.press("Escape")
      await page.mouse.move(0, 0)
      await expect(tooltip).toBeHidden()
    }
  }
})
