import type { Page } from "@playwright/test"

import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

const examples = Array.from(
  { length: 19 },
  (_, index) => `p-input-${index + 1}`,
)

function isLocalUrl(url: string) {
  try {
    const hostname = new URL(url).hostname
    return hostname === "localhost" || hostname === "127.0.0.1"
  } catch {
    return false
  }
}

function monitorPage(page: Page) {
  const failures: string[] = []
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
    const assetTypes = new Set(["font", "image", "script", "stylesheet"])
    if (
      isLocalUrl(response.url()) &&
      response.status() >= 400 &&
      assetTypes.has(response.request().resourceType())
    ) {
      failures.push(`asset: ${response.status()} ${response.url()}`)
    }
  })
  return function expectNoFailures() {
    expect(failures).toEqual([])
  }
}

async function openExample(page: Page, example: string) {
  await page.goto(`/examples/${example}`)
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

test.describe.configure({ timeout: 240_000 })

test("input examples render every size and state cleanly", async ({ page }) => {
  const expectNoFailures = monitorPage(page)

  for (const example of examples) {
    await openExample(page, example)
    await expect(page.locator("input").first()).toBeVisible()
  }

  expectNoFailures()
})

test("input supports typing, labels, limits, files, and disabled state", async ({
  page,
}) => {
  const expectNoFailures = monitorPage(page)

  await openExample(page, "p-input-1")
  const input = page.getByRole("textbox", { name: "Enter text" })
  await input.click()
  await input.fill("Registry input")
  await expect(input).toHaveValue("Registry input")
  await input.press("Home")
  await input.pressSequentially("Direct ")
  await expect(input).toHaveValue("Direct Registry input")

  await openExample(page, "p-input-4")
  const disabled = page.getByRole("textbox", { name: "Disabled" })
  await expect(disabled).toBeDisabled()
  await disabled.focus()
  await expect(disabled).not.toBeFocused()

  await openExample(page, "p-input-5")
  const file = page.getByLabel("File")
  await expect(file).toHaveAttribute("type", "file")
  await file.setInputFiles({
    buffer: Buffer.from("registry"),
    mimeType: "text/plain",
    name: "registry.txt",
  })
  await expect(file).toHaveValue(/registry\.txt$/)

  await openExample(page, "p-input-6")
  const email = page.getByRole("textbox", { name: "Email" })
  await page.getByText("Email", { exact: true }).click()
  await expect(email).toBeFocused()

  await openExample(page, "p-input-10")
  await expect(
    page.getByRole("button", { name: "Connection security details" }),
  ).toBeVisible()
  const favorite = page.getByRole("button", { name: "Favorite" })
  await expect(favorite).toHaveAttribute("aria-pressed", "false")
  await favorite.click()
  await expect(favorite).toHaveAttribute("aria-pressed", "true")

  await openExample(page, "p-input-17")
  const readOnly = page.getByRole("textbox", { name: "Read-only input" })
  await expect(readOnly).toHaveAttribute("readonly")
  await expect(readOnly).toHaveValue("This is a read-only input")

  await openExample(page, "p-input-18")
  const code = page.getByRole("textbox", { name: "Code" })
  await code.fill("123456789012345678")
  await expect(code).toHaveValue("12345678901234")
  await expect(page.getByText("0 characters left")).toBeVisible()

  expectNoFailures()
})

test("input size variants preserve distinct control heights", async ({
  page,
}) => {
  const expectNoFailures = monitorPage(page)
  const heights: number[] = []

  for (const example of ["p-input-2", "p-input-1", "p-input-3"]) {
    await openExample(page, example)
    const box = await page.locator("input").first().boundingBox()
    expect(box).not.toBeNull()
    heights.push(box?.height ?? 0)
  }

  expect(heights[0]).toBeLessThan(heights[1])
  expect(heights[1]).toBeLessThan(heights[2])
  expectNoFailures()
})

test("@full-a11y input examples pass axe in initial and edited states", async ({
  page,
}) => {
  const expectNoFailures = monitorPage(page)

  for (const example of examples) {
    await openExample(page, example)
    await expectNoAxeViolations(page)
  }

  await openExample(page, "p-input-13")
  const requiredEmail = page.getByRole("textbox", { name: /Email/ })
  await requiredEmail.fill("person@example.com")
  await requiredEmail.focus()
  await expectNoAxeViolations(page)

  expectNoFailures()
})
