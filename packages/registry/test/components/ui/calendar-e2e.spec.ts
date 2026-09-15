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
  "p-calendar-1",
  "p-calendar-2",
  "p-calendar-3",
  "p-calendar-4",
  "p-calendar-5",
  "p-calendar-6",
  "p-calendar-7",
  "p-calendar-8",
  "p-calendar-9",
  "p-calendar-10",
  "p-calendar-11",
  "p-calendar-12",
  "p-calendar-13",
  "p-calendar-14",
  "p-calendar-15",
  "p-calendar-16",
  "p-calendar-17",
  "p-calendar-18",
  "p-calendar-19",
  "p-calendar-20",
  "p-calendar-21",
  "p-calendar-22",
  "p-calendar-23",
  "p-calendar-24",
  "p-calendar-25",
] as const

test("calendar renders every documented example responsively and cleanly", async ({
  page,
}) => {
  test.setTimeout(360_000)
  const failures = captureFailures(page)
  for (const example of examples) {
    await openExample(page, example)
    await expect(
      page.locator(".rdp-root").filter({ visible: true }).first(),
    ).toBeVisible()
  }

  await openExample(page, "p-calendar-5")
  await expect(page.getByRole("combobox")).toHaveCount(2)
  for (const dropdown of await page.getByRole("combobox").all()) {
    await expect(dropdown).not.toHaveAccessibleName("")
  }

  await openExample(page, "p-calendar-6")
  await expect(page.getByRole("combobox", { name: /month/i })).toBeVisible()
  await expect(page.getByRole("combobox", { name: /year/i })).toBeVisible()

  await openExample(page, "p-calendar-1")
  const grid = page.getByRole("grid")
  await expect(grid).toBeVisible()
  const selected = grid.locator('[data-selected="true"] button').first()
  await expect(selected).toBeVisible()
  await selected.focus()
  await selected.press("ArrowRight")
  const focused = grid.locator("button:focus")
  await expect(focused).toBeVisible()
  await focused.press("Enter")
  await expect(focused.locator("xpath=..")).toHaveAttribute(
    "data-selected",
    "true",
  )
  const before = await grid.getAttribute("aria-label")
  await page.getByRole("button", { name: /next month/i }).click()
  await expect(grid).not.toHaveAttribute("aria-label", before ?? "")

  await openExample(page, "p-calendar-7")
  await expect(
    page.locator('[data-disabled="true"] button').first(),
  ).toBeDisabled()
  expect(failures).toEqual([])
})

test("@full-a11y calendar examples and changed states have no violations", async ({
  page,
}) => {
  test.setTimeout(600_000)
  const failures = captureFailures(page)
  for (const example of examples) {
    await openExample(page, example)
    await expect(
      page.locator(".rdp-root").filter({ visible: true }).first(),
    ).toBeVisible()
    await expectNoAxeViolations(page)
  }

  await openExample(page, "p-calendar-1")
  const selected = page.locator('[data-selected="true"] button').first()
  await selected.focus()
  await selected.press("ArrowRight")
  await page.locator("button:focus").press("Enter")
  await expectNoAxeViolations(page)
  expect(failures).toEqual([])
})
