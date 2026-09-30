import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

test("rating supports keyboard selection and announces selected value", async ({
  page,
}) => {
  await page.goto("/components/rating", { waitUntil: "networkidle" })
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

test("native select keeps form and keyboard behavior", async ({ page }) => {
  await page.goto("/components/native-select", { waitUntil: "networkidle" })
  const select = page.getByRole("combobox", { name: "Theme", exact: true })
  await expect(select).toHaveValue("system")
  await select.focus()
  await page.keyboard.press("End")
  await expect(select).toHaveValue("dark")
  await expect(
    page.getByRole("combobox", { name: "Disabled theme" }),
  ).toBeDisabled()
})

test("marquee can be paused and resumed", async ({ page }) => {
  await page.goto("/components/marquee", { waitUntil: "networkidle" })
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
  await expect(highlight.locator("mark")).toHaveText("accessible")
  await expect(highlight).toContainText(
    "Build accessible components for everyone.",
  )
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

test("steps expose active item as current step", async ({ page }) => {
  await page.goto("/components/steps")
  await expect(
    page.locator('[data-slot="steps-item"]').filter({ hasText: "Preferences" }),
  ).toHaveAttribute("aria-current", "step")
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
})

test("clipboard reports copied content", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"])
  await page.goto("/components/clipboard", { waitUntil: "networkidle" })
  await expect(
    page.getByRole("button", { name: "Copy Clipboard usage" }),
  ).toBeEnabled({ timeout: 20_000 })
  await page.getByRole("button", { name: "Copy to clipboard" }).click()
  await expect(
    page.locator('[data-slot="clipboard-status"]').first(),
  ).toHaveText("Copied to clipboard")
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    "https://example.com",
  )
  await expect(
    page.getByRole("button", { name: "Unavailable copy" }),
  ).toBeDisabled()
})

test("codeblock preserves source and copies it", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"])
  await page.goto("/components/codeblock", { waitUntil: "networkidle" })
  await page.getByRole("button", { name: "Copy code", exact: true }).click()
  await expect(page.getByText("Code copied.")).toBeVisible()
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    "const answer = 42",
  )
})
