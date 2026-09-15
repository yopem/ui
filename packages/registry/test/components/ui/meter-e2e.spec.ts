import type { Page } from "@playwright/test"

import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

function monitorPage(page: Page) {
  const failures: string[] = []
  page.on("console", (message) => {
    if (message.type() === "error") failures.push(`console: ${message.text()}`)
  })
  page.on("pageerror", (error) => failures.push(`page: ${error.message}`))
  page.on("requestfailed", (request) => {
    const url = new URL(request.url())
    if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
      failures.push(
        `request: ${request.url()} ${request.failure()?.errorText ?? "failed"}`,
      )
    }
  })
  page.on("response", (response) => {
    const url = new URL(response.url())
    const assets = new Set(["font", "image", "script", "stylesheet"])
    if (
      (url.hostname === "localhost" || url.hostname === "127.0.0.1") &&
      response.status() >= 400 &&
      assets.has(response.request().resourceType())
    ) {
      failures.push(`asset: ${response.status()} ${response.url()}`)
    }
  })
  return function expectNoFailures() {
    expect(failures).toEqual([])
  }
}

async function openExample(page: Page, number: number) {
  await page.goto(`/examples/p-meter-${number}`)
  await expect(page.locator("[data-example-root]")).toBeVisible()
  await expect(page.getByText("Loading example…")).toHaveCount(0)
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
  ).toBe(true)
}

test("meter examples expose values, ranges, labels, and indicators", async ({
  page,
}) => {
  const expectNoFailures = monitorPage(page)

  await openExample(page, 1)
  const storage = page.getByRole("meter", { name: "Storage usage" })
  await expect(storage).toHaveAttribute("aria-valuenow", "75")
  await expect(storage).toHaveAttribute("aria-valuemin", "0")
  await expect(storage).toHaveAttribute("aria-valuemax", "100")
  await expect(page.locator('[data-slot="meter-value"]')).toContainText("75")
  await expect(page.locator('[data-slot="meter-indicator"]')).toBeVisible()

  await openExample(page, 2)
  await expect(page.getByRole("meter")).toHaveAttribute("aria-valuenow", "50")
  await expect(page.locator('[data-slot="meter-track"]')).toBeVisible()

  await openExample(page, 3)
  const rating = page.getByRole("meter", { name: "Rating" })
  await expect(rating).toHaveAttribute("aria-valuemax", "5")
  await expect(rating).toHaveAttribute("aria-valuenow", "3")
  await expect(page.getByText("3 / 5")).toBeVisible()

  await openExample(page, 4)
  const bandwidth = page.getByRole("meter", { name: "Bandwidth (Mbps)" })
  await expect(bandwidth).toHaveAttribute("aria-valuemin", "500")
  await expect(bandwidth).toHaveAttribute("aria-valuemax", "1000")
  await expect(bandwidth).toHaveAttribute("aria-valuenow", "700")
  await expect(page.locator('[data-slot="meter-value"]')).toHaveText("700")
  await expect(
    page.locator(
      '[data-example-root] button, [data-example-root] input, [data-example-root] [tabindex="0"]',
    ),
  ).toHaveCount(0)

  expectNoFailures()
})

test("@full-a11y every read-only meter state passes axe", async ({ page }) => {
  const expectNoFailures = monitorPage(page)

  for (const number of [1, 2, 3, 4]) {
    await openExample(page, number)
    const results = await new AxeBuilder({ page }).analyze()
    expect(results.violations).toEqual([])
  }

  expectNoFailures()
})
