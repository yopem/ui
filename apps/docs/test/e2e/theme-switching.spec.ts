import { expect, test } from "@playwright/test"

for (const path of [
  "/",
  "/components",
  "/components/button",
  "/docs/getting-started",
  "/docs/theming",
]) {
  for (const systemTheme of ["light", "dark"] as const) {
    test(`single theme button follows system ${systemTheme} and retains toggles on ${path}`, async ({
      page,
    }) => {
      const errors: string[] = []
      const oppositeTheme = systemTheme === "light" ? "dark" : "light"

      page.on("pageerror", (error) => errors.push(error.message))
      await page.emulateMedia({ colorScheme: systemTheme })
      await page.goto(path)
      await expect(
        page.getByRole("button", { name: "Search documentation", exact: true }),
      ).toBeEnabled()
      await expect(page.locator("html")).toHaveAttribute(
        "data-theme",
        systemTheme,
      )

      const header = page.getByRole("banner")

      const toggle = header.getByRole("button", {
        name: /Switch to (dark|light) theme/,
      })

      await expect(
        page.getByRole("button", { name: /Switch to (dark|light) theme/ }),
      ).toHaveCount(1)
      await expect(toggle).toHaveAccessibleName(
        `Switch to ${oppositeTheme} theme`,
      )
      expect(
        await page.evaluate(() => localStorage.getItem("yopem-ui-theme")),
      ).toBeNull()
      await page.emulateMedia({ colorScheme: oppositeTheme })
      await expect(page.locator("html")).toHaveAttribute(
        "data-theme",
        oppositeTheme,
      )
      await expect(toggle).toHaveAccessibleName(
        `Switch to ${systemTheme} theme`,
      )
      await page.emulateMedia({ colorScheme: systemTheme })
      await expect(page.locator("html")).toHaveAttribute(
        "data-theme",
        systemTheme,
      )

      const initialColor = await page
        .locator("html")
        .evaluate((element) => getComputedStyle(element).backgroundColor)

      await toggle.click()
      await expect(page.locator("html")).toHaveAttribute(
        "data-theme",
        oppositeTheme,
      )
      await expect(toggle).toHaveAccessibleName(
        `Switch to ${systemTheme} theme`,
      )
      await expect
        .poll(() =>
          page
            .locator("html")
            .evaluate((element) => getComputedStyle(element).backgroundColor),
        )
        .not.toBe(initialColor)
      expect(
        await page.evaluate(() => localStorage.getItem("yopem-ui-theme")),
      ).toBe(oppositeTheme)
      await page.reload()
      await expect(toggle).toBeEnabled()
      await expect(toggle).toHaveAccessibleName(
        `Switch to ${systemTheme} theme`,
      )
      await expect(page.locator("html")).toHaveAttribute(
        "data-theme",
        oppositeTheme,
      )
      await page.emulateMedia({ colorScheme: oppositeTheme })
      await page.emulateMedia({ colorScheme: systemTheme })
      await expect(page.locator("html")).toHaveAttribute(
        "data-theme",
        oppositeTheme,
      )
      await toggle.focus()
      await toggle.press("Space")
      await expect(page.locator("html")).toHaveAttribute(
        "data-theme",
        systemTheme,
      )
      await expect(toggle).toHaveAccessibleName(
        `Switch to ${oppositeTheme} theme`,
      )
      expect(errors).toEqual([])
    })
  }
}

test("header theme button stays at top right and sidebar keeps original style", async ({
  page,
}, testInfo) => {
  for (const width of [1440, 320]) {
    await page.setViewportSize({ width, height: 1000 })
    await page.goto("/docs/getting-started")

    const header = page.getByRole("banner")

    const toggle = header.getByRole("button", {
      name: /Switch to (dark|light) theme/,
    })

    const headerBox = await header.boundingBox()
    const toggleBox = await toggle.boundingBox()

    expect(headerBox).not.toBeNull()
    expect(toggleBox).not.toBeNull()

    if (!headerBox || !toggleBox)
      throw new Error("Header or theme button has no rendered bounds")

    expect(toggleBox.x + toggleBox.width).toBeGreaterThan(width - 48)
    expect(toggleBox.y).toBeGreaterThanOrEqual(headerBox.y)
    expect(toggleBox.y + toggleBox.height).toBeLessThanOrEqual(
      headerBox.y + headerBox.height,
    )
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width)

    if (width === 1440) {
      const current = page
        .getByRole("navigation", { name: "Documentation", exact: true })
        .getByRole("link", { name: "Getting started", exact: true })

      await expect(current).toHaveAttribute("aria-current", "page")
      await expect(current).toHaveCSS("box-shadow", "none")
      await expect(current).toHaveCSS("font-weight", "600")
    }

    await testInfo.attach(`original-navigation-${width}`, {
      body: await page.screenshot({ fullPage: true }),
      contentType: "image/png",
    })
  }
})
