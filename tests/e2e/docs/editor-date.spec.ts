import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

test.use({
  permissions: ["clipboard-read", "clipboard-write"],
  timezoneId: "America/Los_Angeles",
})

test("native inline dates support calendar editing, keyboard, clipboard and history", async ({
  page,
}, testInfo) => {
  await page.goto("/editor/date-control")

  const content = page.getByRole("textbox", {
    name: "Date editor",
    exact: true,
  })

  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  await content.fill("Before after")
  await page.keyboard.press("Home")
  await page.getByRole("button", { name: "Insert date", exact: true }).click()
  await page.getByRole("button", { name: /January 2/ }).click()

  const dates = content.locator('[data-editor-date="1"]')
  await expect(dates).toHaveCount(1)
  await expect(dates).toHaveAttribute("datetime", "2024-01-02")
  await expect(content).toBeFocused()

  await dates.first().locator("button").click()
  await expect(page.getByRole("grid")).toBeVisible()
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  await page.keyboard.press("Escape")
  await expect(dates).toHaveAttribute("datetime", "2024-01-02")

  await dates.first().locator("button").click()
  const selectedDay = page.getByRole("button", { name: /January 2/ })
  await selectedDay.focus()
  await page.keyboard.press("ArrowRight")
  await page.keyboard.press("Enter")
  await expect(dates).toHaveAttribute("datetime", "2024-01-03")
  await expect(content).toBeFocused()
  await page.keyboard.press("ControlOrMeta+z")
  await expect(dates).toHaveAttribute("datetime", "2024-01-02")
  await page.keyboard.press("ControlOrMeta+Shift+z")
  await expect(dates).toHaveAttribute("datetime", "2024-01-03")

  await dates.first().locator("button").focus()
  await page.keyboard.press("ControlOrMeta+c")
  await content.click()
  await page.keyboard.press("ControlOrMeta+End")
  await page.keyboard.press("ControlOrMeta+v")
  await expect(dates).toHaveCount(2)
  await dates.last().locator("button").focus()
  await page.keyboard.press("ControlOrMeta+x")
  await expect(dates).toHaveCount(1)
  await page.keyboard.press("ControlOrMeta+z")
  await expect(dates).toHaveCount(2)

  await page
    .getByRole("button", { name: "Toggle read-only", exact: true })
    .click()
  await expect(content).toHaveAttribute("aria-readonly", "true")
  await expect(dates.first().locator("button")).toBeDisabled()

  for (const colorScheme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme })
    await expect(page.locator("html")).toHaveAttribute(
      "data-theme",
      colorScheme,
    )

    for (const viewport of [
      { width: 1440, height: 900 },
      { width: 768, height: 900 },
      { width: 390, height: 844 },
    ]) {
      await page.setViewportSize(viewport)

      const overflows = await content.evaluate(
        (element) =>
          element.scrollWidth > element.clientWidth ||
          element.getBoundingClientRect().right >
            document.documentElement.clientWidth,
      )

      expect(overflows).toBe(false)
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
    }
  }

  await page.emulateMedia({ colorScheme: "light" })
  await page.setViewportSize({ width: 1280, height: 720 })
  await page.screenshot({
    path: testInfo.outputPath("editor-date-workflow.png"),
    scale: "css",
  })
  await testInfo.attach("editor-date-result", {
    body: Buffer.from(
      JSON.stringify({
        dates: await dates.count(),
        values: await dates.evaluateAll((nodes) =>
          nodes.map((node) => node.getAttribute("datetime")),
        ),
        readOnly: await content.getAttribute("aria-readonly"),
      }),
    ),
    contentType: "application/json",
  })
})

test("host replacement expires an open date edit", async ({ page }) => {
  await page.goto("/editor/date-control")

  const content = page.getByRole("textbox", {
    name: "Date editor",
    exact: true,
  })

  await content.fill("Before after")
  await page.keyboard.press("Home")
  await page.getByRole("button", { name: "Insert date", exact: true }).click()
  await page.getByRole("button", { name: /January 2/ }).click()
  const date = content.locator('[data-editor-date="1"]')
  await date.locator("button").click()
  await expect(page.getByRole("grid")).toBeVisible()

  await content.fill("Host replacement")
  const staleChoice = page.getByRole("button", { name: /January 5/ })

  if (await staleChoice.count()) await staleChoice.click()

  await expect(content).toContainText("Host replacement")
  await expect(content.locator('[data-editor-date="1"]')).toHaveCount(0)
})
