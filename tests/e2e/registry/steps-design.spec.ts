import { expect, test } from "@playwright/test"

import { openPreview } from "./helpers"

for (const theme of ["light", "dark"] as const) {
  test(`steps expose their current state and neutral and blue markers in ${theme}`, async ({
    page,
  }, testInfo) => {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" })
    await page.addInitScript(
      (value) => localStorage.setItem("yopem-ui-theme", value),
      theme,
    )
    await openPreview(page, "steps")
    const list = page.locator('[data-slot="steps"]').last()

    const completed = list
      .getByRole("listitem")
      .filter({ hasText: "Choose equipment" })

    const current = list.getByRole("listitem").filter({ hasText: "Plan visit" })

    const upcoming = list
      .getByRole("listitem")
      .filter({ hasText: "Confirm loan" })

    await expect(current).toHaveAttribute("aria-current", "step")
    await expect(completed).toHaveAttribute("data-state", "completed")
    await expect(upcoming).toHaveAttribute("data-state", "upcoming")

    const colors = await current.evaluate((element) => {
      const probe = document.createElement("span")
      element.append(probe)
      probe.style.color = "var(--accent-solid)"
      const accent = getComputedStyle(probe).color
      probe.style.color = "var(--accent-solid-foreground)"
      const foreground = getComputedStyle(probe).color
      probe.remove()

      return { accent, foreground }
    })

    for (const item of [completed, current]) {
      const marker = await item.evaluate((element) => ({
        background: getComputedStyle(element, "::before").backgroundColor,
        color: getComputedStyle(element, "::before").color,
      }))

      expect(marker.background).toBe(colors.accent)
      expect(marker.color).toBe(colors.foreground)
    }

    expect(
      await completed.evaluate(
        (element) => getComputedStyle(element, "::before").content,
      ),
    ).toContain("✓")

    const upcomingMarker = await upcoming.evaluate(
      (element) => getComputedStyle(element, "::before").backgroundColor,
    )

    expect(upcomingMarker).not.toBe(colors.accent)
    await testInfo.attach(`steps-${theme}`, {
      body: await page.screenshot(),
      contentType: "image/png",
    })
  })
}
