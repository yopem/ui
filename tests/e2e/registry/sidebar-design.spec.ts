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
    const active = card.getByRole("link", { name: "Components", exact: true })

    const guide = card.getByRole("link", {
      name: "Getting started",
      exact: true,
    })

    await expect(active).toHaveAttribute("data-active", "true")
    await expect(active).toHaveCSS("border-top-width", "0px")
    await guide.hover()
    await expect(guide).toBeVisible()
    await testInfo.attach(`sidebar-${theme}`, {
      body: await card.screenshot(),
      contentType: "image/png",
    })
    await guide.click()
    await expect(page).toHaveURL(/\/docs\/getting-started$/)
  })
}
