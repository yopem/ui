import type { Page } from "@playwright/test"

import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

const examples = Array.from(
  { length: 11 },
  (_, index) => `p-number-field-${index + 1}`,
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

async function expectNoAxeViolations(page: Page) {
  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations).toEqual([])
}

test.describe.configure({ timeout: 240_000 })

test("number-field examples render every size, format, range, and step", async ({
  page,
}) => {
  const expectNoFailures = monitorPage(page)

  for (const example of examples) {
    await openExample(page, example)
    await expect(
      page.locator('[data-slot="number-field"]').first(),
    ).toBeVisible()
    await expect(
      page.locator('[data-slot="number-field-input"]').first(),
    ).toBeVisible()
  }

  expectNoFailures()
})

test("number-field responds to buttons and keyboard with focus retained", async ({
  page,
}) => {
  const expectNoFailures = monitorPage(page)
  await openExample(page, "p-number-field-1")

  const input = page.locator('[data-slot="number-field-input"]')
  const increment = page.locator('[data-slot="number-field-increment"]')
  const decrement = page.locator('[data-slot="number-field-decrement"]')
  await expect(input).toHaveValue("0")
  await increment.click()
  await expect(input).toHaveValue("1")
  await decrement.click()
  await expect(input).toHaveValue("0")
  await input.click()
  await input.press("ArrowUp")
  await expect(input).toHaveValue("1")
  await input.press("ArrowDown")
  await expect(input).toHaveValue("0")
  await expect(input).toBeFocused()

  expectNoFailures()
})

test("number-field enforces disabled, range, formatted, and custom-step states", async ({
  page,
}) => {
  const expectNoFailures = monitorPage(page)

  await openExample(page, "p-number-field-4")
  await expect(page.locator('[data-slot="number-field-input"]')).toBeDisabled()
  await expect(
    page.locator('[data-slot="number-field-decrement"]'),
  ).toBeDisabled()
  await expect(
    page.locator('[data-slot="number-field-increment"]'),
  ).toBeDisabled()

  await openExample(page, "p-number-field-7")
  const ranged = page.locator('[data-slot="number-field-input"]')
  await ranged.fill("10")
  await ranged.press("ArrowUp")
  await expect(ranged).toHaveValue("10")
  await expect(
    page.locator('[data-slot="number-field-increment"]'),
  ).toBeDisabled()
  await ranged.fill("0")
  await ranged.press("ArrowDown")
  await expect(ranged).toHaveValue("0")
  await expect(
    page.locator('[data-slot="number-field-decrement"]'),
  ).toBeDisabled()

  await openExample(page, "p-number-field-8")
  const formatted = page.locator('[data-slot="number-field-input"]')
  await expect(formatted).toHaveValue("$0.00")
  await page.locator('[data-slot="number-field-increment"]').click()
  await expect(formatted).toHaveValue("$1.00")

  await openExample(page, "p-number-field-9")
  const inputs = page.locator('[data-slot="number-field-input"]')
  const stepped = inputs.first()
  await page.locator('[data-slot="number-field-increment"]').first().click()
  await expect(stepped).toHaveValue("10")
  const decimal = inputs.nth(1)
  await page.locator('[data-slot="number-field-increment"]').nth(1).click()
  await expect(decimal).toHaveValue("0.1")

  expectNoFailures()
})

test("number-field scrub area changes value through pointer drag", async ({
  page,
}) => {
  const expectNoFailures = monitorPage(page)
  await openExample(page, "p-number-field-6")

  const input = page.locator('[data-slot="number-field-input"]')
  const scrubber = page.locator('[data-slot="number-field-scrub-area"]')
  const box = await scrubber.boundingBox()
  expect(box).not.toBeNull()
  if (box) {
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.down()
    await page.mouse.move(box.x + box.width / 2 + 60, box.y + box.height / 2, {
      steps: 8,
    })
    await page.mouse.up()
  }
  await expect(input).not.toHaveValue("0")

  expectNoFailures()
})

test("@full-a11y number-field examples and changed controls pass axe", async ({
  page,
}) => {
  const expectNoFailures = monitorPage(page)

  for (const example of examples) {
    await openExample(page, example)
    await expectNoAxeViolations(page)
  }

  await openExample(page, "p-number-field-1")
  await page.locator('[data-slot="number-field-input"]').press("ArrowUp")
  await expectNoAxeViolations(page)

  expectNoFailures()
})
