import type { Page } from "@playwright/test"

import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

test.describe.configure({ timeout: 120_000 })

function isLocalUrl(url: string) {
  try {
    const hostname = new URL(url).hostname
    return hostname === "localhost" || hostname === "127.0.0.1"
  } catch {
    return false
  }
}

function watchPage(page: Page) {
  const failures: string[] = []
  const assetTypes = new Set(["font", "image", "script", "stylesheet"])

  page.on("console", (message) => {
    if (message.type() === "error") failures.push(`console: ${message.text()}`)
  })
  page.on("pageerror", (error) => failures.push(`page: ${error.message}`))
  page.on("requestfailed", (request) => {
    if (isLocalUrl(request.url())) {
      failures.push(
        `request: ${request.url()} ${request.failure()?.errorText ?? "failed"}`,
      )
    }
  })
  page.on("response", (response) => {
    if (
      isLocalUrl(response.url()) &&
      response.status() >= 400 &&
      assetTypes.has(response.request().resourceType())
    ) {
      failures.push(`asset: ${response.status()} ${response.url()}`)
    }
  })

  return function expectCleanPage() {
    expect(failures).toEqual([])
  }
}

async function openExample(page: Page, name: string) {
  await page.goto(`/examples/${name}`)
  await expect(page.locator("[data-example-root]")).toBeVisible({
    timeout: 30_000,
  })
  await expect(page.getByText("Loading example…")).toHaveCount(0, {
    timeout: 30_000,
  })
  const viewportFits = await page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth + 1,
  )
  expect(viewportFits).toBe(true)
}

async function expectNoAxeViolations(page: Page) {
  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations).toEqual([])
}

test("table renders semantic default and card variants plus selectable rows", async ({
  page,
}) => {
  const expectCleanPage = watchPage(page)
  await openExample(page, "p-table-1")
  const table = page.getByRole("table", {
    name: "A list of current projects.",
  })
  await expect(table).toBeVisible()
  await expect(page.locator('[data-slot="table-container"]')).toHaveAttribute(
    "tabindex",
    "0",
  )
  await expect(table.getByRole("columnheader")).toHaveCount(4)
  await expect(table.getByRole("row")).toHaveCount(8)
  await expect(table.getByText("Total Budget")).toBeVisible()

  await openExample(page, "p-table-2")
  await expect(page.locator('[data-slot="table-container"]')).toHaveAttribute(
    "data-variant",
    "card",
  )
  await expect(page.getByRole("table")).toBeVisible()

  await openExample(page, "p-table-3")
  const rowCheckboxes = page.getByRole("checkbox", { name: "Select row" })
  await expect(rowCheckboxes).toHaveCount(6)
  const firstRow = rowCheckboxes.first().locator("xpath=ancestor::tr")
  await rowCheckboxes.first().click()
  await expect(firstRow).toHaveAttribute("data-state", "selected")
  await rowCheckboxes.nth(1).focus()
  await rowCheckboxes.nth(1).press("Space")
  await expect(
    rowCheckboxes.nth(1).locator("xpath=ancestor::tr"),
  ).toHaveAttribute("data-state", "selected")
  await page.getByRole("checkbox", { name: "Select all" }).click()
  for (const checkbox of await rowCheckboxes.all()) {
    await expect(checkbox).toBeChecked()
  }
  expectCleanPage()
})

test("@full-a11y table passes axe in static and selected states", async ({
  page,
}) => {
  const expectCleanPage = watchPage(page)
  await openExample(page, "p-table-1")
  await expectNoAxeViolations(page)
  await openExample(page, "p-table-3")
  await expectNoAxeViolations(page)
  await page.getByRole("checkbox", { name: "Select row" }).first().click()
  await expectNoAxeViolations(page)
  expectCleanPage()
})
