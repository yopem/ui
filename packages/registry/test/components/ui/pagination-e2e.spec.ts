import type { Page } from "@playwright/test"

import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

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

async function openExample(page: Page, number: number) {
  await page.goto(`/examples/p-pagination-${number}`)
  await expect(page.locator("[data-example-root]")).toBeVisible()
  await expect(page.getByText("Loading example…")).toHaveCount(0)
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
  ).toBe(true)
}

async function expectNoAxeViolations(page: Page) {
  const axe = new AxeBuilder({ page }).include("main[data-example-root]")
  if (await page.locator('[data-slot="select-positioner"]').count())
    axe.include('[data-slot="select-popup"]')
  const results = await axe.analyze()
  expect(results.violations).toEqual([])
}

test.describe.configure({ timeout: 180_000 })

test("pagination renders semantic navigation, active page, and responsive labels", async ({
  page,
}) => {
  const expectNoFailures = monitorPage(page)
  await openExample(page, 1)

  const navigation = page.getByRole("navigation", {
    name: "Basic pagination",
  })
  await expect(navigation).toBeVisible()
  await expect(navigation.locator("ul")).toBeVisible()
  const activePage = page.getByRole("link", { name: "2" })
  await expect(activePage).toHaveAttribute("data-active", "true")
  await expect(activePage).toHaveAttribute("aria-current", "page")

  const previous = page.getByRole("link", { name: "Go to previous page" })
  const next = page.getByRole("link", { name: "Go to next page" })
  await previous.focus()
  await expect(previous).toBeFocused()
  await previous.press("Tab")
  await expect(page.getByRole("link", { name: "1" })).toBeFocused()

  const compact = (await page.viewportSize())?.width ?? 0
  const previousText = previous.locator("span")
  const nextText = next.locator("span")
  if (compact < 640) {
    await expect(previousText).toBeHidden()
    await expect(nextText).toBeHidden()
  } else {
    await expect(previousText).toBeVisible()
    await expect(nextText).toBeVisible()
  }

  expectNoFailures()
})

test("pagination state moves between ranges and enforces boundaries", async ({
  page,
}) => {
  const expectNoFailures = monitorPage(page)
  await openExample(page, 3)

  const previous = page.getByRole("button", { name: /Previous/ })
  const next = page.getByRole("button", { name: /Next/ })
  const range = page.getByRole("combobox", { name: "Select result range" })
  await expect(previous).toBeDisabled()
  const firstRange = await range.textContent()
  expect(firstRange).toBe("1-10")

  await next.click()
  await expect(range).not.toHaveText(firstRange ?? "")
  await expect(previous).toBeEnabled()
  await previous.click()
  await expect(range).toHaveText(firstRange ?? "")
  await expect(previous).toBeDisabled()

  await range.click()
  await page.getByRole("option").last().click()
  await expect(next).toBeDisabled()

  expectNoFailures()
})

test("pagination simple previous and next controls expose disabled states", async ({
  page,
}) => {
  const expectNoFailures = monitorPage(page)
  await openExample(page, 2)

  const navigation = page.getByRole("navigation", {
    name: "Compact pagination",
  })
  await expect(navigation).toBeVisible()
  await expect(
    navigation.getByRole("button", { name: "Previous" }),
  ).toBeDisabled()
  await expect(
    navigation.getByRole("link", { name: "Go to next page" }),
  ).toBeVisible()

  expectNoFailures()
})

test("@full-a11y pagination examples and changed range pass axe", async ({
  page,
}) => {
  const expectNoFailures = monitorPage(page)

  for (const number of [1, 2, 3]) {
    await openExample(page, number)
    await expectNoAxeViolations(page)
  }

  await openExample(page, 3)
  await page.getByRole("button", { name: /Next/ }).click()
  await expectNoAxeViolations(page)
  await page.getByRole("combobox", { name: "Select result range" }).click()
  await expectNoAxeViolations(page)

  expectNoFailures()
})
