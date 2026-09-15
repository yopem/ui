import type { Page } from "@playwright/test"

import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

test.describe.configure({ timeout: 120_000 })

function isLocalUrl(url: string) {
  try {
    const hostname = new URL(url).hostname
    return hostname === "localhost" || hostname === "127.0.0.1"
  } catch {
    return false
  }
}

function watchPage(page: Page) {
  const failures: string[] = []
  const assetTypes = new Set(["font", "image", "script", "stylesheet"])

  page.on("console", (message) => {
    if (message.type() === "error") failures.push(`console: ${message.text()}`)
  })
  page.on("pageerror", (error) => failures.push(`page: ${error.message}`))
  page.on("requestfailed", (request) => {
    if (isLocalUrl(request.url())) {
      failures.push(
        `request: ${request.url()} ${request.failure()?.errorText ?? "failed"}`,
      )
    }
  })
  page.on("response", (response) => {
    if (
      isLocalUrl(response.url()) &&
      response.status() >= 400 &&
      assetTypes.has(response.request().resourceType())
    ) {
      failures.push(`asset: ${response.status()} ${response.url()}`)
    }
  })

  return function expectCleanPage() {
    expect(failures).toEqual([])
  }
}

async function openExample(page: Page, name: string) {
  await page.goto(`/examples/${name}`)
  await expect(page.locator("[data-example-root]")).toBeVisible({
    timeout: 30_000,
  })
  await expect(page.getByText("Loading example…")).toHaveCount(0, {
    timeout: 30_000,
  })
  const viewportFits = await page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth + 1,
  )
  expect(viewportFits).toBe(true)
}

async function expectNoAxeViolations(page: Page) {
  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations).toEqual([])
}

test("skeleton renders stable shapes and transitions to loaded content", async ({
  page,
}) => {
  const expectCleanPage = watchPage(page)
  await openExample(page, "p-skeleton-2")
  const staticSkeletons = page.locator('[data-slot="skeleton"]')
  await expect(staticSkeletons).toHaveCount(5)
  for (const skeleton of await staticSkeletons.all()) {
    const box = await skeleton.boundingBox()
    expect(box?.width ?? 0).toBeGreaterThan(0)
    expect(box?.height ?? 0).toBeGreaterThan(0)
    await expect(skeleton).not.toHaveAttribute("role", /.+/)
  }

  await openExample(page, "p-skeleton-1")
  await expect(page.locator('[data-slot="skeleton"]')).toHaveCount(15)
  await expect(page.getByText("Sarah Johnson")).toBeVisible({ timeout: 5_000 })
  await expect(page.getByText("Alex Rivera")).toBeVisible({ timeout: 5_000 })
  await expect(page.getByText("Mark Bennett Andersson")).toBeVisible({
    timeout: 5_000,
  })
  await expect(page.locator('[data-slot="skeleton"]')).toHaveCount(0)
  expectCleanPage()
})

test("@full-a11y skeleton passes axe in loading and loaded states", async ({
  page,
}) => {
  const expectCleanPage = watchPage(page)
  await openExample(page, "p-skeleton-1")
  await expect(page.locator('[data-slot="skeleton"]')).toHaveCount(15)
  await expectNoAxeViolations(page)
  await expect(page.locator('[data-slot="skeleton"]')).toHaveCount(0, {
    timeout: 5_000,
  })
  await expectNoAxeViolations(page)
  expectCleanPage()
})
