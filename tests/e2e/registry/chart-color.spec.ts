import { expect, test } from "@playwright/test"

import { openPreview } from "./helpers"

interface LabelColors {
  text: string
  foreground: string
  background: string
  font: string
}

function luminance(color: string) {
  const channels = color.match(/[\d.]+/g)?.map(Number)

  if (!color.startsWith("rgb") || !channels || channels.length < 3)
    throw new Error(`Expected a resolved RGB color: ${color}`)

  const [red = 0, green = 0, blue = 0] = channels.slice(0, 3).map((channel) => {
    const value = channel / 255

    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  })

  return red * 0.2126 + green * 0.7152 + blue * 0.0722
}

for (const theme of ["light", "dark"] as const) {
  test(`pie labels remain readable in ${theme}`, async ({ page }, testInfo) => {
    await page.emulateMedia({ colorScheme: theme })
    await page.addInitScript(
      (value) => localStorage.setItem("yopem-ui-theme", value),
      theme,
    )
    await openPreview(page, "chart")

    const examples = page.getByRole("region", {
      name: "Pie examples",
      exact: true,
    })

    const regions = [
      page.getByRole("region", { name: "Pie chart", exact: true }),
      examples.getByRole("region", { name: "Pie Labels", exact: true }),
      examples.getByRole("region", { name: "Pie Custom labels", exact: true }),
    ]

    const checks: (LabelColors & { contrast: number })[] = []

    for (const region of regions) {
      const svg = region.locator("svg[role=img]").first()
      const labels = svg.locator("text").filter({ hasText: /%$/ })
      await expect(labels.first()).toBeVisible()

      const colors = await labels.evaluateAll((nodes) =>
        nodes.map((node) => {
          if (!(node instanceof SVGTextElement) || !node.ownerSVGElement)
            throw new Error("Expected an SVG chart label")

          const bounds = node.getBoundingClientRect()

          const center = new DOMPoint(
            bounds.x + bounds.width / 2,
            bounds.y + bounds.height / 2,
          )

          const paths = [
            ...node.ownerSVGElement.querySelectorAll("path"),
          ].reverse()

          const mark = paths.find((path) => {
            const matrix = path.getScreenCTM()

            return (
              matrix !== null &&
              getComputedStyle(path).fill !== "none" &&
              path.isPointInFill(center.matrixTransform(matrix.inverse()))
            )
          })

          const surface = node.closest('[data-slot="card"]')
          const background = mark ?? surface

          if (!background) throw new Error("Chart label background is missing")
          const style = getComputedStyle(node)

          return {
            text: node.textContent ?? "",
            foreground: style.fill,
            background: mark
              ? getComputedStyle(mark).fill
              : getComputedStyle(background).backgroundColor,
            font: style.fontFamily,
          }
        }),
      )

      expect(colors.length).toBeGreaterThan(0)

      for (const color of colors) {
        const foreground = luminance(color.foreground)
        const background = luminance(color.background)

        const contrast =
          (Math.max(foreground, background) + 0.05) /
          (Math.min(foreground, background) + 0.05)

        checks.push({ ...color, contrast })
        expect(
          contrast,
          `${color.text}: ${color.foreground} on ${color.background}`,
        ).toBeGreaterThanOrEqual(4.5)
      }
    }

    await testInfo.attach("chart-label-contrast", {
      body: JSON.stringify({ theme, checks }, null, 2),
      contentType: "application/json",
    })
    await page.screenshot({
      path: testInfo.outputPath(`pie-labels-${theme}.png`),
      scale: "css",
    })
  })
}
