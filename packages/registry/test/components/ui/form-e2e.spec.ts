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

const examples = ["p-form-1", "p-form-2"] as const

test("form renders every documented example responsively and cleanly", async ({
  page,
}) => {
  test.setTimeout(360_000)
  const failures = captureFailures(page)
  for (const example of examples) {
    await openExample(page, example)
    await expect(
      page.locator('[data-slot="form"]').filter({ visible: true }).first(),
    ).toBeVisible()
  }

  await openExample(page, "p-form-1")
  const email = page.getByRole("textbox", { name: "Email" })
  await email.fill("invalid")
  await page.getByRole("button", { name: "Submit" }).click()
  await expect(email).toHaveAttribute("aria-invalid", "true")
  await expect(page.getByText("Please enter a valid email.")).toBeVisible()
  await email.fill("ada@example.com")
  await email.press("Tab")
  await expect(email).not.toHaveAttribute("aria-invalid", "true")

  await openExample(page, "p-form-2")
  await page.getByRole("button", { name: "Submit" }).click()
  await expect(page.getByText("Please enter a name.")).toBeVisible({
    timeout: 2_000,
  })
  await expect(page.getByText("Number must be positive.")).toBeVisible()
  expect(failures).toEqual([])
})

test("@full-a11y form examples and changed states have no violations", async ({
  page,
}) => {
  test.setTimeout(600_000)
  const failures = captureFailures(page)
  for (const example of examples) {
    await openExample(page, example)
    await expect(
      page.locator('[data-slot="form"]').filter({ visible: true }).first(),
    ).toBeVisible()
    await expectNoAxeViolations(page)
  }

  await openExample(page, "p-form-2")
  await page.getByRole("button", { name: "Submit" }).click()
  await expect(page.getByText("Please enter a name.")).toBeVisible({
    timeout: 2_000,
  })
  await expectNoAxeViolations(page)
  expect(failures).toEqual([])
})
