import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

import { openPreview } from "./helpers"

const content =
  "Station report\n  North platform\n    Track 2\n\nDeparture: 08:30"

for (const theme of ["light", "dark"] as const) {
  test(`@a11y pre preserves native content in ${theme}`, async ({ page }) => {
    await page.addInitScript(
      (value) => localStorage.setItem("yopem-ui-theme", value),
      theme,
    )
    await openPreview(page, "pre")
    const preview = page.getByLabel(/live preview$/).first()
    const pre = preview.locator('[data-slot="pre"]')

    await expect(pre).toBeVisible()
    await expect(pre).toHaveJSProperty("tagName", "PRE")
    await expect(pre).toHaveAttribute("title", "Station report")
    await expect(pre.locator("code")).toHaveText(content, {
      useInnerText: false,
    })
    await expect(pre).toHaveCSS("white-space", "pre")
    await expect(pre).toHaveCSS("overflow-x", "auto")
    await expect(preview.getByRole("button")).toHaveCount(0)
    expect(
      (await new AxeBuilder({ page }).include("main").analyze()).violations,
    ).toEqual([])
  })
}
