import { expect, test } from "@playwright/test"

import { openPreview } from "./helpers"

for (const theme of ["light", "dark"] as const) {
  test(`tooltip supports hover and keyboard with a compact surface in ${theme}`, async ({
    page,
  }, testInfo) => {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" })
    await page.addInitScript(
      (value) => localStorage.setItem("yopem-ui-theme", value),
      theme,
    )
    await openPreview(page, "tooltip")
    const trigger = page.getByRole("button", { name: "Hover me" })
    const popup = page.locator('[data-slot="tooltip-popup"]').last()
    const arrow = popup.locator('[data-slot="tooltip-arrow"]')

    if (!(await page.evaluate(() => matchMedia("(pointer: coarse)").matches))) {
      await trigger.hover()
      await expect(popup).toBeVisible()
      await page.mouse.move(0, 0)
      await expect(popup).toBeHidden()
    }

    await trigger.focus()
    await page.keyboard.press("Shift+Tab")
    await page.keyboard.press("Tab")

    await expect(trigger).toBeFocused()
    await expect(popup).toBeVisible()

    const colors = await popup.evaluate((element) => {
      const probe = document.createElement("span")
      probe.style.color = "var(--popover)"
      element.append(probe)
      const surface = getComputedStyle(probe).color
      probe.style.color = "var(--card-border)"
      const border = getComputedStyle(probe).color
      probe.remove()

      return { surface, border }
    })

    await expect(popup).toHaveCSS("background-color", colors.surface)
    await expect(popup).toHaveCSS("border-color", colors.border)
    await expect(popup).toHaveCSS("border-radius", "8px")
    await expect(popup).toHaveCSS("font-size", "14px")
    await expect(popup.locator('[data-slot="tooltip-viewport"]')).toHaveCSS(
      "padding",
      "6px 12px",
    )
    await expect(arrow).toHaveCSS("background-color", colors.surface)
    await expect(popup).not.toHaveCSS("box-shadow", "none")
    await testInfo.attach(`tooltip-${theme}`, {
      body: await page.screenshot(),
      contentType: "image/png",
    })
    await page.keyboard.press("Escape")
    await expect(popup).toBeHidden()
  })
}
