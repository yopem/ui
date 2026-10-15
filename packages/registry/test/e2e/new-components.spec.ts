import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

test("@a11y rating supports keyboard selection and announces selected value", async ({
  page,
}) => {
  await page.goto("/components/rating", { waitUntil: "domcontentloaded" })
  await expect(
    page.getByRole("button", { name: "Copy Rating usage", exact: true }),
  ).toBeEnabled()

  const rating = page.getByRole("radiogroup", { name: "Rate this component" })
  await expect(rating.getByRole("radio", { name: "3 stars" })).toBeChecked()
  await rating.getByRole("radio", { name: "3 stars" }).click()
  await page.keyboard.press("ArrowRight")
  await expect(rating.getByRole("radio", { name: "4 stars" })).toBeChecked()

  const disabledRating = page.getByRole("radiogroup", {
    name: "Disabled rating",
  })

  await expect(
    disabledRating.getByRole("radio", { name: "2 stars" }),
  ).toBeDisabled()
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
})

test("@a11y native select keeps aligned fields and keyboard behavior", async ({
  page,
}, testInfo) => {
  await page.goto("/components/native-select", {
    waitUntil: "domcontentloaded",
  })
  await expect(
    page.getByRole("button", { name: "Copy Native Select usage", exact: true }),
  ).toBeEnabled()

  const select = page.getByRole("combobox", { name: "Theme", exact: true })
  await expect(select).toHaveValue("system")
  await select.click()
  await page.keyboard.press("Escape")
  await select.focus()
  await page.keyboard.press("End")
  await expect(select).toHaveValue("dark")
  const disabledSelect = page.getByRole("combobox", { name: "Disabled theme" })
  await expect(disabledSelect).toBeDisabled()

  const selectBox = await select.boundingBox()
  const disabledBox = await disabledSelect.boundingBox()
  expect(selectBox).not.toBeNull()
  expect(disabledBox).not.toBeNull()
  expect(selectBox?.x).toBe(disabledBox?.x)
  expect(selectBox?.width).toBe(disabledBox?.width)

  for (const name of ["Theme", "Disabled theme"]) {
    const label = page.getByText(name, { exact: true })
    const control = page.getByRole("combobox", { name, exact: true })
    const labelBox = await label.boundingBox()
    const controlBox = await control.boundingBox()
    expect(labelBox).not.toBeNull()
    expect(controlBox).not.toBeNull()

    if (labelBox && controlBox) {
      expect(labelBox.y + labelBox.height).toBeLessThan(controlBox.y)
      expect(labelBox.x).toBe(controlBox.x)
    }
  }

  const icon = page.locator('[data-slot="native-select-icon"]').first()
  await expect(icon).toBeVisible()
  await expect(icon).toHaveAttribute("aria-hidden", "true")
  const chevronBox = await icon.locator("path").boundingBox()

  const textInset = await select.evaluate((element) => {
    const style = getComputedStyle(element)

    return (
      Number.parseFloat(style.paddingInlineStart) +
      Number.parseFloat(style.borderInlineStartWidth)
    )
  })

  expect(chevronBox).not.toBeNull()

  if (selectBox && chevronBox) {
    const arrowInset =
      selectBox.x + selectBox.width - chevronBox.x - chevronBox.width

    expect(Math.abs(arrowInset - textInset)).toBeLessThanOrEqual(2)
  }

  await select.scrollIntoViewIfNeeded()
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  await page.screenshot({
    path: testInfo.outputPath("native-select.png"),
    scale: "css",
  })

  await select
    .locator("..")
    .evaluate((element) => element.setAttribute("dir", "rtl"))
  const rtlSelectBox = await select.boundingBox()
  const rtlIconBox = await icon.boundingBox()
  expect(rtlSelectBox).not.toBeNull()
  expect(rtlIconBox).not.toBeNull()

  if (rtlSelectBox && rtlIconBox) {
    expect(rtlIconBox.x).toBeLessThan(rtlSelectBox.x + rtlSelectBox.width / 2)
  }

  await page.screenshot({
    path: testInfo.outputPath("native-select-rtl.png"),
    scale: "css",
  })
})

test("marquee can be paused and resumed", async ({ page }) => {
  await page.goto("/components/marquee", { waitUntil: "domcontentloaded" })
  await expect(
    page.getByRole("button", { name: "Copy Marquee usage", exact: true }),
  ).toBeEnabled()
  await page.getByRole("button", { name: "Pause scrolling content" }).click()
  await expect(page.locator('[data-slot="marquee-track"]')).toHaveAttribute(
    "data-paused",
    "",
  )
  await page.getByRole("button", { name: "Resume scrolling content" }).click()
  await expect(page.locator('[data-slot="marquee-track"]')).not.toHaveAttribute(
    "data-paused",
    "",
  )
})

test("highlight marks matching text without losing surrounding words", async ({
  page,
}) => {
  await page.goto("/components/highlight")
  const highlight = page.locator('[data-slot="highlight"]')
  await expect(highlight.locator("mark")).toHaveText("heron")
  await expect(highlight).toContainText(/.+heron.+/)
})

test("prose constrains long-form content", async ({ page }) => {
  await page.goto("/components/prose")
  const prose = page.locator('[data-slot="prose"]')
  await expect(prose).toBeVisible()
  await expect
    .poll(() =>
      prose.evaluate((element) =>
        Number.parseFloat(getComputedStyle(element).maxWidth),
      ),
    )
    .toBeLessThanOrEqual(700)
})

test("@a11y steps expose active item as current step", async ({ page }) => {
  await page.goto("/components/steps")
  await expect(
    page.locator('[data-slot="steps-item"]').filter({ hasText: "Plan visit" }),
  ).toHaveAttribute("aria-current", "step")
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
})

test("clipboard reports copied content", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"])
  await page.goto("/components/clipboard", { waitUntil: "domcontentloaded" })
  await expect(
    page.getByRole("button", { name: "Copy Clipboard usage" }),
  ).toBeEnabled({ timeout: 20_000 })
  await page.getByRole("button", { name: "Copy to clipboard" }).click()
  await expect(
    page.locator('[data-slot="clipboard-status"]').first(),
  ).toHaveText("Copied to clipboard")
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    "https://example.com/field-notes",
  )
  await expect(
    page.getByRole("button", { name: "Unavailable copy" }),
  ).toBeDisabled()
})

test("codeblock preserves source and copies it", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"])
  await page.goto("/components/codeblock", { waitUntil: "domcontentloaded" })
  await expect(
    page.getByRole("button", { name: "Copy Codeblock usage", exact: true }),
  ).toBeEnabled()
  await page.getByRole("button", { name: "Copy code", exact: true }).click()
  await expect(page.getByText("Code copied.")).toBeVisible()
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    'const station = "Willow Creek"',
  )
})
