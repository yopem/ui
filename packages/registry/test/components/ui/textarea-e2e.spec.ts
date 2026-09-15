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

test("textarea supports sizes, typing, max length, read-only, disabled, and invalid states", async ({
  page,
}) => {
  const expectCleanPage = watchPage(page)
  await openExample(page, "p-textarea-1")
  const textarea = page.getByPlaceholder("Type your message here")
  await textarea.focus()
  await textarea.fill("First line")
  await textarea.press("Enter")
  await textarea.pressSequentially("Second line")
  await expect(textarea).toHaveValue("First line\nSecond line")

  const heights: number[] = []
  for (const example of ["p-textarea-2", "p-textarea-1", "p-textarea-3"]) {
    await openExample(page, example)
    const box = await page.locator('[data-slot="textarea"]').boundingBox()
    expect(box).not.toBeNull()
    heights.push(box?.height ?? 0)
  }
  expect(heights[0]).toBeLessThan(heights[1] ?? 0)
  expect(heights[1]).toBeLessThan(heights[2] ?? 0)

  await openExample(page, "p-textarea-4")
  await expect(page.locator('[data-slot="textarea"]')).toBeDisabled()

  await openExample(page, "p-textarea-10")
  await expect(page.locator('[data-slot="textarea"]')).toHaveAttribute(
    "readonly",
    "",
  )
  await expect(page.locator('[data-slot="textarea"]')).toHaveValue(
    "This is a read-only textarea",
  )

  await openExample(page, "p-textarea-11")
  const limited = page.getByRole("textbox", { name: "Message" })
  await limited.fill("x".repeat(280))
  await expect(limited).toHaveValue("x".repeat(280))
  await limited.pressSequentially("overflow")
  await expect(limited).toHaveValue("x".repeat(280))
  await expect(page.getByText("0", { exact: true })).toBeVisible()

  await openExample(page, "p-textarea-6")
  await page.getByRole("button", { name: "Submit" }).click()
  const invalid = page.locator('[data-slot="textarea"]')
  await expect(invalid).toHaveAttribute("aria-invalid", "true")
  await expect(page.getByText("This field is required.")).toBeVisible()
  expectCleanPage()
})

test("@full-a11y textarea passes axe in empty, filled, and invalid states", async ({
  page,
}) => {
  const expectCleanPage = watchPage(page)
  await openExample(page, "p-textarea-5")
  await expectNoAxeViolations(page)
  await page.getByRole("textbox", { name: "Message" }).fill("Accessible text")
  await expectNoAxeViolations(page)
  await openExample(page, "p-textarea-6")
  await page.getByRole("button", { name: "Submit" }).click()
  await expect(page.locator('[data-slot="textarea"]')).toHaveAttribute(
    "aria-invalid",
    "true",
  )
  await expectNoAxeViolations(page)
  expectCleanPage()
})
