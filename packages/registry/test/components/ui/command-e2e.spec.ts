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

const examples = ["p-command-1", "p-command-2"] as const

test("command renders every documented example responsively and cleanly", async ({
  page,
}) => {
  test.setTimeout(360_000)
  const failures = captureFailures(page)
  for (const example of examples) {
    await openExample(page, example)
    await expect(
      page
        .locator(
          ':is([data-slot="command-dialog-trigger"], [data-slot="command-list"], button)',
        )
        .filter({ visible: true })
        .first(),
    ).toBeVisible()
  }

  await openExample(page, "p-command-1")
  await page.keyboard.press("Control+j")
  const dialog = page.getByRole("dialog")
  await expect(dialog).toBeVisible()
  const input = dialog.getByPlaceholder("Search for apps and commands...")
  await expect(input).toBeFocused()
  await input.fill("Slack")
  await expect(dialog.getByRole("option", { name: /Slack/ })).toBeVisible()
  await input.press("ArrowDown")
  await input.press("Enter")
  await expect(dialog).toBeHidden()

  await page.getByRole("button", { name: /Open Command Palette/ }).click()
  await expect(dialog).toBeVisible()
  await page.keyboard.press("Escape")
  await expect(dialog).toBeHidden()

  await openExample(page, "p-command-2")
  await page.getByRole("button", { name: "Cmdk with AI" }).click()
  const aiDialog = page.getByRole("dialog")
  await expect(aiDialog).toBeVisible()
  await expect(
    aiDialog.getByPlaceholder("Type a command or search..."),
  ).toBeFocused()
  await page.keyboard.press("Escape")
  await expect(aiDialog).toBeHidden()
  expect(failures).toEqual([])
})

test("@full-a11y command examples and changed states have no violations", async ({
  page,
}) => {
  test.setTimeout(600_000)
  const failures = captureFailures(page)
  for (const example of examples) {
    await openExample(page, example)
    await expect(
      page
        .locator(
          ':is([data-slot="command-dialog-trigger"], [data-slot="command-list"], button)',
        )
        .filter({ visible: true })
        .first(),
    ).toBeVisible()
    await expectNoAxeViolations(page)
  }

  await openExample(page, "p-command-1")
  await page.getByRole("button", { name: /Open Command Palette/ }).click()
  const input = page.getByPlaceholder("Search for apps and commands...")
  await input.fill("Slack")
  await expect(page.getByRole("option", { name: /Slack/ })).toBeVisible()
  await expectNoAxeViolations(page)
  await input.fill("missing command")
  await expect(page.getByText("No results found.")).toBeVisible()
  await expectNoAxeViolations(page)

  await openExample(page, "p-command-2")
  await page.getByRole("button", { name: "Cmdk with AI" }).click()
  await expect(page.getByRole("dialog")).toBeVisible()
  await expectNoAxeViolations(page)
  expect(failures).toEqual([])
})
