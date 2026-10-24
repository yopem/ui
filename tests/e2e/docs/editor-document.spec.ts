import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"
import { readFile } from "node:fs/promises"

test.beforeEach(async ({ page }) => {
  await page.goto("/docs/editor")
})

test("document imports, exports, safe static output and downloads", async ({
  page,
}, info) => {
  const document = page.getByRole("textbox", {
    name: "Document editor",
    exact: true,
  })

  await expect(document).toBeVisible()
  await page
    .getByRole("textbox", { name: "Markdown source", exact: true })
    .fill(
      "# Report\n\n- [x] Done\n  - Nested\n\n| A | B |\n| --- | --- |\n| **C** | ~~D~~ |",
    )
  await page
    .getByRole("button", { name: "Import Markdown", exact: true })
    .click()
  await expect(document.getByRole("heading", { name: "Report" })).toBeVisible()
  await expect(document.getByRole("table")).toBeVisible()
  await page
    .getByRole("button", { name: "Export document", exact: true })
    .click()
  await expect(
    page.getByRole("textbox", { name: "HTML output", exact: true }),
  ).toHaveValue(/<table>/)
  await expect(
    page
      .getByRole("region", { name: "Static document" })
      .getByRole("heading", { name: "Report" }),
  ).toBeVisible()

  for (const name of ["Download Markdown", "Download HTML"]) {
    const pending = page.waitForEvent("download")
    await page.getByRole("button", { name, exact: true }).click()
    const download = await pending
    const path = info.outputPath(download.suggestedFilename())
    await download.saveAs(path)
    await info.attach(download.suggestedFilename(), { path })
    expect(await download.failure()).toBeNull()
    const content = await readFile(path, "utf8")
    expect(content).toContain("Report")
    expect(content).toContain(name === "Download HTML" ? 'style="' : "[x]")
  }

  await page
    .getByRole("textbox", { name: "HTML source", exact: true })
    .fill('<p onclick="alert(1)">Unsafe</p>')
  await page.getByRole("button", { name: "Import HTML", exact: true }).click()
  await expect(page.getByRole("alert")).toBeVisible()
  await expect(document.getByRole("heading", { name: "Report" })).toBeVisible()
})

test("stream cancellation, readonly and undo", async ({ page }) => {
  const document = page.getByRole("textbox", {
    name: "Document editor",
    exact: true,
  })

  await page
    .getByRole("textbox", { name: "Markdown source", exact: true })
    .fill("Original")
  await page
    .getByRole("button", { name: "Import Markdown", exact: true })
    .click()
  await page
    .getByRole("button", { name: "Stream Markdown", exact: true })
    .click()
  await expect(
    page.getByRole("textbox", { name: "Streaming output", exact: true }),
  ).not.toHaveValue("")
  await page.getByRole("button", { name: "Cancel stream", exact: true }).click()
  await expect(document).toHaveText("Original")
  await page
    .getByRole("textbox", { name: "Markdown source", exact: true })
    .fill("Changed")
  await page
    .getByRole("button", { name: "Import Markdown", exact: true })
    .click()
  await page.getByRole("button", { name: "Undo import", exact: true }).click()
  await expect(document).toHaveText("Original")
  await page
    .getByRole("button", { name: "Toggle readonly", exact: true })
    .click()
  await expect(document).toHaveAttribute("contenteditable", "false")
  await expect(
    page.getByRole("button", { name: "Import HTML", exact: true }),
  ).toBeDisabled()
})

test("@a11y initial, imported and static document states", async ({
  page,
}, info) => {
  for (const state of ["initial", "imported", "static"]) {
    if (state === "imported")
      await page
        .getByRole("button", { name: "Import Markdown", exact: true })
        .click()

    if (state === "static")
      await page
        .getByRole("button", { name: "Export document", exact: true })
        .click()

    const result = await new AxeBuilder({ page })
      .include('[aria-label="Document I/O example"]')
      .analyze()

    await info.attach(`document-${state}-axe.json`, {
      body: JSON.stringify(result),
      contentType: "application/json",
    })
    expect(result.violations).toEqual([])
  }
})

