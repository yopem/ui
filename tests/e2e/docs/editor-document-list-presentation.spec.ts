import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

test("document lists retain markers and signed starts through HTML and Markdown", async ({
  page,
}, testInfo) => {
  test.slow()
  await page.goto("/docs/editor#optional-document")
  const example = page.getByRole("region", { name: "Document I/O example" })
  const editor = example.getByRole("textbox", { name: "Document editor" })
  await expect(editor).toHaveAttribute("contenteditable", "true")

  const source =
    '<ol start="-2" data-editor-list-marker="lower-roman"><li>Outer item<ul data-editor-list-marker="square"><li>Nested item</li></ul></li></ol><ol start="0" data-editor-list-marker="upper-alpha"><li>Zero item</li></ol>'

  await example.getByLabel("HTML source").fill(source)
  await example
    .getByRole("button", { name: "Import HTML", exact: true })
    .click()
  const ordered = editor.locator("ol")
  await expect(ordered).toHaveCount(2)
  await expect(ordered.first()).toHaveAttribute("start", "-2")
  await expect(ordered.last()).toHaveAttribute("start", "0")
  await expect(ordered.first()).toHaveCSS("list-style-type", "lower-roman")
  await expect(ordered.last()).toHaveCSS("list-style-type", "upper-alpha")
  await expect(editor.locator("ul")).toHaveCSS("list-style-type", "square")

  await example
    .getByRole("button", { name: "Export document", exact: true })
    .click()
  const markdown = await example.getByLabel("Markdown output").inputValue()
  const html = await example.getByLabel("HTML output").inputValue()
  expect(html).toContain('data-editor-list-marker="lower-roman"')
  expect(html).toContain('start="-2"')
  expect(html).toContain('start="0"')
  await example.getByLabel("Markdown source").fill(markdown)
  await example
    .getByRole("button", { name: "Import Markdown", exact: true })
    .click()
  await expect(ordered.first()).toHaveAttribute("start", "-2")
  await expect(ordered.last()).toHaveAttribute("start", "0")
  await expect(ordered.first()).toHaveCSS("list-style-type", "lower-roman")
  await expect(editor.locator("ul")).toHaveCSS("list-style-type", "square")
  await expect(example.getByRole("alert")).toHaveCount(0)

  const before = await editor.innerText()
  await example
    .getByLabel("HTML source")
    .fill(
      '<ol data-editor-list-marker="lower-roman" style="list-style-type:upper-roman"><li>Rejected replacement</li></ol>',
    )
  await example
    .getByRole("button", { name: "Import HTML", exact: true })
    .click()
  await expect(example.getByRole("alert")).toBeVisible()
  await expect.poll(() => editor.innerText()).toBe(before)
  await expect(ordered.first()).toHaveAttribute("start", "-2")
  await expect(editor).toHaveAttribute("contenteditable", "true")
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  await testInfo.attach("document-list-presentation", {
    body: await example.screenshot({ scale: "css" }),
    contentType: "image/png",
  })
})
