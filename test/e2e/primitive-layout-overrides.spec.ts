import { expect, test } from "@playwright/test"

for (const [name, index] of [
  ["p-button-24", 0],
  ["p-button-33", 0],
  ["p-input-14", 1],
  ["p-textarea-8", 1],
] as const) {
  test(`${name} preserves inline-flex when copied into block flow`, async ({
    page,
  }) => {
    await page.goto(`/examples/${name}?theme=light`)
    const flex = page.locator('[data-slot="flex"]').nth(index)
    await expect(flex).toBeVisible()
    await flex.evaluate((element) => {
      if (element.parentElement) element.parentElement.style.display = "block"
    })
    await expect(flex).toHaveCSS("display", "inline-flex")
  })
}
