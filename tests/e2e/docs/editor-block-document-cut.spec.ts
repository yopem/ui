import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

test.beforeEach(async ({ page, context }) => {
  test.slow()
  await page.goto("/docs/editor", { waitUntil: "domcontentloaded" })
  await context.grantPermissions(["clipboard-read", "clipboard-write"], {
    origin: new URL(page.url()).origin,
  })
  await expect(
    page.getByRole("textbox", { name: "Blocks editor", exact: true }),
  ).toHaveAttribute("contenteditable", "true")
})

for (const direction of ["forward", "backward"] as const) {
  test(`whole-document ${direction} cut preserves blocks and history @a11y`, async ({
    page,
  }, info) => {
    const errors: string[] = []
    page.on("pageerror", (error) => errors.push(error.message))

    const editor = page.getByRole("textbox", {
      name: "Blocks editor",
      exact: true,
    })

    const fixture =
      '<h2>Cut heading</h2><blockquote>Cut quote</blockquote><aside data-editor-callout="" data-appearance="info" data-icon="💡"><p><strong>Cut body</strong></p></aside>'

    await page.evaluate(async (html) => {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
        }),
      ])
    }, fixture)
    await editor.click()
    await page.keyboard.press("ControlOrMeta+v")
    await expect(editor.locator("h2")).toHaveText("Cut heading")
    await expect(editor.locator("blockquote")).toHaveText("Cut quote")
    await expect(editor.locator("aside strong")).toHaveText("Cut body")
    await editor.locator("h2").click()
    await page.keyboard.press(
      direction === "forward" ? "ControlOrMeta+Home" : "ControlOrMeta+End",
    )
    await page.keyboard.press(
      direction === "forward"
        ? "ControlOrMeta+Shift+End"
        : "ControlOrMeta+Shift+Home",
    )
    await page.keyboard.press("ControlOrMeta+x")
    await expect(editor).toHaveText("")
    await expect(editor.locator("h2, blockquote, aside")).toHaveCount(0)
    await expect(editor.locator(":scope > p")).toHaveCount(1)
    await page.keyboard.press("ControlOrMeta+z")
    await expect(editor.locator("h2")).toHaveText("Cut heading")
    await expect(editor.locator("blockquote")).toHaveText("Cut quote")
    await expect(editor.locator("aside strong")).toHaveText("Cut body")
    await page.keyboard.press("ControlOrMeta+Shift+z")
    await expect(editor).toHaveText("")
    await expect(editor.locator("h2, blockquote, aside")).toHaveCount(0)
    await page.keyboard.press("ControlOrMeta+v")
    await expect(editor.locator("h2")).toHaveText("Cut heading")
    await expect(editor.locator("blockquote")).toHaveText("Cut quote")
    await expect(editor.locator("aside strong")).toHaveText("Cut body")
    await expect(editor.locator("aside")).toHaveAttribute(
      "data-appearance",
      "info",
    )
    await expect(editor.locator("aside")).toHaveAttribute("data-icon", "💡")
    await expect(
      page.getByTestId("blocks-example").getByRole("alert"),
    ).toHaveCount(0)
    expect(
      (
        await new AxeBuilder({ page })
          .include('[data-testid="blocks-example"]')
          .analyze()
      ).violations,
    ).toEqual([])
    expect(errors).toEqual([])
    await info.attach("whole-document-cut-state.json", {
      body: await page
        .getByLabel("Blocks JSON", { exact: true })
        .getByRole("group", { name: "Code", exact: true })
        .innerText(),
      contentType: "application/json",
    })
  })
}
