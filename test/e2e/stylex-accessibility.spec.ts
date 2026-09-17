import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.goto("/examples/p-button-1?theme=light")
  await expect(page.getByRole("button", { name: "Button" })).toBeVisible()
})

test("Button vertical slice has no detectable accessibility violations", async ({
  page,
}) => {
  const results = await new AxeBuilder({ page }).analyze()
  expect(
    results.violations.map(({ help, id, nodes }) => ({
      help,
      id,
      targets: nodes.flatMap((node) => node.target),
    })),
  ).toEqual([])
})

test("buttons expose keyboard focus and minimum targets", async ({ page }) => {
  const buttons = page.locator('[data-slot="button"]')
  const count = await buttons.count()
  expect(count).toBeGreaterThan(0)

  for (let index = 0; index < count; index += 1) {
    const button = buttons.nth(index)
    const box = await button.boundingBox()
    expect(box?.height).toBeGreaterThanOrEqual(24)
    expect(box?.width).toBeGreaterThanOrEqual(24)
  }

  await buttons.first().focus()
  await expect(buttons.first()).toBeFocused()
  const focusStyle = await buttons.first().evaluate((element) => {
    const computed = getComputedStyle(element)
    return { outline: computed.outline, shadow: computed.boxShadow }
  })
  expect(focusStyle.outline !== "none" || focusStyle.shadow !== "none").toBe(
    true,
  )
})

test("stored dark theme applies before interaction", async ({ page }) => {
  await page.evaluate(() => localStorage.setItem("yopem-ui-theme", "dark"))
  await page.reload()
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark")
  await expect(page.locator("html")).toHaveCSS("color-scheme", "dark")
})
