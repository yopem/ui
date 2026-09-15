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

test("separator renders horizontal and vertical semantic separators", async ({
  page,
}) => {
  const expectCleanPage = watchPage(page)
  await openExample(page, "p-separator-1")
  const separators = page.getByRole("separator")
  await expect(separators).toHaveCount(4)
  await expect(separators.first()).toHaveAttribute(
    "data-orientation",
    "horizontal",
  )
  await expect(separators.nth(1)).toHaveAttribute(
    "data-orientation",
    "vertical",
  )
  const horizontalBox = await separators.first().boundingBox()
  const verticalBox = await separators.nth(1).boundingBox()
  expect(horizontalBox?.width ?? 0).toBeGreaterThan(horizontalBox?.height ?? 0)
  expect(verticalBox?.height ?? 0).toBeGreaterThan(verticalBox?.width ?? 0)
  await expect(page.getByText("Blog", { exact: true })).toBeVisible()
  await expect(page.getByText("Releases", { exact: true })).toBeVisible()
  expectCleanPage()
})

test("@full-a11y separator example passes axe", async ({ page }) => {
  const expectCleanPage = watchPage(page)
  await openExample(page, "p-separator-1")
  await expectNoAxeViolations(page)
  expectCleanPage()
})
