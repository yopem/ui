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

test("tabs support pointer and keyboard activation, orientations, variants, and sizes", async ({
  page,
}) => {
  const expectCleanPage = watchPage(page)
  await openExample(page, "p-tabs-1")
  const tabs = page.getByRole("tab")
  await expect(tabs.first()).toHaveAttribute("aria-selected", "true")
  await tabs.first().focus()
  await tabs.first().press("ArrowRight")
  await expect(tabs.nth(1)).toBeFocused()
  await tabs.nth(1).press("Enter")
  await expect(tabs.nth(1)).toHaveAttribute("aria-selected", "true")
  await expect(page.getByRole("tabpanel")).toContainText("Tab 2 content")
  await tabs.nth(2).click()
  await expect(page.getByRole("tabpanel")).toContainText("Tab 3 content")

  await openExample(page, "p-tabs-2")
  const underlineList = page.getByRole("tablist")
  await expect(
    underlineList.locator('[data-slot="tab-indicator"]'),
  ).toBeVisible()

  await openExample(page, "p-tabs-3")
  const verticalList = page.getByRole("tablist")
  await expect(verticalList).toHaveAttribute("aria-orientation", "vertical")
  const verticalTabs = page.getByRole("tab")
  await verticalTabs.first().focus()
  await verticalTabs.first().press("ArrowDown")
  await expect(verticalTabs.nth(1)).toBeFocused()
  await verticalTabs.nth(1).press("Enter")
  await expect(verticalTabs.nth(1)).toHaveAttribute("aria-selected", "true")

  await openExample(page, "p-tabs-14")
  await expect(page.locator('[data-slot="tabs-list"]')).toHaveAttribute(
    "data-size",
    "sm",
  )
  await expect(page.locator('[data-slot="tabs-tab"]').first()).toHaveAttribute(
    "data-size",
    "sm",
  )

  await openExample(page, "p-tabs-15")
  await expect(page.locator('[data-slot="tabs-list"]')).toHaveAttribute(
    "data-size",
    "lg",
  )
  expectCleanPage()
})

test("@full-a11y tabs passes axe before and after horizontal and vertical selection", async ({
  page,
}) => {
  const expectCleanPage = watchPage(page)
  await openExample(page, "p-tabs-1")
  await expectNoAxeViolations(page)
  await page.getByRole("tab", { name: "Tab 2" }).click()
  await expectNoAxeViolations(page)
  await openExample(page, "p-tabs-3")
  await page.getByRole("tab", { name: "Tab 1" }).focus()
  await page.keyboard.press("ArrowDown")
  await page.keyboard.press("Enter")
  await expectNoAxeViolations(page)
  expectCleanPage()
})
