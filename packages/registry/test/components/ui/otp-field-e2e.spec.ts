import type { Locator, Page } from "@playwright/test"

import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

const examples = [1, 2, 3, 4, 6, 7, 8, 9, 10].map(
  (number) => `p-otp-field-${number}`,
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
    const assets = new Set(["font", "image", "script", "stylesheet"])
    if (
      isLocalUrl(response.url()) &&
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

async function enterCode(inputs: Locator, code: string) {
  await inputs.first().click()
  await inputs.first().pressSequentially(code)
  await expect
    .poll(() =>
      inputs.evaluateAll((items) =>
        items.map((item) => (item as HTMLInputElement).value).join(""),
      ),
    )
    .toBe(code)
}

async function expectNoAxeViolations(page: Page) {
  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations).toEqual([])
}

test.describe.configure({ timeout: 240_000 })

test("otp-field examples render every size, separator, validation, and mask", async ({
  page,
}) => {
  const expectNoFailures = monitorPage(page)

  for (const example of examples) {
    await openExample(page, example)
    await expect(page.locator('[data-slot="otp-field"]')).toBeVisible()
    await expect(
      page.locator('[data-slot="otp-field-input"]').first(),
    ).toBeVisible()
  }

  await openExample(page, "p-otp-field-3")
  await expect(
    page.locator('[data-slot="otp-field"] [data-slot="separator"]'),
  ).toBeVisible()

  await openExample(page, "p-otp-field-10")
  const masked = page.locator('[data-slot="otp-field-input"]')
  await enterCode(masked, "123456")
  expect(
    await masked.evaluateAll((inputs) =>
      inputs.every((input) => (input as HTMLInputElement).type === "password"),
    ),
  ).toBe(true)

  expectNoFailures()
})

test("otp-field advances focus, accepts codes, and supports backspace", async ({
  page,
}) => {
  const expectNoFailures = monitorPage(page)
  await openExample(page, "p-otp-field-1")

  const inputs = page.locator('[data-slot="otp-field-input"]')
  await expect(inputs).toHaveCount(6)
  await enterCode(inputs, "123456")
  await expect(inputs.last()).toBeFocused()
  await inputs.last().press("Backspace")
  await expect(inputs.last()).toHaveValue("")
  await inputs.last().press("Backspace")
  await expect(inputs.nth(4)).toBeFocused()
  await expect(inputs.nth(4)).toHaveValue("")

  expectNoFailures()
})

test("otp-field reports normalized, invalid, valid, and alphanumeric states", async ({
  page,
}) => {
  const expectNoFailures = monitorPage(page)

  await openExample(page, "p-otp-field-6")
  const tierInputs = page.locator('[data-slot="otp-field-input"]')
  await tierInputs.first().click()
  await tierInputs.first().press("9")
  await expect(
    page.getByText("Unsupported characters were ignored from 9."),
  ).toBeVisible()
  await expect(tierInputs.first()).toHaveAttribute("aria-invalid", "true")
  await expect(tierInputs.first()).toHaveValue("")

  await openExample(page, "p-otp-field-7")
  const validatedInputs = page.locator('[data-slot="otp-field-input"]')
  await enterCode(validatedInputs, "000000")
  await expect(page.getByText("Code must be 123456.")).toBeVisible()
  expect(
    await validatedInputs.evaluateAll((inputs) =>
      inputs.every((input) => input.getAttribute("aria-invalid") === "true"),
    ),
  ).toBe(true)
  await openExample(page, "p-otp-field-7")
  await enterCode(page.locator('[data-slot="otp-field-input"]'), "123456")
  await expect(page.getByText("Code verified.")).toBeVisible()

  await openExample(page, "p-otp-field-8")
  const recoveryInputs = page.locator('[data-slot="otp-field-input"]')
  await enterCode(recoveryInputs, "A7C9XZ")

  expectNoFailures()
})

test("@full-a11y otp-field examples and validation transitions pass axe", async ({
  page,
}) => {
  const expectNoFailures = monitorPage(page)

  for (const example of examples) {
    await openExample(page, example)
    await expectNoAxeViolations(page)
  }

  await openExample(page, "p-otp-field-7")
  const inputs = page.locator('[data-slot="otp-field-input"]')
  await enterCode(inputs, "000000")
  await expectNoAxeViolations(page)
  await openExample(page, "p-otp-field-7")
  await enterCode(page.locator('[data-slot="otp-field-input"]'), "123456")
  await expectNoAxeViolations(page)

  expectNoFailures()
})
