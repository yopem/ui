import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

for (const width of [1440, 768, 390]) {
  test(`@a11y editor layout contains wide table content at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 })
    await page.goto("/docs/editor")

    const editor = page.getByRole("textbox", {
      name: "Rich text editor",
      exact: true,
    })

    await expect(editor).toHaveAttribute("contenteditable", "true")
    await editor.fill("Viewport notes")
    await page
      .getByRole("toolbar", {
        name: "Rich text editor formatting",
        exact: true,
      })
      .getByRole("button", { name: "Insert table", exact: true })
      .click()
    const cells = await editor.getByRole("table").locator("th, td").all()

    for (const [index, cell] of cells.entries()) {
      await cell.click()
      await page.keyboard.insertText(
        index === 0 ? "LongCellContent".repeat(16) : `Cell ${index + 1}`,
      )
    }

    await editor.press("ControlOrMeta+Home")
    await expect
      .poll(() =>
        page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      )
      .toBe(true)
    const report = await new AxeBuilder({ page }).analyze()
    await testInfo.attach(`editor-layout-${width}-axe.json`, {
      body: JSON.stringify(report, null, 2),
      contentType: "application/json",
    })
    await testInfo.attach(`editor-preset-${width}.png`, {
      body: await page
        .getByTestId("preset-editor")
        .screenshot({ scale: "css" }),
      contentType: "image/png",
    })
    await testInfo.attach(`editor-layout-${width}.png`, {
      body: await page.screenshot({ scale: "css" }),
      contentType: "image/png",
    })
    expect(report.violations).toEqual([])
  })
}
