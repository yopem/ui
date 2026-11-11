import { expect, test } from "@playwright/test"

import { openDocsPage } from "./helpers"

for (const theme of ["light", "dark"] as const) {
  for (const path of ["/", "/components/card"]) {
    test(`header, sidebar, and search have no dividing borders on ${path} in ${theme}`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" })
      await page.addInitScript(
        (value) => localStorage.setItem("yopem-ui-theme", value),
        theme,
      )
      await openDocsPage(page, path)
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme)

      const header = page.getByRole("banner")

      await expect(header).toHaveCSS("border-bottom-width", "0px")

      const trigger = header.getByRole("button", {
        name: "Search documentation",
        exact: true,
      })

      await expect(trigger).toHaveCSS("border-top-width", "0px")

      if (path !== "/") {
        const sidebar = page
          .getByRole("complementary", { includeHidden: true })
          .filter({
            has: page.getByRole("navigation", {
              name: "Documentation",
              exact: true,
              includeHidden: true,
            }),
          })

        await expect(sidebar).toHaveCSS("border-inline-end-width", "0px")

        const background = await page
          .getByRole("main")
          .evaluate((element) => getComputedStyle(element).backgroundColor)

        await expect(header).toHaveCSS("background-color", background)
        await expect(sidebar).toHaveCSS("background-color", background)
      }

      await trigger.click()

      const dialog = page.getByRole("dialog", {
        name: "Search documentation",
        exact: true,
      })

      const input = dialog.getByRole("searchbox", {
        name: "Search documentation",
        exact: true,
      })

      await expect(input).toBeFocused()
      await expect(dialog.locator('[data-slot="input-group"]')).toHaveCSS(
        "border-top-width",
        "0px",
      )
      await page.keyboard.press("Escape")
      await expect(dialog).toBeHidden()
      await expect(trigger).toBeFocused()
    })
  }
}
