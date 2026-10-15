import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

for (const theme of ["light", "dark"] as const) {
  for (const [slug, tag] of [
    ["aspect-ratio", "DIV"],
    ["list", "UL"],
    ["strong", "STRONG"],
    ["figcaption", "FIGCAPTION"],
  ] as const) {
    test(`@a11y ${slug} preserves semantics in ${theme}`, async ({ page }) => {
      await page.addInitScript(
        (value) => localStorage.setItem("yopem-ui-theme", value),
        theme,
      )
      await page.goto(`/components/${slug}`)
      const preview = page.getByLabel(/live preview$/).first()
      const element = preview.locator(`[data-slot="${slug}"]`).first()
      await expect(element).toBeVisible()
      await expect(element).toHaveJSProperty("tagName", tag)

      if (slug === "list") {
        await expect(preview.getByRole("list")).toHaveCount(2)
        await expect(preview.locator("ol")).toHaveAttribute("start", "3")
        await expect(preview.locator("ol")).toHaveAttribute("reversed", "")

        for (const [type, marker] of [
          ["a", "lower-alpha"],
          ["A", "upper-alpha"],
          ["i", "lower-roman"],
          ["I", "upper-roman"],
          ["1", "decimal"],
        ] as const) {
          await preview
            .locator("ol")
            .evaluate(
              (element, value) => element.setAttribute("type", value),
              type,
            )
          await expect(preview.locator("ol")).toHaveCSS(
            "list-style-type",
            marker,
          )
        }

        await expect(preview.locator("ol > li").first()).toHaveAttribute(
          "value",
          "7",
        )
        await expect(preview.getByRole("listitem").first()).toHaveAttribute(
          "data-slot",
          "list-item",
        )
      }

      if (slug === "figcaption") {
        await expect(preview.locator("figure > figcaption")).toHaveCount(1)
      }

      if (slug === "strong") {
        await expect(preview.locator("p > strong")).toHaveCount(1)
      }

      if (slug === "aspect-ratio") {
        for (const width of [320, 1024]) {
          await page.setViewportSize({ width, height: 800 })

          for (const [id, ratio] of [
            ["ratio-default", 16 / 9],
            ["ratio-square", 1],
            ["ratio-invalid", 16 / 9],
            ["ratio-override", 2],
          ] as const) {
            const box = await preview.getByTestId(id).boundingBox()
            expect(box).not.toBeNull()

            if (box) expect(box.width / box.height).toBeCloseTo(ratio, 1)
          }

          expect(
            await page.evaluate(() => document.documentElement.scrollWidth),
          ).toBeLessThanOrEqual(width)
        }
      }

      expect(
        (await new AxeBuilder({ page }).include("main").analyze()).violations,
      ).toEqual([])
    })
  }
}
