import type { Locator, Page } from "@playwright/test"

import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

async function openOptionalDocumentPreview(page: Page) {
  await page.goto("/editor/examples#public-optional-document")
  const section = page.getByTestId("editor-example-public-optional-document")
  await expect(section).toBeVisible()
  await section
    .getByRole("button", { name: "Live preview", exact: true })
    .click()
  const example = page.getByTestId("public-optional-document")
  await expect(example).toBeVisible()

  return example
}

async function expectOptionalDocumentData(example: Locator) {
  const json = await example
    .getByLabel("JSON source", { exact: true })
    .inputValue()

  for (const type of [
    "editor-footnote-reference",
    "editor-footnote-definition",
    "editor-toc",
    "editor-columns-group",
    "editor-date",
    "editor-label",
    "editor-drawing",
    "editor-editable-card",
  ])
    expect(json).toContain(`"type":"${type}"`)

  expect(json).toContain('"date":"2024-02-29"')
  expect(json).toContain('"layout":[50,50]')
  expect(json).toContain('"label":"Approved"')
  expect(json).toContain('"id":"source-rectangle"')
  expect(json).toContain('"editorDiagram":{"version":1,"kind":"mermaid"')
}

test("optional document reader edits, round-trips, and renders saved native data @a11y", async ({
  page,
}, testInfo) => {
  const example = await openOptionalDocumentPreview(page)

  const editor = example.getByRole("textbox", {
    name: "Optional codecs editor",
    exact: true,
  })

  await expect(editor).toBeEditable()
  await editor
    .getByText("Canonical document codecs retain native saved data", {
      exact: true,
    })
    .click()
  await page.keyboard.press("Control+End")
  await page.keyboard.press("Enter")
  await page.keyboard.type("Live edit marker")
  const liveEdit = editor.getByText("Live edit marker", { exact: true })
  await expect(liveEdit).toBeVisible()
  await example
    .getByRole("button", { name: "Export all formats", exact: true })
    .click()

  const jsonSource = example.getByLabel("JSON source", { exact: true })
  const htmlSource = example.getByLabel("HTML source", { exact: true })
  const markdownSource = example.getByLabel("Markdown source", { exact: true })
  await expectOptionalDocumentData(example)
  await expect(jsonSource).toHaveValue(/Live edit marker/)

  const html = await htmlSource.inputValue()
  expect(html).toContain("data-editor-footnote-reference")
  expect(html).toContain("data-editor-footnote-definition")
  expect(html).toContain("data-editor-toc")
  expect(html).toContain('data-editor-columns-layout="50,50"')
  expect(html).toContain('data-editor-date="1"')
  expect(html).toContain("yopem-editor-label")
  expect(html).toContain("data-editor-drawing-scene")
  expect(html).toContain("data-editor-editable-card")
  expect(html).toContain('data-editor-diagram-kind="mermaid"')

  const relations = await page.evaluate((source) => {
    const document = new DOMParser().parseFromString(source, "text/html")

    const headings = Array.from(
      document.querySelectorAll("h1, h2, h3, h4, h5, h6"),
    )

    const tocLinks = Array.from(
      document.querySelectorAll<HTMLAnchorElement>(
        'nav[data-editor-toc] a[href^="#"]',
      ),
    )

    const footnoteLinks = Array.from(
      document.querySelectorAll<HTMLAnchorElement>(
        'sup[data-editor-footnote-reference] a[href^="#"]',
      ),
    )

    return {
      tocValid:
        headings.length > 0 &&
        headings.length === tocLinks.length &&
        tocLinks.every((link, index) => {
          const target = document.getElementById(
            link.getAttribute("href")?.slice(1) ?? "",
          )

          return (
            target === headings[index] &&
            target.textContent?.replace(/\s+/g, " ").trim() ===
              link.textContent?.replace(/\s+/g, " ").trim()
          )
        }),
      footnotesValid:
        footnoteLinks.length > 0 &&
        footnoteLinks.every((link) => {
          const target = document.getElementById(
            link.getAttribute("href")?.slice(1) ?? "",
          )

          return (
            target?.getAttribute("data-editor-footnote-definition") ===
            link.closest("sup")?.getAttribute("data-editor-footnote-reference")
          )
        }),
    }
  }, html)

  expect(relations).toEqual({ tocValid: true, footnotesValid: true })

  const markdown = await markdownSource.inputValue()
  expect(markdown).toContain("data-editor-footnote-reference")
  expect(markdown).toContain("data-editor-toc")
  expect(markdown).toContain("data-editor-columns-layout")
  expect(markdown).toContain("data-editor-date")
  expect(markdown).toContain("data-editor-label")
  expect(markdown).toContain("data-editor-drawing-scene")
  expect(markdown).toContain("data-editor-editable-card")
  expect(markdown).toContain("data-editor-diagram-kind")

  const staticPreview = example.getByRole("region", {
    name: "Optional codec static preview",
    exact: true,
  })

  await expect(staticPreview.locator("nav[data-editor-toc]")).toBeVisible()
  await expect(staticPreview.locator("time[data-editor-date]")).toHaveAttribute(
    "datetime",
    "2024-02-29",
  )
  const drawing = staticPreview.locator("figure[data-editor-drawing]")
  await expect(drawing).toBeVisible()
  await expect(drawing).toHaveAttribute(
    "data-editor-drawing-scene",
    /source-rectangle/,
  )
  await expect(
    staticPreview.locator("figure[data-editor-editable-card]"),
  ).toBeVisible()
  await expect(
    staticPreview.locator("pre[data-editor-diagram] code"),
  ).toContainText("Source --> Canonical formats")
  await expect(staticPreview.locator("svg, img")).toHaveCount(0)

  for (const format of ["JSON", "HTML", "Markdown"] as const) {
    await example
      .getByRole("button", { name: `Import ${format}`, exact: true })
      .click()
    await expect(liveEdit).toBeVisible()
    await example
      .getByRole("button", { name: "Export all formats", exact: true })
      .click()
    await expectOptionalDocumentData(example)
    await expect(jsonSource).toHaveValue(/Live edit marker/)
  }

  await expect(
    editor.getByRole("navigation", { name: "Table of contents", exact: true }),
  ).toBeVisible()
  await expect(staticPreview.getByRole("navigation")).toHaveAccessibleName(
    "Optional codec static preview: Table of contents",
  )

  const axe = await new AxeBuilder({ page })
    .include('[data-testid="public-optional-document"]')
    .analyze()

  expect(axe.violations).toEqual([])
  await testInfo.attach("optional-document-reader-axe.json", {
    body: JSON.stringify(axe),
    contentType: "application/json",
  })
  await testInfo.attach("optional-document-reader.png", {
    body: await example.screenshot({ scale: "css" }),
    contentType: "image/png",
  })
  await testInfo.attach("optional-document-reader.json", {
    body: await jsonSource.inputValue(),
    contentType: "application/json",
  })
  await testInfo.attach("optional-document-reader.html", {
    body: await htmlSource.inputValue(),
    contentType: "text/html",
  })
  await testInfo.attach("optional-document-reader.md", {
    body: await markdownSource.inputValue(),
    contentType: "text/markdown",
  })
})

test("optional document reader rejects malformed and read-only imports without changing content", async ({
  page,
}) => {
  const example = await openOptionalDocumentPreview(page)

  const editor = example.getByRole("textbox", {
    name: "Optional codecs editor",
    exact: true,
  })

  const jsonSource = example.getByLabel("JSON source", { exact: true })

  const exportButton = example.getByRole("button", {
    name: "Export all formats",
    exact: true,
  })

  await exportButton.click()
  const before = await jsonSource.inputValue()
  await expectOptionalDocumentData(example)

  await jsonSource.fill("{not valid JSON}")
  await example
    .getByRole("button", { name: "Import JSON", exact: true })
    .click()
  await expect(example.getByRole("alert")).toBeVisible()
  await exportButton.click()
  await expect(jsonSource).toHaveValue(before)

  await example
    .getByRole("button", { name: "Make editor read-only", exact: true })
    .click()
  await expect(editor).toHaveAttribute("contenteditable", "false")
  await example
    .getByRole("button", { name: "Import HTML", exact: true })
    .click()
  await expect(example.getByRole("alert")).toBeVisible()
  await exportButton.click()
  await expect(jsonSource).toHaveValue(before)
})
