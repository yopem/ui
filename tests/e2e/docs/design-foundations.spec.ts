import { expect, test } from "@playwright/test"

import { openDocsPage } from "./helpers"

for (const theme of ["light", "dark"] as const) {
  test(`links and gallery previews follow the neutral design in ${theme}`, async ({
    page,
  }, testInfo) => {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" })
    await page.addInitScript(
      (value) => localStorage.setItem("yopem-ui-theme", value),
      theme,
    )
    await openDocsPage(page, "/")
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme)

    for (const component of ["Form", "Text"]) {
      const card = page.getByRole("region", { name: component, exact: true })

      await card.scrollIntoViewIfNeeded()
      await expect(
        card.getByRole("status", { name: /^Loading .* preview$/ }),
      ).toHaveCount(0)

      const viewport = card.getByRole("group", {
        name: `${component} live preview`,
        exact: true,
      })

      const content = viewport
        .getByTestId("homepage-preview")
        .locator(":scope > *")
        .first()

      const frame = await viewport.boundingBox()
      const preview = await content.boundingBox()

      const caption = await card
        .getByRole("heading", { name: component, exact: true })
        .boundingBox()

      expect(frame).not.toBeNull()
      expect(preview).not.toBeNull()
      expect(caption).not.toBeNull()
      expect(
        Math.abs(preview!.x + preview!.width / 2 - frame!.x - frame!.width / 2),
      ).toBeLessThanOrEqual(2)
      expect(
        Math.abs(
          preview!.y + preview!.height / 2 - frame!.y - frame!.height / 2,
        ),
      ).toBeLessThanOrEqual(2)
      expect(caption!.y).toBeGreaterThanOrEqual(frame!.y + frame!.height)
      await testInfo.attach(`${component.toLowerCase()}-${theme}`, {
        body: await card.screenshot(),
        contentType: "image/png",
      })
    }

    for (const path of ["/", "/docs/theming"]) {
      await openDocsPage(page, path)

      const link =
        path === "/"
          ? page.getByRole("link", { name: "Form source and API", exact: true })
          : page
              .getByRole("main")
              .getByRole("link", { name: "Installation", exact: true })
              .first()

      const colors = await link.evaluate((element) => {
        const probe = document.createElement("span")
        element.append(probe)
        probe.style.color = "var(--foreground)"

        const foreground = getComputedStyle(probe).color
        probe.style.color = "var(--muted-foreground)"

        const muted = getComputedStyle(probe).color
        probe.remove()

        return [foreground, muted]
      })

      expect(colors).toContain(
        await link.evaluate((element) => getComputedStyle(element).color),
      )
      await link.hover()

      const hoverColor = await link.evaluate(async (element) => {
        await Promise.all(
          element
            .getAnimations()
            .map((animation) => animation.finished.catch(() => undefined)),
        )

        return getComputedStyle(element).color
      })

      expect(colors).toContain(hoverColor)
    }
  })
}
