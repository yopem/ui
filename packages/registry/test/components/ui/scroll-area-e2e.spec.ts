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

test("scroll-area scrolls on both axes and renders optional treatments", async ({
  page,
}) => {
  const expectCleanPage = watchPage(page)

  await openExample(page, "p-scroll-area-1")
  const verticalViewport = page.getByRole("region", {
    name: "Release tags",
  })
  await expect(verticalViewport).toHaveAttribute(
    "data-slot",
    "scroll-area-viewport",
  )
  await expect(verticalViewport).toHaveAttribute("tabindex", "0")
  expect(
    await verticalViewport.evaluate(
      (element) => element.scrollHeight > element.clientHeight,
    ),
  ).toBe(true)
  await verticalViewport.focus()
  await expect(verticalViewport).toBeFocused()
  await verticalViewport.press("PageDown")
  await expect
    .poll(() => verticalViewport.evaluate((element) => element.scrollTop))
    .toBeGreaterThan(0)

  await openExample(page, "p-scroll-area-2")
  const horizontalViewport = page.locator('[data-slot="scroll-area-viewport"]')
  expect(
    await horizontalViewport.evaluate(
      (element) => element.scrollWidth > element.clientWidth,
    ),
  ).toBe(true)
  await horizontalViewport.hover()
  await page.mouse.wheel(300, 0)
  await expect
    .poll(() => horizontalViewport.evaluate((element) => element.scrollLeft))
    .toBeGreaterThan(0)

  await openExample(page, "p-scroll-area-3")
  const twoAxisViewport = page.locator('[data-slot="scroll-area-viewport"]')
  expect(
    await twoAxisViewport.evaluate(
      (element) =>
        element.scrollHeight > element.clientHeight &&
        element.scrollWidth > element.clientWidth,
    ),
  ).toBe(true)

  await openExample(page, "p-scroll-area-4")
  await expect(page.locator('[data-slot="scroll-area-viewport"]')).toHaveCSS(
    "mask-image",
    /linear-gradient/,
  )

  await openExample(page, "p-scroll-area-5")
  const gutter = page.locator('[data-slot="scroll-area-viewport"]')
  expect(
    await gutter.evaluate((element) =>
      Number.parseFloat(getComputedStyle(element).paddingBlockEnd),
    ),
  ).toBeGreaterThan(0)
  expectCleanPage()
})

test("@full-a11y scroll-area remains accessible before and after scrolling", async ({
  page,
}) => {
  const expectCleanPage = watchPage(page)
  await openExample(page, "p-scroll-area-1")
  await expectNoAxeViolations(page)
  const viewport = page.locator('[data-slot="scroll-area-viewport"]')
  await viewport.focus()
  await viewport.press("End")
  await expect
    .poll(() => viewport.evaluate((element) => element.scrollTop))
    .toBeGreaterThan(0)
  await expectNoAxeViolations(page)
  expectCleanPage()
})
