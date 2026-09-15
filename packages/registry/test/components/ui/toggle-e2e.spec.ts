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

test("toggle supports pointer, keyboard, variants, sizes, disabled, and controlled state", async ({
  page,
}) => {
  const expectCleanPage = watchPage(page)
  await openExample(page, "p-toggle-1")
  const toggle = page.getByRole("button", { name: "Toggle" })
  await expect(toggle).toHaveAttribute("aria-pressed", "false")
  await toggle.click()
  await expect(toggle).toHaveAttribute("aria-pressed", "true")
  await toggle.focus()
  await toggle.press("Space")
  await expect(toggle).toHaveAttribute("aria-pressed", "false")

  await openExample(page, "p-toggle-2")
  await expect(page.getByRole("button", { name: "Outline Toggle" })).toHaveCSS(
    "border-style",
    "solid",
  )

  const heights: number[] = []
  for (const example of ["p-toggle-4", "p-toggle-2", "p-toggle-5"]) {
    await openExample(page, example)
    const box = await page.locator('[data-slot="toggle"]').boundingBox()
    expect(box).not.toBeNull()
    heights.push(box?.height ?? 0)
  }
  expect(heights[0]).toBeLessThan(heights[1] ?? 0)
  expect(heights[1]).toBeLessThan(heights[2] ?? 0)

  await openExample(page, "p-toggle-6")
  await expect(page.getByRole("button", { name: "Disabled" })).toBeDisabled()

  await openExample(page, "p-toggle-8")
  const bookmark = page.getByRole("button", { name: "Bookmark this" })
  await bookmark.click()
  await expect(
    page.getByRole("button", { name: "Remove bookmark" }),
  ).toHaveAttribute("aria-pressed", "true")
  expectCleanPage()
})

test("@full-a11y toggle passes axe in pressed and unpressed states", async ({
  page,
}) => {
  const expectCleanPage = watchPage(page)
  await openExample(page, "p-toggle-3")
  const toggle = page.getByRole("button", { name: "Toggle bold" })
  await expectNoAxeViolations(page)
  await toggle.click()
  await expect(toggle).toHaveAttribute("aria-pressed", "true")
  await expectNoAxeViolations(page)
  expectCleanPage()
})
