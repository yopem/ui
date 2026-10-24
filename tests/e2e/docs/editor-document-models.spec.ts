import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

test("document conversion retains math and mention identities", async ({
  page,
}, testInfo) => {
  test.slow()
  await page.goto("/docs/editor#optional-document")
  const example = page.getByRole("region", { name: "Document I/O example" })
  const editor = example.getByRole("textbox", { name: "Document editor" })
  await expect(editor).toHaveAttribute("contenteditable", "true")

  const source =
    '<p>Equation <span data-editor-math="inline" data-editor-tex="x^2">x^2</span> for <span data-mention-id="ada" data-mention-label="Ada Lovelace">@Ada Lovelace</span>.</p>'

  await example.getByLabel("HTML source").fill(source)
  await example
    .getByRole("button", { name: "Import HTML", exact: true })
    .click()
  await expect(editor.locator('[data-editor-math="inline"]')).toHaveCount(1)
  await expect(editor.locator('[data-slot="editor-mention"]')).toHaveText(
    "@Ada Lovelace",
  )
  await example
    .getByRole("button", { name: "Export document", exact: true })
    .click()
  const markdown = await example.getByLabel("Markdown output").inputValue()
  expect(markdown).toContain("$x^2$")
  expect(markdown).toContain("mention:ada")
  await expect(example.getByLabel("HTML output")).toHaveValue(
    /data-mention-id="ada"/,
  )
  await example.getByLabel("Markdown source").fill(markdown)
  await example
    .getByRole("button", { name: "Import Markdown", exact: true })
    .click()
  await expect(editor.locator('[data-editor-math="inline"]')).toHaveAttribute(
    "data-editor-tex",
    "x^2",
  )
  await expect(editor.locator('[data-slot="editor-mention"]')).toHaveText(
    "@Ada Lovelace",
  )
  await expect(example.getByRole("alert")).toHaveCount(0)
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  await testInfo.attach("math-mention-document", {
    body: await example.screenshot({ scale: "css" }),
    contentType: "image/png",
  })
})
