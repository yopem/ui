import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Page } from "@playwright/test"

async function openExample(page: Page, slug: string) {
  test.slow()
  await page.goto(`/editor/examples#${slug}`)
  const section = page.getByTestId(`editor-example-${slug}`)
  await section
    .getByRole("button", { name: "Live preview", exact: true })
    .click()

  return page.getByTestId(`${slug}-example`)
}

test("footnote: typeahead preserves rich definitions, repeated references, unresolved IDs, and backlinks", async ({
  page,
}, testInfo) => {
  const example = await openExample(page, "public-footnotes")

  const editor = example.getByRole("textbox", {
    name: "Public footnotes editor",
    exact: true,
  })

  const references = editor.locator('[data-editor-footnote-reference="1"]')

  const duplicates = editor.locator(
    '[data-editor-footnote-definition="3"][data-editor-footnote-duplicate]',
  )

  await expect(editor).toHaveAttribute("contenteditable", "true")
  await expect(references).toHaveCount(2)
  await expect(
    editor.locator('[data-editor-footnote-reference="2"]'),
  ).toHaveCount(1)
  await expect(duplicates).toHaveCount(2)
  await expect(
    editor.getByRole("note").filter({ hasText: "Rich footnote body" }),
  ).toBeVisible()

  const editorReport = await new AxeBuilder({ page })
    .include('[data-testid="public-footnotes-example"]')
    .analyze()

  await testInfo.attach("public-footnotes-editor-a11y.json", {
    body: JSON.stringify(editorReport),
    contentType: "application/json",
  })
  expect(editorReport.violations).toEqual([])

  await editor.click()
  await editor.press("ControlOrMeta+End")
  await page.keyboard.type(" [^")

  const suggestions = page.getByRole("listbox", {
    name: "Footnote suggestions",
  })

  await expect(suggestions).toBeVisible()
  await suggestions
    .getByRole("option", { name: /^Footnote \[\^1\](?:\s|$)/ })
    .click()
  await expect(references).toHaveCount(3)
  await expect(duplicates).toHaveCount(2)
  await expect(
    editor.getByRole("button", {
      name: "Unresolved footnote reference 2",
      exact: true,
    }),
  ).toBeVisible()

  await example.getByRole("button", { name: "Footnote backlinks" }).click()

  const backlinks = page.getByRole("dialog", {
    name: "Footnote backlinks",
    exact: true,
  })

  await expect(
    backlinks.getByRole("button", { name: "Back to reference 3", exact: true }),
  ).toBeVisible()

  const report = await new AxeBuilder({ page })
    .include('[role="dialog"][aria-label="Footnote backlinks"]')
    .analyze()

  await testInfo.attach("public-footnotes-backlinks-a11y.json", {
    body: JSON.stringify(report),
    contentType: "application/json",
  })
  expect(report.violations).toEqual([])

  await backlinks
    .getByRole("button", { name: "Back to reference 3", exact: true })
    .click()
  await expect(editor).toBeFocused()
  await expect(references).toHaveCount(3)
})

test("toc: insertion follows heading edits, navigates within editor, and exports matching heading IDs", async ({
  page,
}, testInfo) => {
  const example = await openExample(page, "public-toc")

  const editor = example.getByRole("textbox", {
    name: "Public table of contents editor",
    exact: true,
  })

  await expect(editor).toHaveAttribute("contenteditable", "true")
  await editor
    .getByRole("heading", { name: "First steps", exact: true })
    .click()
  await example
    .getByRole("button", { name: "Insert table of contents", exact: true })
    .click()

  const contents = editor.getByRole("navigation", {
    name: "Table of contents",
    exact: true,
  })

  await expect(contents.getByRole("link")).toHaveCount(3)

  const firstSteps = editor.getByRole("heading", {
    name: "First steps",
    exact: true,
  })

  await firstSteps.click()
  await page.keyboard.press("Home")
  await page.keyboard.press("Shift+End")
  await page.keyboard.type("Revised first steps")
  await expect(
    contents.getByRole("link", { name: "Revised first steps", exact: true }),
  ).toBeVisible()

  const reference = contents.getByRole("link", {
    name: "Reference",
    exact: true,
  })

  await reference.evaluate((link) => {
    link.addEventListener(
      "click",
      function preventNavigation(event) {
        event.preventDefault()
      },
      { capture: true, once: true },
    )
  })
  await reference.click()
  await expect(
    editor.getByRole("heading", { name: "Reference", exact: true }),
  ).not.toBeFocused()
  await reference.click()
  await expect(
    editor.getByRole("heading", { name: "Reference", exact: true }),
  ).toBeFocused()
  await example
    .getByRole("button", { name: "Export document HTML", exact: true })
    .click()
  const exported = example.getByLabel("Exported document HTML", { exact: true })
  const html = await exported.innerText()

  const exportedHeading = await page.evaluate((source) => {
    const document = new DOMParser().parseFromString(source, "text/html")

    const heading = Array.from(document.querySelectorAll("h2")).find(
      (element) => element.textContent === "Revised first steps",
    )

    const id = heading?.id ?? ""

    const linked = Array.from(document.querySelectorAll("a")).some(
      (element) =>
        element.textContent === "Revised first steps" &&
        element.getAttribute("href") === `#${id}`,
    )

    return { id, linked }
  }, html)

  expect(exportedHeading.id).not.toBe("")
  expect(exportedHeading.linked).toBe(true)

  const report = await new AxeBuilder({ page })
    .include('[data-testid="public-toc-example"]')
    .analyze()

  await testInfo.attach("public-toc-a11y.json", {
    body: JSON.stringify(report),
    contentType: "application/json",
  })
  await testInfo.attach("public-toc-html-export.html", {
    body: html,
    contentType: "text/html",
  })
  expect(report.violations).toEqual([])
})
