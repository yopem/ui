import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

const source =
  '<aside data-editor-callout="" data-appearance="info" data-icon="💡"><p>Callout</p></aside><details data-editor-toggle="" open><summary><a href="https://example.com" rel="noopener noreferrer" target="_blank">Summary link</a></summary><div data-editor-toggle-body=""><p>Body content</p></div></details>'

test("document block HTML and Markdown preserve native structure", async ({
  page,
}, info) => {
  await page.goto("/docs/editor")

  const editor = page.getByRole("textbox", {
    name: "Document editor",
    exact: true,
  })

  const html = page.getByRole("textbox", { name: "HTML source", exact: true })
  await html.fill(source)
  await page.getByRole("button", { name: "Import HTML", exact: true }).click()
  await expect(editor.locator("aside[data-editor-callout]")).toContainText(
    "Callout",
  )
  await expect(editor.locator("details > summary")).toContainText(
    "Summary link",
  )
  await expect(
    editor.locator("details > [data-editor-toggle-body]"),
  ).toContainText("Body content")
  await page
    .getByRole("button", { name: "Export document", exact: true })
    .click()

  const markdown = await page
    .getByRole("textbox", { name: "Markdown output", exact: true })
    .inputValue()

  await page
    .getByRole("textbox", { name: "Markdown source", exact: true })
    .fill(markdown)
  await page
    .getByRole("button", { name: "Import Markdown", exact: true })
    .click()
  await expect(editor.locator("details > summary a")).toHaveAttribute(
    "href",
    "https://example.com",
  )
  await expect(
    editor.locator("details > [data-editor-toggle-body]"),
  ).toContainText("Body content")
  await html.fill(
    '<details data-editor-toggle=""><summary>Missing body</summary></details>',
  )
  await page.getByRole("button", { name: "Import HTML", exact: true }).click()
  await expect(page.getByRole("alert")).toBeVisible()
  await expect(
    editor.locator("details > [data-editor-toggle-body]"),
  ).toContainText("Body content")
  await info.attach("block-markdown", {
    body: markdown,
    contentType: "text/markdown",
  })
  await page.screenshot({
    path: info.outputPath("document-blocks.png"),
    fullPage: true,
  })
})

test("@a11y document blocks in open and closed states", async ({
  page,
}, info) => {
  await page.goto("/docs/editor")

  for (const open of [true, false]) {
    await page
      .getByRole("textbox", { name: "HTML source", exact: true })
      .fill(open ? source : source.replace(" open", ""))
    await page.getByRole("button", { name: "Import HTML", exact: true }).click()
    await page
      .getByRole("button", { name: "Export document", exact: true })
      .click()

    const result = await new AxeBuilder({ page })
      .include('[aria-label="Document I/O example"]')
      .analyze()

    await info.attach(`document-blocks-${open ? "open" : "closed"}-axe.json`, {
      body: JSON.stringify(result),
      contentType: "application/json",
    })
    expect(result.violations).toEqual([])
  }
})
