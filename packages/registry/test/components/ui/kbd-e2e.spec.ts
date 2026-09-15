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

async function openExample(page: Page) {
  await page.goto("/examples/p-kbd-1")
  await expect(page.locator("[data-example-root]")).toBeVisible()
  await expect(page.getByText("Loading example…")).toHaveCount(0)
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
  ).toBe(true)
}

test("kbd renders semantic keys and grouped shortcuts without fake interaction", async ({
  page,
}) => {
  const expectNoFailures = monitorPage(page)
  await openExample(page)

  const keys = page.locator('[data-slot="kbd"]')
  const groups = page.locator('[data-slot="kbd-group"]')
  await expect(keys).toHaveCount(12)
  await expect(groups).toHaveCount(3)
  await expect(groups.nth(0)).toHaveText("⌘K")
  await expect(groups.nth(1)).toHaveText("⌘ShiftP")
  await expect(groups.nth(2)).toHaveText("CtrlAltDelete")
  await expect(keys.first()).toHaveJSProperty("tagName", "KBD")
  await expect(groups.first()).toHaveJSProperty("tagName", "KBD")
  expect(
    await page
      .locator("kbd")
      .evaluateAll((elements) =>
        elements.every((element) => (element as HTMLElement).tabIndex === -1),
      ),
  ).toBe(true)

  expectNoFailures()
})

test("@full-a11y kbd shortcut rendering passes axe", async ({ page }) => {
  const expectNoFailures = monitorPage(page)
  await openExample(page)

  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations).toEqual([])
  expectNoFailures()
})
