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
  "p-dialog-1",
  "p-dialog-2",
  "p-dialog-3",
  "p-dialog-4",
  "p-dialog-5",
  "p-dialog-6",
] as const

test("dialog renders every documented example responsively and cleanly", async ({
  page,
}) => {
  test.setTimeout(360_000)
  const failures = captureFailures(page)
  for (const example of examples) {
    await openExample(page, example)
    await expect(
      page.locator("button").filter({ visible: true }).first(),
    ).toBeVisible()
  }

  await openExample(page, "p-dialog-1")
  const trigger = page.getByRole("button", { name: "Open Dialog" })
  await trigger.press("Enter")
  const dialog = page.getByRole("dialog")
  await expect(dialog).toBeVisible()
  await expect(dialog).toContainText("Edit profile")
  await expect(dialog.locator(":focus")).toHaveCount(1)
  await page.keyboard.press("Escape")
  await expect(dialog).toBeHidden()
  await expect(trigger).toBeFocused()
  await trigger.click()
  await dialog.getByRole("button", { name: "Cancel" }).click()
  await expect(dialog).toBeHidden()

  await openExample(page, "p-dialog-2")
  await page.getByRole("button", { name: "Open menu" }).click()
  await page.getByRole("menuitem", { name: "Open dialog" }).click()
  await expect(page.getByRole("dialog")).toContainText(
    "Change your preferences",
  )
  expect(failures).toEqual([])
})

test("@full-a11y dialog examples and changed states have no violations", async ({
  page,
}) => {
  test.setTimeout(600_000)
  const failures = captureFailures(page)
  for (const example of examples) {
    await openExample(page, example)
    await expect(
      page.locator("button").filter({ visible: true }).first(),
    ).toBeVisible()
    await expectNoAxeViolations(page)
    const trigger = page
      .locator('[data-slot="dialog-trigger"]')
      .filter({ visible: true })
      .first()
    if (await trigger.count()) {
      await trigger.click()
      await expect(page.getByRole("dialog")).toBeVisible()
      await expectNoAxeViolations(page)
      await page.keyboard.press("Escape")
      await expect(page.getByRole("dialog")).toBeHidden()
    }
  }

  await openExample(page, "p-dialog-2")
  await page.getByRole("button", { name: "Open menu" }).click()
  await page.getByRole("menuitem", { name: "Open dialog" }).click()
  await expect(page.getByRole("dialog")).toBeVisible()
  await expectNoAxeViolations(page)
  expect(failures).toEqual([])
})
