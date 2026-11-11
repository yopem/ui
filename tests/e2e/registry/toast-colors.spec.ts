import { expect, test } from "@playwright/test"

import { openPreview } from "./helpers"

for (const theme of ["light", "dark"] as const) {
  test(`toast surfaces and status colors use semantic tokens in ${theme} theme`, async ({
    page,
  }, testInfo) => {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" })
    await page.addInitScript(
      (value) => localStorage.setItem("yopem-ui-theme", value),
      theme,
    )
    await openPreview(page, "toast")
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme)

    const trigger = page.getByRole("button", {
      name: "Default Toast",
      exact: true,
    })

    await trigger.click()
    await trigger.click()
    const roots = page.locator('[data-slot="toast-root"]')
    await expect(roots).toHaveCount(2)

    const surfaces = await roots.evaluateAll((elements) => {
      const probe = document.createElement("div")
      probe.style.backgroundColor = "var(--popover)"
      document.documentElement.append(probe)
      const expected = getComputedStyle(probe).backgroundColor
      probe.remove()

      return elements.map((element) => ({
        background: getComputedStyle(element).backgroundColor,
        bevel: getComputedStyle(element, "::before").boxShadow,
        expected,
      }))
    })

    for (const surface of surfaces) {
      expect(surface.expected).not.toBe("rgba(0, 0, 0, 0)")
      expect(surface.background).toBe(surface.expected)
      expect(surface.bevel).toBe("none")
    }

    await testInfo.attach(`toast-default-${theme}`, {
      body: await page.screenshot(),
      contentType: "image/png",
    })
    await expect(roots).toHaveCount(0, { timeout: 15_000 })

    for (const [name, type, token] of [
      ["Success Toast", "success", "--success"],
      ["Error Toast", "error", "--destructive-foreground"],
      ["Info Toast", "info", "--info"],
      ["Warning Toast", "warning", "--warning"],
    ] as const) {
      await page.getByRole("button", { name, exact: true }).click()
      const root = page.locator('[data-slot="toast-root"]')
      await expect(root).toHaveCount(1)

      const icon = root.locator(
        `[data-slot="toast-icon"] [data-toast-type="${type}"]`,
      )

      await expect(icon).toBeVisible()

      const colors = await icon.evaluate((element, tokenName) => {
        const probe = document.createElement("div")
        probe.style.color = `var(${tokenName})`
        probe.style.backgroundColor = "var(--popover)"
        document.documentElement.append(probe)

        const result = {
          icon: getComputedStyle(element).color,
          expectedIcon: getComputedStyle(probe).color,
          background: getComputedStyle(
            element.closest('[data-slot="toast-root"]')!,
          ).backgroundColor,
          expectedBackground: getComputedStyle(probe).backgroundColor,
        }

        probe.remove()

        return result
      }, token)

      expect(colors.icon).toBe(colors.expectedIcon)
      expect(colors.background).toBe(colors.expectedBackground)
      await testInfo.attach(`toast-${type}-${theme}`, {
        body: await page.screenshot(),
        contentType: "image/png",
      })
      await root
        .getByRole("button", { name: "Dismiss notification", exact: true })
        .click()
      await expect(root).toHaveCount(0)
    }

    await page
      .getByRole("button", { name: "Anchored Toast", exact: true })
      .click()
    const anchored = page.locator('[data-slot="toast-popup"]')
    await expect(anchored).toBeVisible()

    const anchoredSurface = await anchored.evaluate((element) => {
      const probe = document.createElement("div")
      probe.style.backgroundColor = "var(--popover)"
      document.documentElement.append(probe)

      const result = {
        background: getComputedStyle(element).backgroundColor,
        expected: getComputedStyle(probe).backgroundColor,
        bevel: getComputedStyle(element, "::before").boxShadow,
      }

      probe.remove()

      return result
    })

    expect(anchoredSurface.expected).not.toBe("rgba(0, 0, 0, 0)")
    expect(anchoredSurface.background).toBe(anchoredSurface.expected)
    expect(anchoredSurface.bevel).toBe("none")
    await testInfo.attach(`toast-anchored-${theme}`, {
      body: await page.screenshot(),
      contentType: "image/png",
    })
  })
}
