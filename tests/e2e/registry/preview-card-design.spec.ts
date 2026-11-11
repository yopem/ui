import { expect, test } from "@playwright/test"

import { openPreview } from "./helpers"

for (const theme of ["light", "dark"] as const) {
  test(`preview card opens and uses a flat surface in ${theme}`, async ({
    page,
  }, testInfo) => {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" })
    await page.addInitScript(
      (value) => localStorage.setItem("yopem-ui-theme", value),
      theme,
    )
    await openPreview(page, "preview-card")

    const trigger = page.getByRole("button", {
      name: "Willow Creek field notes",
    })

    const popup = page.locator('[data-slot="preview-card-content"]').last()
    const arrow = popup.locator('[data-slot="preview-card-arrow"]')

    const coarse = await page.evaluate(
      () => matchMedia("(pointer: coarse)").matches,
    )

    if (!coarse) {
      await trigger.hover()
      await expect(popup).toBeVisible()
      await popup.hover()
      await expect(popup).toBeVisible()
      await page.mouse.move(0, 0)
      await expect(popup).toBeHidden()
    }

    for (let index = 0; index < 80; index++) {
      await page.keyboard.press("Tab")

      if (
        await trigger.evaluate((element) => element === document.activeElement)
      )
        break
    }

    await expect(trigger).toBeFocused()
    await expect(popup).toBeVisible()
    await expect(
      popup.getByRole("heading", { name: "Willow Creek field notes" }),
    ).toBeVisible()

    const colors = await popup.evaluate((element) => {
      const probe = document.createElement("span")
      probe.style.color = "var(--popover)"
      element.append(probe)

      const result = {
        surface: getComputedStyle(element).backgroundColor,
        popover: getComputedStyle(probe).color,
      }

      probe.remove()

      return result
    })

    expect(colors.surface).toBe(colors.popover)
    await expect(arrow).toHaveCSS("background-color", colors.surface)
    await expect(popup).toHaveCSS("border-radius", "12px")
    await expect(popup).toHaveCSS("padding-top", "24px")
    await expect(popup).not.toHaveCSS("box-shadow", "none")
    expect(
      await popup.evaluate((element) => element.getBoundingClientRect().right),
    ).toBeLessThanOrEqual(await page.evaluate(() => innerWidth))
    await testInfo.attach(`preview-card-${theme}`, {
      body: await page.screenshot(),
      contentType: "image/png",
    })
    await page.keyboard.press("Escape")
    await expect(popup).toBeHidden()
  })
}
