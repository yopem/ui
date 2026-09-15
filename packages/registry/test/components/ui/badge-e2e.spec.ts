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
  "p-badge-1",
  "p-badge-2",
  "p-badge-3",
  "p-badge-4",
  "p-badge-5",
  "p-badge-6",
  "p-badge-7",
  "p-badge-8",
  "p-badge-9",
  "p-badge-10",
  "p-badge-11",
  "p-badge-12",
  "p-badge-13",
  "p-badge-14",
  "p-badge-15",
  "p-badge-16",
  "p-badge-17",
  "p-badge-18",
  "p-badge-19",
  "p-badge-20",
] as const

test("badge renders every documented example responsively and cleanly", async ({
  page,
}) => {
  test.setTimeout(360_000)
  const failures = captureFailures(page)
  for (const example of examples) {
    await openExample(page, example)
    await expect(
      page.locator('[data-slot="badge"]').filter({ visible: true }).first(),
    ).toBeVisible()
  }

  const variants = [
    "default",
    "outline",
    "secondary",
    "destructive",
    "info",
    "success",
    "warning",
    "error",
  ] as const
  for (const [index, variant] of variants.entries()) {
    await openExample(page, `p-badge-${index + 1}`)
    await expect(page.locator('[data-slot="badge"]')).toHaveAttribute(
      "data-variant",
      variant,
    )
  }
  await openExample(page, "p-badge-12")
  await expect(page.getByRole("link", { name: "Home" })).toHaveAttribute(
    "data-slot",
    "badge",
  )

  await openExample(page, "p-badge-19")
  const checkbox = page.getByRole("checkbox", { name: "Selectable" })
  await expect(checkbox).toBeChecked()
  await checkbox.press("Space")
  await expect(checkbox).not.toBeChecked()

  await openExample(page, "p-badge-20")
  const badge = page.locator('[data-slot="badge"]')
  await badge.getByRole("button", { name: "Remove badge" }).click()
  await expect(badge).toHaveCount(0)
  expect(failures).toEqual([])
})

test("@full-a11y badge examples and changed states have no violations", async ({
  page,
}) => {
  test.setTimeout(600_000)
  const failures = captureFailures(page)
  for (const example of examples) {
    await openExample(page, example)
    await expect(
      page.locator('[data-slot="badge"]').filter({ visible: true }).first(),
    ).toBeVisible()
    await expectNoAxeViolations(page)
  }

  await openExample(page, "p-badge-19")
  const checkbox = page.getByRole("checkbox", { name: "Selectable" })
  await checkbox.press("Space")
  await expect(checkbox).not.toBeChecked()
  await expectNoAxeViolations(page)
  expect(failures).toEqual([])
})
