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

test("header contains theme button without horizontal overflow", async ({
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

    if (!headerBox || !toggleBox)
      throw new Error("Header or theme button has no rendered bounds")

    expect(toggleBox.x).toBeGreaterThanOrEqual(headerBox.x)
    expect(toggleBox.x + toggleBox.width).toBeLessThanOrEqual(
      headerBox.x + headerBox.width,
    )
    expect(toggleBox.y).toBeGreaterThanOrEqual(headerBox.y)
    expect(toggleBox.y + toggleBox.height).toBeLessThanOrEqual(
      headerBox.y + headerBox.height,
    )
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width)

    await testInfo.attach(`header-theme-${width}`, {
      body: await page.screenshot({ fullPage: true }),
      contentType: "image/png",
    })
  }
})
