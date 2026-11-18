import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"
import { readFile } from "node:fs/promises"

import { openPreview } from "./helpers"

const chartNames = [
  "Area chart",
  "Bar chart",
  "Line chart",
  "Pie chart",
  "Radar chart",
  "Radial chart",
]

for (const theme of ["light", "dark"] as const) {
  test(`@a11y chart previews render and fit in ${theme}`, async ({
    page,
  }, testInfo) => {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" })
    await page.addInitScript(
      (value) => localStorage.setItem("yopem-ui-theme", value),
      theme,
    )
    await openPreview(page, "chart")

    for (const width of [1280, 375]) {
      await page.setViewportSize({ width, height: 900 })

      for (const name of chartNames) {
        const chart = page.getByRole("region", { name, exact: true })
        await expect(chart).toBeVisible()
        const svg = chart.locator("svg").first()
        await expect(svg).toBeVisible()
        await expect(
          svg.locator("path, rect, circle, polygon, polyline").first(),
        ).toBeAttached()
        const box = await svg.boundingBox()
        expect(box).not.toBeNull()

        if (box) {
          expect(box.width).toBeGreaterThan(0)
          expect(box.height).toBeGreaterThan(0)
          expect(box.x).toBeGreaterThanOrEqual(0)
          expect(box.x + box.width).toBeLessThanOrEqual(width + 1)
        }
      }
    }

    const bar = page
      .getByRole("region", { name: "Bar chart", exact: true })
      .locator("svg")
      .first()

    await bar.focus()
    await page.keyboard.press("ArrowRight")
    await expect(
      page.getByRole("status").filter({ hasText: /\S/ }),
    ).toBeVisible()

    const result = await new AxeBuilder({ page })
      .include('[aria-label$="live preview"]')
      .include('[data-slot="chart-tooltip-content"]')
      .disableRules(["heading-order"])
      .analyze()

    expect(result.violations).toEqual([])
    await page.screenshot({
      path: testInfo.outputPath(`chart-${theme}.png`),
      fullPage: true,
      scale: "css",
    })
  })
}

test("chart tooltip responds to keyboard and pointer input", async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" })
  await openPreview(page, "chart")

  for (const name of chartNames) {
    const target = page
      .getByRole("region", { name, exact: true })
      .locator("svg")
      .first()

    await target.focus()
    await page.keyboard.press("ArrowRight")
    const activeTooltip = page.getByRole("status").filter({ hasText: /\S/ })
    await expect(activeTooltip).toBeVisible()
    await expect(
      activeTooltip.locator('[data-slot="chart-tooltip-row"]').first(),
    ).toBeVisible()
    await page.keyboard.press("Escape")
    await expect(activeTooltip).toBeHidden()
  }

  const chart = page.getByRole("region", { name: "Bar chart", exact: true })
  const svg = chart.locator("svg").first()
  await svg.scrollIntoViewIfNeeded()
  expect(await svg.getAttribute("tabindex")).toMatch(/^(0|[1-9]\d*)$/)
  await svg.focus()
  await expect(svg).toBeFocused()
  await page.keyboard.press("ArrowRight")
  const tooltip = page.getByRole("status").filter({ hasText: /\S/ })
  await expect(tooltip).toBeVisible()
  await page.screenshot({
    path: testInfo.outputPath("chart-keyboard-tooltip.png"),
    scale: "css",
  })

  await page.keyboard.press("Escape")
  await page.mouse.move(0, 0)
  await expect(tooltip).toBeHidden()
  const box = await svg.boundingBox()
  expect(box).not.toBeNull()

  if (!box) return

  let found = false

  for (let y = 1; y < 10 && !found; y++) {
    for (let x = 1; x < 10 && !found; x++) {
      await page.mouse.move(
        box.x + (box.width * x) / 10,
        box.y + (box.height * y) / 10,
      )
      found = await tooltip.isVisible()
    }
  }

  expect(found).toBe(true)
  await expect(tooltip).toBeVisible()
  await page.screenshot({
    path: testInfo.outputPath("chart-pointer-tooltip.png"),
    scale: "css",
  })
})

