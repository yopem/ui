import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

import { openPreview } from "./helpers"

test("each chart type exposes copyable consumer usage", async ({
  page,
  context,
}) => {
  test.setTimeout(90_000)
  await context.grantPermissions(["clipboard-read", "clipboard-write"])
  await openPreview(page, "chart")

  for (const family of [
    "Area",
    "Bar",
    "Line",
    "Pie",
    "Radar",
    "Radial",
    "Tooltip",
  ]) {
    const section = page.getByRole("region", {
      name: `${family} usage`,
      exact: true,
    })

    await expect(section).toBeVisible()
    await section
      .getByRole("button", { name: `Copy ${family} usage`, exact: true })
      .click()
    const source = await page.evaluate(() => navigator.clipboard.readText())
    expect(source).toContain('"@/components/ui/chart"')
    expect(source).toContain("@tanstack/charts")
    expect(source).not.toContain("@registry/")
  }
})

for (const theme of ["light", "dark"] as const) {
  test(`expanded chart usage code is accessible in ${theme}`, async ({
    page,
  }, testInfo) => {
    test.setTimeout(120_000)
    await page.emulateMedia({ colorScheme: theme })
    await page.addInitScript(
      (value) => localStorage.setItem("yopem-ui-theme", value),
      theme,
    )
    await openPreview(page, "chart")

    for (const family of ["Pie", "Radar", "Radial"]) {
      const section = page.getByRole("region", {
        name: `${family} usage`,
        exact: true,
      })

      const block = section.getByTestId("copyable-code")

      const expand = block.getByRole("button", {
        name: "View code",
        exact: true,
      })

      await expand.click()
      await expect(expand).toBeHidden()

      const result = await new AxeBuilder({ page })
        .include(`[aria-label="${family} usage"]`)
        .analyze()

      expect(result.violations).toEqual([])
      await block.screenshot({
        path: testInfo.outputPath(`${family.toLowerCase()}-usage-${theme}.png`),
        scale: "css",
      })
    }
  })
}
