import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

test("horizontal rules retain semantic Markdown, HTML and static output", async ({
  page,
}) => {
  test.slow()
  await page.goto("/docs/editor")
  const example = page.getByRole("region", { name: "Document I/O example" })

  const editor = example.getByRole("textbox", {
    name: "Document editor",
    exact: true,
  })

  await expect(editor).toHaveAttribute("contenteditable", "true")
  await example
    .getByRole("textbox", { name: "Markdown source", exact: true })
    .fill("Before rule\n\n---\n\nAfter rule")
  await example
    .getByRole("button", { name: "Import Markdown", exact: true })
    .click()
  await expect(editor.locator("hr")).toHaveCount(1)
  await expect(editor).toContainText("Before rule")
  await expect(editor).toContainText("After rule")
  await example
    .getByRole("button", { name: "Export document", exact: true })
    .click()

  const html = await example
    .getByRole("textbox", { name: "HTML output", exact: true })
    .inputValue()

  expect(
    await page.evaluate(
      (source) =>
        new DOMParser()
          .parseFromString(source, "text/html")
          .querySelectorAll("hr").length,
      html,
    ),
  ).toBe(1)
  await expect(
    example
      .getByRole("region", { name: "Static document", exact: true })
      .getByRole("separator"),
  ).toHaveCount(1)
  await expect(
    example.getByRole("textbox", { name: "Markdown output", exact: true }),
  ).toHaveValue(/(?:---|\*\*\*|___)/)
  await example
    .getByRole("textbox", { name: "HTML source", exact: true })
    .fill(html)
  await example
    .getByRole("button", { name: "Import HTML", exact: true })
    .click()
  await expect(editor.locator("hr")).toHaveCount(1)
  await expect(example.getByRole("alert")).toHaveCount(0)
  expect(
    (
      await new AxeBuilder({ page })
        .include('[aria-label="Document I/O example"]')
        .analyze()
    ).violations,
  ).toEqual([])
})

test("horizontal rule presentation metadata is rejected before replacement", async ({
  page,
}) => {
  await page.goto("/docs/editor")
  const example = page.getByRole("region", { name: "Document I/O example" })

  const editor = example.getByRole("textbox", {
    name: "Document editor",
    exact: true,
  })

  await expect(editor).toHaveAttribute("contenteditable", "true")
  await editor.fill("Keep current document")
  await example
    .getByRole("textbox", { name: "HTML source", exact: true })
    .fill('<hr data-editor-state="{}">')
  await example
    .getByRole("button", { name: "Import HTML", exact: true })
    .click()
  await expect(example.getByRole("alert")).toHaveCount(1)
  await expect(editor).toHaveText("Keep current document")
  await expect(editor).toHaveAttribute("contenteditable", "true")
})
