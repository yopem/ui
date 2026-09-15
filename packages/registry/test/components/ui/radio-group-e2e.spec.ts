import type { Page } from "@playwright/test"

import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

const examples = Array.from(
  { length: 9 },
  (_, index) => `p-radio-group-${index + 1}`,
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

test("radio-group examples render native and custom visual variants", async ({
  page,
}) => {
  const expectNoFailures = monitorPage(page)

  for (const example of examples) {
    await openExample(page, example)
    await expect(page.getByRole("radiogroup")).toBeVisible()
    await expect(page.getByRole("radio").first()).toBeVisible()
  }

  const heights: number[] = []
  for (const example of [
    "p-radio-group-7",
    "p-radio-group-8",
    "p-radio-group-9",
  ]) {
    await openExample(page, example)
    const box = await page.getByRole("radio", { name: "Monthly" }).boundingBox()
    expect(box).not.toBeNull()
    heights.push(box?.height ?? 0)
  }
  expect(heights[0]).toBeLessThan(heights[1])
  expect(heights[1]).toBeLessThan(heights[2])

  expectNoFailures()
})

test("radio-group supports pointer and arrow-key selection", async ({
  page,
}) => {
  const expectNoFailures = monitorPage(page)
  await openExample(page, "p-radio-group-1")

  const next = page.getByRole("radio", { name: "Next.js" })
  const vite = page.getByRole("radio", { name: "Vite" })
  const astro = page.getByRole("radio", { name: "Astro" })
  await expect(next).toBeChecked()
  await next.focus()
  await next.press("ArrowDown")
  await expect(vite).toBeChecked()
  await expect(vite).toBeFocused()
  await astro.click()
  await expect(astro).toBeChecked()
  await expect(next).not.toBeChecked()

  expectNoFailures()
})

test("radio-group skips disabled choices and labels activate controls", async ({
  page,
}) => {
  const expectNoFailures = monitorPage(page)

  await openExample(page, "p-radio-group-2")
  const next = page.getByRole("radio", { name: "Next.js" })
  const disabled = page.getByRole("radio", { name: "Vite (disabled)" })
  const astro = page.getByRole("radio", { name: "Astro" })
  await expect(disabled).toBeDisabled()
  await next.focus()
  await next.press("ArrowDown")
  await expect(astro).toBeChecked()
  await expect(astro).toBeFocused()

  await openExample(page, "p-radio-group-3")
  const pro = page.getByRole("radio", { name: "Pro" })
  await page.getByText("Pro", { exact: true }).click()
  await expect(pro).toBeChecked()
  await expect(pro).toBeFocused()

  expectNoFailures()
})

test("radio-group form selection submits selected value", async ({ page }) => {
  const expectNoFailures = monitorPage(page)
  await openExample(page, "p-radio-group-5")

  await page.getByRole("radio", { name: "Vite" }).click()
  const dialogMessage = new Promise<string>((resolve) => {
    page.once("dialog", async (dialog) => {
      resolve(dialog.message())
      await dialog.accept()
    })
  })
  await page.getByRole("button", { name: "Submit" }).click()
  await expect(dialogMessage).resolves.toBe("Selected: vite")

  expectNoFailures()
})

test("@full-a11y radio-group examples and changed selections pass axe", async ({
  page,
}) => {
  const expectNoFailures = monitorPage(page)

  for (const example of examples) {
    await openExample(page, example)
    await expectNoAxeViolations(page)
  }

  await openExample(page, "p-radio-group-1")
  await page.getByRole("radio", { name: "Astro" }).click()
  await expectNoAxeViolations(page)

  expectNoFailures()
})
