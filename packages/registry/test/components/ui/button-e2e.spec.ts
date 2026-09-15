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
  "p-button-1",
  "p-button-2",
  "p-button-3",
  "p-button-4",
  "p-button-5",
  "p-button-6",
  "p-button-7",
  "p-button-8",
  "p-button-9",
  "p-button-10",
  "p-button-11",
  "p-button-12",
  "p-button-13",
  "p-button-14",
  "p-button-15",
  "p-button-16",
  "p-button-17",
  "p-button-18",
  "p-button-19",
  "p-button-20",
  "p-button-21",
  "p-button-22",
  "p-button-23",
  "p-button-24",
  "p-button-26",
  "p-button-27",
  "p-button-28",
  "p-button-29",
  "p-button-30",
  "p-button-31",
  "p-button-32",
  "p-button-33",
  "p-button-34",
  "p-button-35",
  "p-button-36",
  "p-button-37",
  "p-button-38",
  "p-button-39",
  "p-button-40",
  "p-button-41",
] as const

test("button renders every documented example responsively and cleanly", async ({
  page,
}) => {
  test.setTimeout(360_000)
  const failures = captureFailures(page)
  for (const example of examples) {
    await openExample(page, example)
    await expect(
      page.locator('[data-slot="button"]').filter({ visible: true }).first(),
    ).toBeVisible()
  }

  const variants = [
    ["p-button-1", "default"],
    ["p-button-2", "outline"],
    ["p-button-3", "secondary"],
    ["p-button-4", "destructive"],
    ["p-button-5", "destructive-outline"],
    ["p-button-6", "ghost"],
    ["p-button-7", "link"],
  ] as const
  const variantClasses = new Set<string>()
  for (const [example] of variants) {
    await openExample(page, example)
    const button = page.locator('[data-slot="button"]')
    await expect(button).toBeVisible()
    variantClasses.add((await button.getAttribute("class")) ?? "")
  }
  expect(variantClasses.size).toBe(variants.length)
  await openExample(page, "p-button-12")
  await expect(page.getByRole("button", { name: "Button" })).toBeDisabled()

  await openExample(page, "p-button-17")
  await expect(page.getByRole("link", { name: "Home" })).toHaveAttribute(
    "data-slot",
    "button",
  )

  await openExample(page, "p-button-19")
  const toggle = page.locator('[aria-controls="expandable-content"]')
  await expect(toggle).toHaveAccessibleName("Show more")
  await toggle.press("Enter")
  await expect(toggle).toHaveAttribute("aria-expanded", "true")
  await expect(toggle).toHaveAccessibleName("Show less")
  await expect(page.locator("#expandable-content")).toHaveText(
    "Additional content",
  )

  await openExample(page, "p-button-41")
  const loading = page.getByRole("button")
  await loading.click()
  await expect(loading).toBeDisabled()
  await expect(loading).toHaveAttribute("data-loading", "")
  expect(failures).toEqual([])
})

test("@full-a11y button examples and changed states have no violations", async ({
  page,
}) => {
  test.setTimeout(600_000)
  const failures = captureFailures(page)
  for (const example of examples) {
    await openExample(page, example)
    await expect(
      page.locator('[data-slot="button"]').filter({ visible: true }).first(),
    ).toBeVisible()
    await expectNoAxeViolations(page)
  }

  await openExample(page, "p-button-19")
  const toggle = page.locator('[aria-controls="expandable-content"]')
  await toggle.click()
  await expect(toggle).toHaveAttribute("aria-expanded", "true")
  await expectNoAxeViolations(page)
  await openExample(page, "p-button-41")
  await page.getByRole("button").click()
  await expect(
    page.locator('[data-slot="button-loading-indicator"]'),
  ).toBeVisible()
  await expectNoAxeViolations(page)
  expect(failures).toEqual([])
})
