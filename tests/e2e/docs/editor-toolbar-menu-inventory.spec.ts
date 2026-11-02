import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

const previews = [
  "insert-menu",
  "turn-into-menu",
  "more-menu",
  "fixed-toolbar",
  "fixed-toolbar-buttons",
  "list-toolbar-buttons",
  "floating-toolbar-buttons",
  "review-mode-menu",
]

for (const slug of previews) {
  test(`${slug} exposes accessible native controls @a11y`, async ({
    page,
  }, testInfo) => {
    const response = await page.goto(`/editor/${slug}`)

    expect(response?.status()).toBe(200)
    await expect(
      page.getByRole("textbox", {
        name: /^(Toolbar menu|Grouped floating|Mode menu) document$/,
        exact: true,
      }),
    ).toBeVisible()
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
    await testInfo.attach(`${slug}.png`, {
      body: await page.screenshot({ scale: "css" }),
      contentType: "image/png",
    })
  })
}
