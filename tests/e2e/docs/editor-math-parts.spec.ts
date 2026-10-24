import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

for (const slug of [
  "math-control",
  "math-controls",
  "math-preview",
])
  test(`@a11y optional ${slug} has usable documentation`, async ({
    page,
  }, testInfo) => {
    const response = await page.goto(`/editor/${slug}`)
    expect(response?.status()).toBe(200)
    await expect(page.locator("main math").first()).toBeVisible()
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
    await page.screenshot({
      path: testInfo.outputPath(`${slug}.png`),
      scale: "css",
    })
  })