test("rich HTML metadata survives Markdown export and import", async ({
  page,
}, info) => {
  const html = `<p data-editor-indent="2" data-editor-block-presentation='{"lineHeight":"2","textIndent":"2em"}'><u>Under</u><mark>Mark</mark><span style="text-transform: uppercase">Case</span></p><table data-editor-col-widths="[120,160]"><tr data-editor-row-height="41.125" data-editor-state='{"documentRevision":3}'><td data-editor-border="hidden" colspan="2">Merged</td></tr></table>`
  await page
    .getByRole("textbox", { name: "HTML source", exact: true })
    .fill(html)
  await page.getByRole("button", { name: "Import HTML", exact: true }).click()
  await page
    .getByRole("button", { name: "Export document", exact: true })
    .click()

  const markdown = await page
    .getByRole("textbox", { name: "Markdown output", exact: true })
    .inputValue()

  await info.attach("rich-document.md", {
    body: markdown,
    contentType: "text/markdown",
  })
  await page
    .getByRole("textbox", { name: "Markdown source", exact: true })
    .fill(markdown)
  await page
    .getByRole("button", { name: "Import Markdown", exact: true })
    .click()
  await page
    .getByRole("button", { name: "Export document", exact: true })
    .click()
  const output = page.getByRole("textbox", { name: "HTML output", exact: true })
  await expect(output).toHaveValue(/data-editor-border="hidden"/)
  await expect(output).toHaveValue(/data-editor-row-height="41.125"/)
  await expect(output).toHaveValue(/data-editor-block-presentation=/)
  await expect(output).toHaveValue(/text-transform: uppercase/)
  await expect(
    page
      .getByRole("region", { name: "Static document" })
      .getByRole("cell", { name: "Merged" }),
  ).toHaveAttribute("colspan", "2")

  const row = page
    .getByRole("region", { name: "Static document" })
    .getByRole("row")

  await expect(row).toHaveAttribute("data-editor-row-height", "41.125")
  await expect(row).toHaveAttribute(
    "data-editor-state",
    '{"documentRevision":3}',
  )
})

test("maximum source table imports and oversized source preserves it", async ({
  page,
}, info) => {
  const source = page.getByRole("textbox", { name: "HTML source", exact: true })

  const document = page.getByRole("textbox", {
    name: "Document editor",
    exact: true,
  })

  const html = `<table>${Array.from({ length: 50 }, () => `<tr>${"<td><p>X</p></td>".repeat(50)}</tr>`).join("")}</table>`
  await source.fill(html)
  await page.getByRole("button", { name: "Import HTML", exact: true }).click()
  await expect(document.getByRole("cell")).toHaveCount(2500)
  await source.fill(`<table><tr>${"<td>X</td>".repeat(51)}</tr></table>`)
  await page.getByRole("button", { name: "Import HTML", exact: true }).click()
  await expect(page.getByRole("alert")).toBeVisible()
  await expect(document.getByRole("cell")).toHaveCount(2500)
  await info.attach("maximum-table.html", {
    body: html,
    contentType: "text/html",
  })
})

test("edits invalidate provisional stream without replacement", async ({
  page,
}) => {
  const document = page.getByRole("textbox", {
    name: "Document editor",
    exact: true,
  })

  await page
    .getByRole("textbox", { name: "Markdown source", exact: true })
    .fill("Provisional ".repeat(10))
  await page
    .getByRole("button", { name: "Stream Markdown", exact: true })
    .click()
  await expect(
    page.getByRole("textbox", { name: "Streaming output", exact: true }),
  ).not.toHaveValue("")
  await document.fill("New live edit")
  await expect(page.getByRole("alert")).toBeVisible()
  await expect(document).toHaveText("New live edit")
  await expect(
    page.getByRole("button", { name: "Stream Markdown", exact: true }),
  ).toBeEnabled()
})
