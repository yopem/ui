import { expect, test } from "@playwright/test"

for (const kind of ["footnotes", "literal marker"] as const) {
  test(`native clipboard preserves ${kind}`, async ({
    page,
    context,
  }, testInfo) => {
    test.slow()
    await context.grantPermissions(["clipboard-read", "clipboard-write"])
    await page.goto("/editor/footnote-controls")

    const editor = page.getByRole("textbox", {
      name: "Footnote editor",
      exact: true,
    })

    await expect(editor).toHaveAttribute("contenteditable", "true")

    if (kind === "literal marker") {
      await editor.fill("Literal editor-footnote- marker")
      await editor.click()
      await editor.press("ControlOrMeta+A")
      await editor.press("ControlOrMeta+C")
      await editor.press("ControlOrMeta+End")
      await editor.press("End")
      await page.keyboard.type(" | ")
      await editor.press("ControlOrMeta+V")
      await expect(editor).toHaveText(
        "Literal editor-footnote- marker | Literal editor-footnote- marker",
      )
    } else {
      const references = editor.locator("[data-editor-footnote-reference]")
      const definitions = editor.locator("[data-editor-footnote-definition]")
      await expect(references).toHaveCount(3)
      const initialDefinitions = await definitions.count()
      await editor.click()
      await editor.press("ControlOrMeta+Home")
      await editor.press("ControlOrMeta+A")
      await editor.press("ControlOrMeta+C")
      await editor.press("ControlOrMeta+End")
      await editor.press("Enter")
      await editor.press("ControlOrMeta+V")
      await expect(references).toHaveCount(6)
      await expect(definitions).toHaveCount(initialDefinitions * 2)
      await page.getByRole("button", { name: "Undo", exact: true }).click()
      await expect(references).toHaveCount(3)
      await expect(definitions).toHaveCount(initialDefinitions)
    }

    await testInfo.attach("footnote-clipboard-state", {
      body: await editor.innerHTML(),
      contentType: "text/html",
    })
  })
}
