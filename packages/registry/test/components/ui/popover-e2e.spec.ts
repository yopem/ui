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
  await page.goto(`/examples/p-popover-${number}`)
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
  if (await page.locator('[data-slot="popover-positioner"]').count())
    axe.include('[data-slot="popover-popup"]')
  const results = await axe.analyze()
  expect(results.violations).toEqual([])
}

test.describe.configure({ timeout: 180_000 })

test("popover examples render every trigger cleanly and responsively", async ({
  page,
}) => {
  const expectNoFailures = monitorPage(page)

  for (const number of [1, 2, 3, 4]) {
    await openExample(page, number)
    await expect(
      page.locator('[data-slot="popover-trigger"]').first(),
    ).toBeVisible()
  }

  expectNoFailures()
})

test("popover opens by keyboard, traps usable focus, and closes with Escape", async ({
  page,
}) => {
  const expectNoFailures = monitorPage(page)
  await openExample(page, 1)

  const trigger = page.getByRole("button", { name: "Open Popover" })
  await trigger.focus()
  await trigger.press("Enter")
  const popup = page.locator('[data-slot="popover-popup"]')
  await expect(popup).toBeVisible()
  await expect(page.getByText("Send us feedback")).toBeVisible()
  const feedback = page.getByRole("textbox", { name: "Send feedback" })
  await expect(feedback).toBeFocused()
  await feedback.fill("Direct popover test")
  await expect(feedback).toHaveValue("Direct popover test")
  await page.keyboard.press("Escape")
  await expect(popup).toBeHidden()
  await expect(trigger).toBeFocused()

  expectNoFailures()
})

test("popover close controls and shared handle switch content", async ({
  page,
}) => {
  const expectNoFailures = monitorPage(page)

  await openExample(page, 2)
  const trigger = page.getByRole("button", { name: "Open Popover" })
  await trigger.click()
  const popup = page.locator('[data-slot="popover-popup"]')
  await expect(popup).toContainText("Notifications")
  await page.getByRole("button", { name: "Close", exact: true }).last().click()
  await expect(popup).toBeHidden()
  await expect(trigger).toBeFocused()

  await openExample(page, 3)
  await page.getByRole("button", { name: "Notifications" }).click()
  const sharedPopup = page.locator('[data-slot="popover-popup"]')
  await expect(sharedPopup).toContainText("You have no new notifications")
  await page.getByRole("button", { name: "Profile" }).click()
  await expect(
    sharedPopup.getByRole("heading", { level: 2, name: "Mark Andersson" }),
  ).toBeVisible()
  await expect(sharedPopup).toContainText("Product Designer")
  await page.keyboard.press("Escape")
  await expect(sharedPopup).toBeHidden()

  expectNoFailures()
})

test("popover checkbox selection controls close-button disabled state", async ({
  page,
}) => {
  const expectNoFailures = monitorPage(page)
  await openExample(page, 4)

  await page
    .getByRole("button", { name: "Choose occurrences to confirm" })
    .click()
  const popup = page.locator('[data-slot="popover-popup"]')
  await expect(popup).toBeVisible()
  const checkboxes = page.getByRole("checkbox")
  await expect(checkboxes).toHaveCount(3)
  expect(
    await checkboxes.evaluateAll((items) =>
      items.every((item) => item.getAttribute("aria-checked") === "true"),
    ),
  ).toBe(true)

  for (const checkbox of await checkboxes.all()) await checkbox.click()
  await expect(
    page.getByRole("button", { name: "Reject selected" }),
  ).toBeDisabled()
  await expect(
    page.getByRole("button", { name: /Confirm selected/ }),
  ).toBeDisabled()

  await checkboxes.first().click()
  await expect(
    page.getByRole("button", { name: "Reject selected" }),
  ).toBeEnabled()
  await page.getByRole("button", { name: "Reject selected" }).click()
  await expect(popup).toBeHidden()

  expectNoFailures()
})

test("@full-a11y popover examples pass axe closed, open, and changed", async ({
  page,
}) => {
  const expectNoFailures = monitorPage(page)

  for (const number of [1, 2, 3, 4]) {
    await openExample(page, number)
    await expectNoAxeViolations(page)
    await page.locator('[data-slot="popover-trigger"]').first().click()
    await expect(page.locator('[data-slot="popover-popup"]')).toBeVisible()
    await expectNoAxeViolations(page)
  }

  await openExample(page, 4)
  await page
    .getByRole("button", { name: "Choose occurrences to confirm" })
    .click()
  await page.getByRole("checkbox").first().click()
  await expectNoAxeViolations(page)

  expectNoFailures()
})