test("chart controls update visible data and legends", async ({ page }) => {
  await openPreview(page, "chart")
  const chart = page.getByRole("region", { name: "Bar chart", exact: true })

  const legend = chart
    .locator("..")
    .locator('[data-slot="chart-legend-content"]')

  await expect(
    legend.getByText("Desktop visits", { exact: true }),
  ).toBeVisible()
  await expect(legend.getByText("Mobile visits", { exact: true })).toBeVisible()
  await page.getByRole("combobox", { name: "Series", exact: true }).click()
  await page.getByRole("option", { name: "Mobile", exact: true }).click()
  await expect(legend).not.toContainText("Desktop")
  await expect(legend).toContainText("Mobile")
  await chart.locator("svg").focus()
  await page.keyboard.press("ArrowRight")
  const tooltip = page.getByRole("status").filter({ hasText: /\S/ })
  await expect(tooltip.locator('[data-slot="chart-tooltip-row"]')).toHaveCount(
    1,
  )
  await expect(tooltip).toContainText("Mobile visits")
  await page.keyboard.press("Escape")
  await expect(tooltip).toBeHidden()
  await page.getByRole("combobox", { name: "Data range", exact: true }).click()
  await page
    .getByRole("option", { name: "Last three months", exact: true })
    .click()
  await expect(chart.locator("svg")).not.toContainText("Jan")
  await expect(chart.locator("svg")).toContainText("Jun")
  await page.getByRole("combobox", { name: "Series", exact: true }).click()
  await page.getByRole("option", { name: "All devices", exact: true }).click()
  await expect(legend).toContainText("Desktop")
  await page.getByRole("combobox", { name: "Data range", exact: true }).click()
  await page.getByRole("option", { name: "Six months", exact: true }).click()
  await expect(chart.locator("svg")).toContainText("Jan")
})

test("chart tooltip variants and formatters preserve data", async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" })
  await openPreview(page, "chart")

  for (const [name, indicator] of [
    ["Area chart", "line"],
    ["Line chart", "dashed"],
  ] as const) {
    const svg = page
      .getByRole("region", { name, exact: true })
      .locator("svg")
      .first()

    await svg.focus()
    await page.keyboard.press("ArrowRight")
    const tooltip = page.getByRole("status").filter({ hasText: /\S/ })
    await expect(tooltip).toBeVisible()

    if (name === "Area chart") {
      await expect(
        tooltip.getByText("Desktop visits", { exact: true }),
      ).toBeVisible()
      await expect(
        tooltip.getByText("Mobile visits", { exact: true }),
      ).toBeVisible()
    }

    await expect(
      tooltip.locator('[data-slot="chart-tooltip-indicator"]').first(),
    ).toHaveAttribute("data-indicator", indicator)
    await page.screenshot({
      path: testInfo.outputPath(`${indicator}-tooltip.png`),
      scale: "css",
    })
    await page.keyboard.press("Escape")
  }

  const bar = page
    .getByRole("region", { name: "Bar chart", exact: true })
    .locator("svg")
    .first()

  await bar.focus()
  await page.keyboard.press("ArrowRight")
  const formatted = page.getByRole("status").filter({ hasText: /\S/ })
  await expect(formatted).toContainText(/\d+ visits/)
  await expect(
    formatted.locator('[data-slot="chart-tooltip-label"]'),
  ).toContainText("Month:")
  await page.keyboard.press("Escape")

  const pie = page
    .getByRole("region", { name: "Pie chart", exact: true })
    .locator("svg")
    .first()

  await pie.focus()
  await page.keyboard.press("ArrowRight")
  const hiddenLabel = page.getByRole("status").filter({ hasText: /\S/ })
  await expect(hiddenLabel).toBeVisible()
  await expect(
    hiddenLabel.locator('[data-slot="chart-tooltip-label"]'),
  ).toHaveCount(0)
})

test("empty chart preserves its accessible name", async ({ page }) => {
  await openPreview(page, "chart")
  const chart = page.getByRole("region", { name: "Empty chart", exact: true })
  await expect(chart).toBeVisible()
  await expect(chart.locator('[data-slot="empty"]')).toBeVisible()
})

