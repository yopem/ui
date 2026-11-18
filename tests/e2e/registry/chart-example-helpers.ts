import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

import { openPreview } from "./helpers"

export interface ChartExampleFamily {
  name: string
  variants: readonly string[]
}

export function defineChartExampleTests(
  families: readonly ChartExampleFamily[],
) {
  for (const theme of ["light", "dark"] as const) {
    for (const family of families) {
      test(`@a11y ${family.name} examples work in ${theme}`, async ({
        page,
      }, testInfo) => {
        test.setTimeout(120_000)
        const pageErrors: string[] = []
        page.on("pageerror", function collectError(error) {
          pageErrors.push(error.message)
        })
        await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" })
        await page.addInitScript(
          (value) => localStorage.setItem("yopem-ui-theme", value),
          theme,
        )
        await openPreview(page, "chart")

        const section = page.getByRole("region", {
          name: `${family.name} examples`,
          exact: true,
        })

        for (const variant of family.variants) {
          const example = section.getByRole("region", {
            name: `${family.name} ${variant}`,
            exact: true,
          })

          await expect(example).toBeVisible()
          const svg = example.locator("svg[role=img]").first()
          await expect(svg).toBeVisible()
          await expect(
            svg.locator("path, rect, circle, polygon, polyline").first(),
          ).toBeAttached()

          if (variant === "Negative") await expect(svg).toContainText("-")

          if (family.name === "Tooltip") {
            if (variant === "Initial focus") {
              await example
                .getByRole("button", {
                  name: "Show initial focus",
                  exact: true,
                })
                .click()
            } else {
              await svg.focus()
              await page.keyboard.press("ArrowRight")
            }

            const tooltip = page.getByRole("status").filter({ hasText: /\S/ })
            await expect(tooltip).toBeVisible()

            if (variant === "No indicator")
              await expect(
                tooltip.locator('[data-slot="chart-tooltip-indicator"]'),
              ).toHaveCount(0)

            if (variant === "No label")
              await expect(
                tooltip.locator('[data-slot="chart-tooltip-label"]'),
              ).toHaveCount(0)

            if (variant === "Advanced")
              await expect(
                tooltip.locator('[data-slot="chart-tooltip-total"]'),
              ).toBeVisible()

            const tooltipA11y = await new AxeBuilder({ page })
              .include('[data-slot="chart-tooltip-content"]')
              .analyze()

            expect(tooltipA11y.violations).toEqual([])
            await page.keyboard.press("Escape")
            await expect(tooltip).toBeHidden()
          }
        }

        const result = await new AxeBuilder({ page })
          .include(`[aria-label="${family.name} examples"]`)
          .disableRules(["heading-order"])
          .analyze()

        expect(result.violations).toEqual([])
        expect(pageErrors).toEqual([])
        await section.screenshot({
          path: testInfo.outputPath(
            `${family.name.toLowerCase()}-${theme}.png`,
          ),
          scale: "css",
        })
      })
    }
  }
}

export function defineChartSelectionTest(family: string) {
  test(`${family} chart preserves an explicit selection`, async ({ page }) => {
    await openPreview(page, "chart")

    const example = page
      .getByRole("region", { name: `${family} examples`, exact: true })
      .getByRole("region", { name: `${family} Active`, exact: true })

    const svg = example.locator("svg[role=img]").first()
    await svg.focus()
    await page.keyboard.press("ArrowRight")
    await page.keyboard.press("Enter")
    const selection = example.locator('[data-slot="chart-selection"]')
    await expect(selection).toHaveText(/\S/)
    const value = await selection.textContent()
    await page.keyboard.press("Escape")
    await expect(selection).toHaveText(value ?? "")
  })
}
