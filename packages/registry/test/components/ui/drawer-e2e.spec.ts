import type { Page } from "@playwright/test"

import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

const assetTypes = new Set(["font", "image", "script", "stylesheet"])

function captureFailures(page: Page) {
  const failures: string[] = []
  page.on("console", (message) => {
    if (message.type() === "error") failures.push(`console: ${message.text()}`)
  })
  page.on("pageerror", (error) => failures.push(`page: ${error.message}`))
  page.on("requestfailed", (request) => {
    if (
      /localhost|127\.0\.0\.1/.test(request.url()) &&
      assetTypes.has(request.resourceType())
    ) {
      failures.push(
        `request: ${request.url()} ${request.failure()?.errorText ?? "failed"}`,
      )
    }
  })
  page.on("response", (response) => {
    if (
      /localhost|127\.0\.0\.1/.test(response.url()) &&
      response.status() >= 400 &&
      assetTypes.has(response.request().resourceType())
    ) {
      failures.push(`asset: ${response.status()} ${response.url()}`)
    }
  })
  return failures
}

async function openExample(page: Page, example: string) {
  await page.goto(`/examples/${example}`, { waitUntil: "domcontentloaded" })
  const root = page.locator("[data-example-root]")
  await expect(root).toBeVisible({ timeout: 30_000 })
  await expect(page.getByText("Loading example…")).toHaveCount(0, {
    timeout: 30_000,
  })
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

const examples = [
  "p-drawer-1",
  "p-drawer-2",
  "p-drawer-3",
  "p-drawer-4",
  "p-drawer-5",
  "p-drawer-6",
  "p-drawer-7",
  "p-drawer-8",
  "p-drawer-9",
  "p-drawer-10",
  "p-drawer-11",
  "p-drawer-12",
  "p-drawer-13",
  "p-drawer-14",
] as const

test("drawer renders every documented example responsively and cleanly", async ({
  page,
}) => {
  test.setTimeout(360_000)
  const failures = captureFailures(page)
  for (const example of examples) {
    await openExample(page, example)
    await expect(
      page
        .locator(
          ':is([data-slot="drawer-trigger"], [data-slot="drawer-popup"], [data-slot="drawer-swipe-area"], button)',
        )
        .filter({ visible: true })
        .first(),
    ).toBeVisible()
  }

  await openExample(page, "p-drawer-1")
  const trigger = page.getByRole("button", { name: "Open drawer" })
  await trigger.press("Enter")
  const drawer = page.getByRole("dialog")
  await expect(drawer).toContainText("Notifications")
  await page.keyboard.press("Tab")
  await expect(drawer.getByRole("button", { name: "Close" })).toBeFocused()
  await page.keyboard.press("Escape")
  await expect(drawer).toBeHidden()
  await expect(trigger).toBeFocused()
  await trigger.click()
  await drawer.getByRole("button", { name: "Close" }).click()
  await expect(drawer).toBeHidden()

  await openExample(page, "p-drawer-4")
  for (const name of ["Right", "Left", "Top", "Bottom"]) {
    const sideTrigger = page.getByRole("button", { name, exact: true }).first()
    await sideTrigger.click()
    await expect(page.getByRole("dialog")).toBeVisible()
    await page.keyboard.press("Escape")
    await expect(page.getByRole("dialog")).toBeHidden()
  }

  await openExample(page, "p-drawer-14")
  const swipeArea = page.locator('[data-slot="drawer-swipe-area"]')
  const swipeBox = await swipeArea.boundingBox()
  expect(swipeBox).not.toBeNull()
  await page.mouse.move(swipeBox?.x ?? 0, swipeBox?.y ?? 0)
  await page.mouse.down()
  await page.mouse.move((swipeBox?.x ?? 0) + 220, swipeBox?.y ?? 0, {
    steps: 10,
  })
  await page.mouse.up()
  await expect(page.locator('[data-slot="drawer-popup"]')).toBeVisible()
  expect(failures).toEqual([])
})

test("@full-a11y drawer examples and changed states have no violations", async ({
  page,
}) => {
  test.setTimeout(600_000)
  const failures = captureFailures(page)
  for (const example of examples) {
    await openExample(page, example)
    const drawerTrigger = page
      .locator('[data-slot="drawer-trigger"]')
      .filter({ visible: true })
      .first()
    const fallbackTrigger = page
      .getByRole("button", { name: /open|actions|menu/i })
      .filter({ visible: true })
      .first()
    const popup = page
      .locator('[data-slot="drawer-popup"]')
      .filter({ visible: true })
      .first()
    await expectNoAxeViolations(page)
    if (!(await popup.count())) {
      if (await drawerTrigger.count()) await drawerTrigger.click()
      else if (example === "p-drawer-14") {
        const swipeBox = await page
          .locator('[data-slot="drawer-swipe-area"]')
          .boundingBox()
        expect(swipeBox).not.toBeNull()
        await page.mouse.move(swipeBox?.x ?? 0, swipeBox?.y ?? 0)
        await page.mouse.down()
        await page.mouse.move((swipeBox?.x ?? 0) + 220, swipeBox?.y ?? 0, {
          steps: 10,
        })
        await page.mouse.up()
      } else await fallbackTrigger.click()
    }
    await expect(popup).toBeVisible()
    await expectNoAxeViolations(page)
    await page.keyboard.press("Escape")
    await expect(popup).toBeHidden()
  }
  expect(failures).toEqual([])
})
