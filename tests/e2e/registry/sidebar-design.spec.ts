import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

for (const theme of ["light", "dark"] as const) {
  test(`sidebar has neutral compact navigation in ${theme}`, async ({
    page,
  }, testInfo) => {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" })
    await page.addInitScript(
      (value) => localStorage.setItem("yopem-ui-theme", value),
      theme,
    )
    await page.goto("/")
    await expect(
      page.getByRole("button", { name: "Search documentation", exact: true }),
    ).toBeEnabled()
    const card = page.getByRole("region", { name: "Sidebar", exact: true })

    await card.scrollIntoViewIfNeeded()
    await expect(
      card.getByRole("status", { name: /^Loading .* preview$/ }),
    ).toHaveCount(0)
    const mobile = (page.viewportSize()?.width ?? 0) < 800

    const sidebar = mobile
      ? page.getByRole("dialog", { name: "Sidebar", exact: true })
      : card

    if (mobile) {
      const trigger = card.getByRole("button", {
        name: "Open example sidebar",
        exact: true,
      })

      await trigger.click()
      await expect(sidebar).toBeVisible()
      await sidebar.getByRole("button", { name: "Close", exact: true }).click()
      await expect(sidebar).toBeHidden()
      await expect(trigger).toBeFocused()
      await trigger.click()
      await page.keyboard.press("Escape")
      await expect(sidebar).toBeHidden()
      await expect(trigger).toBeFocused()
      await trigger.click()
      await expect(sidebar).toHaveCSS("border-left-width", "0px")
      await expect(sidebar).toHaveCSS("border-right-width", "0px")

      const background = await sidebar.evaluate((element) => {
        const probe = document.createElement("span")
        probe.style.backgroundColor = "var(--sidebar)"
        element.append(probe)
        const value = getComputedStyle(probe).backgroundColor
        probe.remove()

        return value
      })

      expect(background).not.toBe("rgba(0, 0, 0, 0)")
      await expect(sidebar.locator('[data-slot="sheet-surface"]')).toHaveCSS(
        "background-color",
        background,
      )
    }

    const active = sidebar.getByRole("link", {
      name: "Components",
      exact: true,
    })

    const guide = sidebar.getByRole("link", {
      name: "Getting started",
      exact: true,
    })

    await expect(active).toHaveAttribute("data-active", "true")
    await expect(active).toHaveCSS("border-top-width", "0px")
    await guide.hover()
    await expect(guide).toBeVisible()

    const result = await new AxeBuilder({ page })
      .include('[data-slot="sidebar"]')
      .analyze()

    expect(result.violations).toEqual([])
    await testInfo.attach(`sidebar-${theme}`, {
      body: await sidebar.screenshot(),
      contentType: "image/png",
    })
    await guide.click()
    await expect(page).toHaveURL(/\/docs\/getting-started$/)
  })
}
