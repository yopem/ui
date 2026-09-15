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
  "p-checkbox-group-1",
  "p-checkbox-group-2",
  "p-checkbox-group-3",
  "p-checkbox-group-4",
  "p-checkbox-group-5",
] as const

test("checkbox-group renders every documented example responsively and cleanly", async ({
  page,
}) => {
  test.setTimeout(360_000)
  const failures = captureFailures(page)
  for (const example of examples) {
    await openExample(page, example)
    await expect(
      page.locator('[role="group"]').filter({ visible: true }).first(),
    ).toBeVisible()
  }

  await openExample(page, "p-checkbox-group-1")
  const group = page.getByRole("group", { name: "Select frameworks" })
  const next = group.getByRole("checkbox", { name: "Next.js" })
  const vite = group.getByRole("checkbox", { name: "Vite" })
  const astro = group.getByRole("checkbox", { name: "Astro" })
  await expect(next).toBeChecked()
  await vite.click()
  await expect(vite).toBeChecked()
  await astro.press("Space")
  await expect(astro).toBeChecked()

  await openExample(page, "p-checkbox-group-2")
  const nextDisabledExample = page.getByRole("checkbox", { name: "Next.js" })
  const disabled = page.getByRole("checkbox", { name: "Vite" })
  const astroDisabledExample = page.getByRole("checkbox", { name: "Astro" })
  await expect(disabled).toBeDisabled()
  await nextDisabledExample.focus()
  await nextDisabledExample.press("Tab")
  await expect(astroDisabledExample).toBeFocused()
  await expect(disabled).not.toBeChecked()
  expect(failures).toEqual([])
})

test("@full-a11y checkbox-group examples and changed states have no violations", async ({
  page,
}) => {
  test.setTimeout(600_000)
  const failures = captureFailures(page)
  for (const example of examples) {
    await openExample(page, example)
    await expect(
      page.locator('[role="group"]').filter({ visible: true }).first(),
    ).toBeVisible()
    await expectNoAxeViolations(page)
  }

  await openExample(page, "p-checkbox-group-1")
  await page.getByRole("checkbox", { name: "Vite" }).click()
  await page.getByRole("checkbox", { name: "Astro" }).press("Space")
  await expectNoAxeViolations(page)
  expect(failures).toEqual([])
})
