import type { Page } from "@playwright/test"

import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

function monitorPage(page: Page) {
  const failures: string[] = []
  page.on("console", (message) => {
    if (message.type() === "error") failures.push(`console: ${message.text()}`)
  })
  page.on("pageerror", (error) => failures.push(`page: ${error.message}`))
  page.on("requestfailed", (request) => {
    const url = new URL(request.url())
    if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
      failures.push(
        `request: ${request.url()} ${request.failure()?.errorText ?? "failed"}`,
      )
    }
  })
  page.on("response", (response) => {
    const url = new URL(response.url())
    const assets = new Set(["font", "image", "script", "stylesheet"])
    if (
      (url.hostname === "localhost" || url.hostname === "127.0.0.1") &&
      response.status() >= 400 &&
      assets.has(response.request().resourceType())
    ) {
      failures.push(`asset: ${response.status()} ${response.url()}`)
    }
  })
  return function expectNoFailures() {
    expect(failures).toEqual([])
  }
}

async function openExample(page: Page, number: number) {
  await page.goto(`/examples/p-progress-${number}`)
  await expect(page.locator("[data-example-root]")).toBeVisible()
  await expect(page.getByText("Loading example…")).toHaveCount(0)
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

test.describe.configure({ timeout: 120_000 })

test("progress renders default, labeled, and custom-range states", async ({
  page,
}) => {
  const expectNoFailures = monitorPage(page)

  await openExample(page, 1)
  const uploadProgress = page.getByRole("progressbar", {
    name: "Upload progress",
  })
  await expect(uploadProgress).toHaveAttribute("aria-valuemin", "0")
  await expect(uploadProgress).toHaveAttribute("aria-valuemax", "100")
  const initialValue = Number(
    await uploadProgress.getAttribute("aria-valuenow"),
  )
  await expect
    .poll(async () =>
      Number(await uploadProgress.getAttribute("aria-valuenow")),
    )
    .toBeGreaterThan(initialValue)

  await openExample(page, 2)
  const exportProgress = page.getByRole("progressbar", { name: "Export data" })
  await expect(exportProgress).toHaveAttribute("aria-valuenow", "60")
  await expect(page.locator('[data-slot="progress-value"]')).toContainText("60")
  await expect(page.locator('[data-slot="progress-track"]')).toBeVisible()
  await expect(page.locator('[data-slot="progress-indicator"]')).toBeVisible()

  await openExample(page, 3)
  const customProgress = page.getByRole("progressbar", { name: "Upload" })
  await expect(customProgress).toHaveAttribute("aria-valuemax", "512")
  await expect(customProgress).toHaveAttribute("aria-valuenow", "502")
  await expect(page.getByText("502 / 512")).toBeVisible()
  await expect(
    page.locator(
      '[data-example-root] button, [data-example-root] input, [data-example-root] [tabindex="0"]',
    ),
  ).toHaveCount(0)

  expectNoFailures()
})

test("@full-a11y progress initial and changing states pass axe", async ({
  page,
}) => {
  const expectNoFailures = monitorPage(page)

  for (const number of [1, 2, 3]) {
    await openExample(page, number)
    await expectNoAxeViolations(page)
  }

  await openExample(page, 1)
  const progress = page.getByRole("progressbar", { name: "Upload progress" })
  const initialValue = Number(await progress.getAttribute("aria-valuenow"))
  await expect
    .poll(async () => Number(await progress.getAttribute("aria-valuenow")))
    .toBeGreaterThan(initialValue)
  await expectNoAxeViolations(page)

  expectNoFailures()
})
