import { expect, test } from "@playwright/test"

import { openPreview } from "./helpers"

for (const theme of ["light", "dark"] as const) {
  test(`scroll area uses quiet surfaces and remains usable in ${theme}`, async ({
    page,
  }, testInfo) => {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" })
    await page.addInitScript(
      (value) => localStorage.setItem("yopem-ui-theme", value),
      theme,
    )
    await openPreview(page, "scroll-area")

    const viewport = page
      .getByRole("group", { name: "Scrollable content", exact: true })
      .filter({
        has: page.getByRole("heading", { name: "Field records", exact: true }),
      })

    const root = viewport.locator("..")
    const thumb = root.locator('[data-slot="scroll-area-thumb"]').first()

    await expect(viewport).toBeVisible()

    const colors = await root.evaluate(() => {
      const probe = document.createElement("div")
      document.documentElement.append(probe)
      probe.style.backgroundColor = "var(--card-border)"
      const border = getComputedStyle(probe).backgroundColor
      probe.style.backgroundColor = "var(--input)"
      const scrollbar = getComputedStyle(probe).backgroundColor
      probe.remove()

      return { border, scrollbar }
    })

    await expect(root).toHaveCSS("border-top-color", colors.border)
    await expect(thumb).toHaveCSS("background-color", colors.scrollbar)
    await viewport.focus()
    await page.keyboard.press("End")
    await expect
      .poll(() => viewport.evaluate((element) => element.scrollTop))
      .toBeGreaterThan(0)
    await page.keyboard.press("Home")
    await expect
      .poll(() => viewport.evaluate((element) => element.scrollTop))
      .toBe(0)
    await viewport.hover()
    await page.mouse.wheel(0, 240)
    await expect
      .poll(() => viewport.evaluate((element) => element.scrollTop))
      .toBeGreaterThan(0)
    await testInfo.attach(`scroll-area-${theme}`, {
      body: await root.screenshot(),
      contentType: "image/png",
    })
  })
}
