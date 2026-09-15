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

const examples = ["p-fieldset-1"] as const

test("fieldset renders every documented example responsively and cleanly", async ({
  page,
}) => {
  test.setTimeout(360_000)
  const failures = captureFailures(page)
  for (const example of examples) {
    await openExample(page, example)
    await expect(
      page.locator('[data-slot="fieldset"]').filter({ visible: true }).first(),
    ).toBeVisible()
  }

  const fieldset = page.getByRole("group", { name: "Billing Details" })
  await expect(fieldset.locator('[data-slot="fieldset-legend"]')).toHaveText(
    "Billing Details",
  )
  const company = fieldset.getByRole("textbox", { name: "Company" })
  const taxId = fieldset.getByRole("textbox", { name: "Tax ID" })
  await company.fill("Yopem")
  await taxId.fill("123-456")
  await expect(company).toHaveValue("Yopem")
  await expect(taxId).toHaveValue("123-456")
  await company.press("Tab")
  await expect(taxId).toBeFocused()
  expect(failures).toEqual([])
})

test("@full-a11y fieldset examples and changed states have no violations", async ({
  page,
}) => {
  test.setTimeout(600_000)
  const failures = captureFailures(page)
  for (const example of examples) {
    await openExample(page, example)
    await expect(
      page.locator('[data-slot="fieldset"]').filter({ visible: true }).first(),
    ).toBeVisible()
    await expectNoAxeViolations(page)
  }

  expect(failures).toEqual([])
})
