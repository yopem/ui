import type { Page } from "@playwright/test"

import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

const assetTypes = new Set(["font", "image", "script", "stylesheet"])

function captureFailures(page: Page) {
  const failures: string[] = []
  page.on("console", (message) => {
    if (message.type() === "error") failures.push(`console: ${message.text()}`)
  })
  page.on("pageerror", (error) => failures.push(`page: ${error.message}`))
  page.on("requestfailed", (request) => {
    if (
      /localhost|127\.0\.0\.1/.test(request.url()) &&
      assetTypes.has(request.resourceType())
    ) {
      failures.push(
        `request: ${request.url()} ${request.failure()?.errorText ?? "failed"}`,
      )
    }
  })
  page.on("response", (response) => {
    if (
      /localhost|127\.0\.0\.1/.test(response.url()) &&
      response.status() >= 400 &&
      assetTypes.has(response.request().resourceType())
    ) {
      failures.push(`asset: ${response.status()} ${response.url()}`)
    }
  })
  return failures
}

async function openExample(page: Page, example: string) {
  await page.goto(`/examples/${example}`, { waitUntil: "domcontentloaded" })
  const root = page.locator("[data-example-root]")
  await expect(root).toBeVisible({ timeout: 30_000 })
  await expect(page.getByText("Loading example…")).toHaveCount(0, {
    timeout: 30_000,
  })
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
  ).toBe(true)
}

async function expectNoAxeViolations(page: Page) {
  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations).toEqual([])
}

const examples = [
  "p-checkbox-1",
  "p-checkbox-2",
  "p-checkbox-3",
  "p-checkbox-4",
  "p-checkbox-5",
] as const

test("checkbox renders every documented example responsively and cleanly", async ({
  page,
}) => {
  test.setTimeout(360_000)
  const failures = captureFailures(page)
  for (const example of examples) {
    await openExample(page, example)
    await expect(
      page.locator('[data-slot="checkbox"]').filter({ visible: true }).first(),
    ).toBeVisible()
  }

  await openExample(page, "p-checkbox-1")
  const checkbox = page.getByRole("checkbox", {
    name: "Accept terms and conditions",
  })
  await expect(checkbox).not.toBeChecked()
  await checkbox.click()
  await expect(checkbox).toBeChecked()
  await checkbox.press("Space")
  await expect(checkbox).not.toBeChecked()

  await openExample(page, "p-checkbox-2")
  const disabled = page.getByRole("checkbox")
  await expect(disabled).toBeChecked()
  await expect(disabled).toBeDisabled()
  await page.keyboard.press("Tab")
  await expect(disabled).not.toBeFocused()
  await expect(disabled).toBeChecked()

  await openExample(page, "p-checkbox-5")
  await expect(page.getByRole("checkbox")).toBeChecked()
  expect(failures).toEqual([])
})

test("@full-a11y checkbox examples and changed states have no violations", async ({
  page,
}) => {
  test.setTimeout(600_000)
  const failures = captureFailures(page)
  for (const example of examples) {
    await openExample(page, example)
    await expect(
      page.locator('[data-slot="checkbox"]').filter({ visible: true }).first(),
    ).toBeVisible()
    await expectNoAxeViolations(page)
  }

  await openExample(page, "p-checkbox-1")
  await page.getByRole("checkbox").press("Space")
  await expect(page.getByRole("checkbox")).toBeChecked()
  await expectNoAxeViolations(page)
  expect(failures).toEqual([])
})
