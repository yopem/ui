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
  "p-combobox-1",
  "p-combobox-2",
  "p-combobox-3",
  "p-combobox-4",
  "p-combobox-5",
  "p-combobox-6",
  "p-combobox-7",
  "p-combobox-8",
  "p-combobox-9",
  "p-combobox-10",
  "p-combobox-11",
  "p-combobox-12",
  "p-combobox-13",
  "p-combobox-14",
  "p-combobox-15",
  "p-combobox-16",
  "p-combobox-17",
  "p-combobox-18",
  "p-combobox-19",
  "p-combobox-20",
] as const

test("combobox renders every documented example responsively and cleanly", async ({
  page,
}) => {
  test.setTimeout(360_000)
  const failures = captureFailures(page)
  for (const example of examples) {
    await openExample(page, example)
    await expect(
      page
        .locator(
          '[data-slot="combobox-input"], [data-slot="combobox-chips-input"], [data-slot="combobox-trigger"]',
        )
        .filter({ visible: true })
        .first(),
    ).toBeVisible()
  }

  await openExample(page, "p-combobox-1")
  const input = page.getByRole("combobox", { name: "Select a item" })
  await input.click()
  await input.fill("ap")
  const listbox = page.getByRole("listbox")
  await expect(listbox).toBeVisible()
  await expect(
    listbox.getByRole("option", { exact: true, name: "Apple" }),
  ).toBeVisible()
  await input.press("ArrowDown")
  await input.press("Enter")
  await expect(input).toHaveValue("Apple")
  await input.click()
  await input.fill("ban")
  await listbox.getByRole("option", { exact: true, name: "Banana" }).click()
  await expect(input).toHaveValue("Banana")

  await openExample(page, "p-combobox-2")
  await expect(page.getByRole("combobox")).toBeDisabled()

  await openExample(page, "p-combobox-11")
  await page.getByRole("button", { name: "Submit" }).click()
  await expect(page.getByText("Please select a item.")).toBeVisible()
  await expect(page.getByRole("combobox")).toHaveAttribute(
    "aria-invalid",
    "true",
  )
  expect(failures).toEqual([])
})

test("@full-a11y combobox examples and changed states have no violations", async ({
  page,
}) => {
  test.setTimeout(600_000)
  const failures = captureFailures(page)
  for (const example of examples) {
    await openExample(page, example)
    const input = page
      .locator(
        '[data-slot="combobox-input"], [data-slot="combobox-chips-input"], [data-slot="combobox-trigger"]',
      )
      .filter({ visible: true })
      .first()
    await expect(input).toBeVisible()
    await expectNoAxeViolations(page)
    if (await input.isDisabled()) continue
    await input.click()
    if (await input.isEditable()) await input.fill("a")
    await expect(page.getByRole("listbox")).toBeVisible()
    await expectNoAxeViolations(page)
  }

  await openExample(page, "p-combobox-1")
  const input = page.getByRole("combobox", { name: "Select a item" })
  await input.click()
  await input.fill("ap")
  await expect(page.getByRole("listbox")).toBeVisible()
  await expectNoAxeViolations(page)
  await openExample(page, "p-combobox-11")
  await page.getByRole("button", { name: "Submit" }).click()
  await expect(page.locator('[aria-invalid="true"]')).toBeVisible()
  await expectNoAxeViolations(page)
  expect(failures).toEqual([])
})
