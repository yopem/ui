import { expect, test } from "@playwright/test"

for (const { systemTheme, savedTheme, blockedStorage, expectedTheme } of [
  {
    systemTheme: "dark",
    savedTheme: null,
    blockedStorage: false,
    expectedTheme: "dark",
  },
  {
    systemTheme: "light",
    savedTheme: "dark",
    blockedStorage: false,
    expectedTheme: "dark",
  },
  {
    systemTheme: "dark",
    savedTheme: "light",
    blockedStorage: false,
    expectedTheme: "light",
  },
  {
    systemTheme: "dark",
    savedTheme: "invalid",
    blockedStorage: false,
    expectedTheme: "dark",
  },
  {
    systemTheme: "dark",
    savedTheme: null,
    blockedStorage: true,
    expectedTheme: "dark",
  },
] as const) {
  test(`theme paints before deferred scripts with system ${systemTheme}, saved ${savedTheme}, and blocked storage ${blockedStorage}`, async ({
    page,
  }, testInfo) => {
    const errors: string[] = []
    page.on("pageerror", (error) => errors.push(error.message))
    await page.emulateMedia({ colorScheme: systemTheme })
    await page.addInitScript(
      ({ savedTheme, blockedStorage }) => {
        if (blockedStorage) {
          Object.defineProperty(window, "localStorage", {
            get() {
              throw new DOMException("Storage is blocked", "SecurityError")
            },
          })
        } else if (savedTheme !== null) {
          localStorage.setItem("yopem-ui-theme", savedTheme)
        }
      },
      { savedTheme, blockedStorage },
    )
    await page.route("**/*", async (route) => {
      const resourceType = route.request().resourceType()

      if (resourceType === "script") return route.abort()

      if (resourceType !== "document") return route.continue()

      const response = await route.fetch()
      const html = await response.text()

      // Model Rocket Loader while hydration scripts remain unavailable.
      const body = html.replace(
        /<script\b([^>]*)>/gi,
        (tag: string, attributes: string) => {
          if (/\bdata-cfasync=["']false["']/i.test(attributes)) return tag

          return `<script type="text/plain"${attributes.replace(/\stype\s*=/i, " data-deferred-type=")}>`
        },
      )

      await route.fulfill({ response, body })
    })

    await page.goto("/components/button")

    for (const visit of ["first-visit", "hard-reload"]) {
      if (visit === "hard-reload") await page.reload()
      await expect(page.locator("h1").first()).toBeVisible()
      await expect(page.locator("html")).toHaveAttribute(
        "data-theme",
        expectedTheme,
      )
      await expect(page.locator("html")).toHaveCSS(
        "color-scheme",
        expectedTheme,
      )
      await expect(
        page.getByRole("button", { name: /Switch to (dark|light) theme/ }),
      ).toBeDisabled()
      await testInfo.attach(`theme-${visit}`, {
        body: await page.screenshot(),
        contentType: "image/png",
      })
    }

    expect(errors).toEqual([])
  })
}

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
      const response = await page.goto(path)
      expect(response?.status(), path).toBe(200)
      await expect(page.locator("h1").first()).toBeVisible()
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
