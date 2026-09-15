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
  "p-field-1",
  "p-field-2",
  "p-field-3",
  "p-field-4",
  "p-field-5",
  "p-field-6",
  "p-field-7",
  "p-field-8",
  "p-field-9",
  "p-field-10",
  "p-field-11",
  "p-field-12",
  "p-field-13",
  "p-field-14",
  "p-field-15",
  "p-field-16",
  "p-field-17",
  "p-field-18",
] as const

test("field renders every documented example responsively and cleanly", async ({
  page,
}) => {
  test.setTimeout(360_000)
  const failures = captureFailures(page)
  for (const example of examples) {
    await openExample(page, example)
    await expect(
      page.locator('[data-slot="field"]').filter({ visible: true }).first(),
    ).toBeVisible()
  }

  await openExample(page, "p-field-1")
  const input = page.getByRole("textbox", { name: "Name" })
  await input.fill("Ada Lovelace")
  await expect(input).toHaveValue("Ada Lovelace")
  await expect(page.locator('[data-slot="field-description"]')).toHaveText(
    "Visible on your profile",
  )

  await openExample(page, "p-field-3")
  await expect(page.getByRole("textbox", { name: "Email" })).toBeDisabled()

  await openExample(page, "p-field-18")
  await page.getByRole("button", { name: "Submit" }).click()
  await expect(page.locator('[aria-invalid="true"]')).toHaveCount(2)
  await expect(page.getByText("Please enter a valid name.")).toBeVisible()
  await expect(page.getByText("Please enter a valid email.")).toBeVisible()
  expect(failures).toEqual([])
})

test("@full-a11y field examples and changed states have no violations", async ({
  page,
}) => {
  test.setTimeout(600_000)
  const failures = captureFailures(page)
  for (const example of examples) {
    await openExample(page, example)
    await expect(
      page.locator('[data-slot="field"]').filter({ visible: true }).first(),
    ).toBeVisible()
    await expectNoAxeViolations(page)
  }

  await openExample(page, "p-field-18")
  await page.getByRole("button", { name: "Submit" }).click()
  await expect(page.locator('[aria-invalid="true"]')).toHaveCount(2)
  await expectNoAxeViolations(page)
  expect(failures).toEqual([])
})