test("chart series colors stay the same across themes", async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem("yopem-ui-theme", "light"),
  )
  await openPreview(page, "chart")

  const paths = page
    .getByRole("region", { name: "Pie chart", exact: true })
    .locator("svg path[fill]")

  await expect(paths.first()).toBeVisible()

  const lightColors = await paths.evaluateAll((elements) =>
    elements.map((element) => getComputedStyle(element).fill),
  )

  expect(lightColors.length).toBeGreaterThan(1)
  await page
    .getByRole("button", { name: "Switch to dark theme", exact: true })
    .click()
  await expect(
    page.getByRole("button", { name: "Switch to light theme", exact: true }),
  ).toBeVisible()

  const darkColors = await paths.evaluateAll((elements) =>
    elements.map((element) => getComputedStyle(element).fill),
  )

  expect(darkColors).toEqual(lightColors)
})

test("chart data table and CSV follow the visible filters", async ({
  page,
}, testInfo) => {
  await openPreview(page, "chart")
  await page
    .getByRole("button", { name: "View data table", exact: true })
    .click()
  const table = page.getByRole("table", { name: "Chart data", exact: true })
  await expect(table).toBeVisible()
  await expect(table.getByRole("row")).toHaveCount(13)
  await page.getByRole("combobox", { name: "Series", exact: true }).click()
  await page.getByRole("option", { name: "Mobile", exact: true }).click()
  await page.getByRole("combobox", { name: "Data range", exact: true }).click()
  await page
    .getByRole("option", { name: "Last three months", exact: true })
    .click()
  await expect(table.getByRole("row")).toHaveCount(4)
  await expect(table).not.toContainText("Desktop")

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Export CSV", exact: true }).click(),
  ])

  expect(download.suggestedFilename()).toBe("chart-visits.csv")
  const path = testInfo.outputPath("chart-visits.csv")
  await download.saveAs(path)
  const rows = (await readFile(path, "utf8")).trim().split("\n")
  expect(rows[0]).toBe("Month,Device,Visits")
  expect(rows).toHaveLength(4)

  for (const row of rows.slice(1)) {
    const [month, device, visits] = row.split(",")
    expect(["Apr", "May", "Jun"]).toContain(month)
    expect(device).toBe("Mobile")
    expect(Number(visits)).toBeGreaterThan(0)
  }
})

test.describe("chart touch input", () => {
  test.use({ hasTouch: true })

  test("chart tooltip pins on touch and closes after an outside tap", async ({
    page,
  }, testInfo) => {
    await openPreview(page, "chart")
    const chart = page.getByRole("region", { name: "Bar chart", exact: true })
    await chart.locator("svg rect").last().tap()

    const tooltip = page
      .getByRole("dialog")
      .filter({ has: page.locator('[data-slot="chart-tooltip-content"]') })

    await expect(tooltip).toBeVisible()
    await expect(
      tooltip.locator('[data-slot="chart-tooltip-row"]').first(),
    ).toBeVisible()
    await page.screenshot({
      path: testInfo.outputPath("chart-touch-tooltip.png"),
      scale: "css",
    })
    await chart
      .locator("..")
      .locator('[data-slot="chart-legend-content"]')
      .tap()
    await expect(tooltip).toBeHidden()
    await expect(page).toHaveURL(/\/components\/chart$/)
  })
})

test("chart galleries stay inside the viewport after resize", async ({
  page,
}) => {
  test.setTimeout(90_000)
  await openPreview(page, "chart")

  for (const width of [1280, 375, 1024]) {
    await page.setViewportSize({ width, height: 900 })
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
      .toBeLessThanOrEqual(width + 1)
    const charts = page.locator('[aria-label$="live preview"] svg[role="img"]')

    for (const svg of await charts.all()) {
      await expect
        .poll(async () => {
          const bounds = await svg.boundingBox()

          return bounds ? bounds.x + bounds.width : Number.POSITIVE_INFINITY
        })
        .toBeLessThanOrEqual(width + 1)
    }
  }
})
