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
  "p-autocomplete-1",
  "p-autocomplete-2",
  "p-autocomplete-3",
  "p-autocomplete-4",
  "p-autocomplete-5",
  "p-autocomplete-6",
  "p-autocomplete-7",
  "p-autocomplete-8",
  "p-autocomplete-9",
  "p-autocomplete-10",
  "p-autocomplete-11",
  "p-autocomplete-12",
  "p-autocomplete-13",
  "p-autocomplete-14",
  "p-autocomplete-15",
  "p-autocomplete-16",
] as const

test("autocomplete renders every documented example responsively and cleanly", async ({
  page,
}) => {
  test.setTimeout(360_000)
  const failures = captureFailures(page)
  for (const example of examples) {
    await openExample(page, example)
    await expect(
      page
        .locator('[data-slot="autocomplete-input"]')
        .filter({ visible: true })
        .first(),
    ).toBeVisible()
  }

  await openExample(page, "p-autocomplete-1")
  const input = page.getByRole("combobox", { name: "Search items" })
  await input.fill("ap")
  const popup = page.locator('[data-slot="autocomplete-popup"]')
  await expect(popup).toBeVisible()
  await expect(
    popup.getByRole("option", { exact: true, name: "Apple" }),
  ).toBeVisible()
  await input.press("ArrowDown")
  await input.press("Enter")
  await expect(input).toHaveValue("Apple")
  await input.fill("not-a-fruit")
  await expect(page.getByText("No items found.")).toBeVisible()
  await input.fill("ban")
  await popup.getByRole("option", { exact: true, name: "Banana" }).click()
  await expect(input).toHaveValue("Banana")

  await openExample(page, "p-autocomplete-2")
  const disabled = page.getByRole("combobox", { name: "Search items" })
  await expect(disabled).toBeDisabled()
  await page.keyboard.press("Tab")
  await expect(disabled).not.toBeFocused()
  await expect(page.locator('[data-slot="autocomplete-popup"]')).toBeHidden()

  await openExample(page, "p-autocomplete-13")
  const formInput = page.getByRole("combobox", { name: "Favorite item" })
  const submit = page.getByRole("button", { name: "Submit" })
  await formInput.fill("a")
  await expect(submit).toBeDisabled()
  await page.keyboard.press("Escape")
  await expect(submit).toBeEnabled()
  expect(failures).toEqual([])
})

test("@full-a11y autocomplete examples and changed states have no violations", async ({
  page,
}) => {
  test.setTimeout(600_000)
  const failures = captureFailures(page)
  for (const example of examples) {
    await openExample(page, example)
    const input = page
      .locator('[data-slot="autocomplete-input"]')
      .filter({ visible: true })
      .first()
    await expect(input).toBeVisible()
    await expectNoAxeViolations(page)
    if (await input.isDisabled()) continue
    await input.fill("a")
    await expect(
      page
        .locator('[data-slot="autocomplete-popup"]')
        .filter({ visible: true })
        .first(),
    ).toBeVisible()
    await expectNoAxeViolations(page)
  }

  await openExample(page, "p-autocomplete-1")
  const input = page.getByRole("combobox", { name: "Search items" })
  await input.fill("ap")
  await expect(page.locator('[data-slot="autocomplete-popup"]')).toBeVisible()
  await expectNoAxeViolations(page)
  await input.fill("missing")
  await expect(page.getByText("No items found.")).toBeVisible()
  await expectNoAxeViolations(page)
  expect(failures).toEqual([])
})
