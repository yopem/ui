import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

test.beforeEach(async ({ page }) => {
  test.slow()
  await page.goto("/editor/examples#public-document")
  const root = page.getByTestId("editor-example-public-document")
  await root.getByRole("button", { name: "Live preview", exact: true }).click()
  await expect(page.getByTestId("public-document-example")).toBeVisible()

  for (const name of [
    "HTML editor",
    "Markdown editor",
    "Streaming editor",
    "Markdown to Lexical editor",
  ]) {
    await expect(
      root.getByRole("textbox", { name, exact: true }),
    ).toHaveAttribute("contenteditable", "true")
  }
})

test("html: pastes rich rendered clipboard data and rejects unsafe source without data loss", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"])
  await page.evaluate(() => navigator.clipboard.writeText("Clipboard sentinel"))
  const example = page.getByTestId("public-document-html")

  const editor = example.getByRole("textbox", {
    name: "HTML editor",
    exact: true,
  })

  await example
    .getByRole("button", { name: "Copy rich HTML sample", exact: true })
    .click()
  await expect(example.getByRole("status")).toBeVisible()
  await editor.click()
  await editor.press("ControlOrMeta+V")
  await expect(editor.locator("strong")).toHaveText("Rich HTML")
  await expect(
    editor.getByRole("link", { name: "Reference", exact: true }),
  ).toHaveAttribute("href", "https://example.com/reference")
  await expect(editor.locator("blockquote blockquote")).toContainText(
    "Nested quote",
  )
  await expect(editor.locator("ul ul li")).toHaveText("Child")
  await expect(editor.getByRole("table").locator("th, td")).toHaveCount(4)

  await example
    .getByRole("textbox", { name: "HTML source", exact: true })
    .fill('<p style="position:fixed">Unsafe source</p>')
  await example
    .getByRole("button", { name: "Import HTML source", exact: true })
    .click()
  await expect(example.getByRole("alert")).toBeVisible()
  await expect(editor).not.toContainText("Unsafe source")
  await expect(editor.locator("strong")).toHaveText("Rich HTML")
})

test("markdown: imports GFM structure, exports it, and keeps unsupported input from replacing content", async ({
  page,
}, testInfo) => {
  const example = page.getByTestId("public-document-markdown")

  const editor = example.getByRole("textbox", {
    name: "Markdown editor",
    exact: true,
  })

  const source = example.getByRole("textbox", {
    name: "Markdown source",
    exact: true,
  })

  const syntaxPreview = example
    .getByTestId("public-document-markdown-source-preview")
    .getByRole("textbox", { name: "Markdown raw syntax preview", exact: true })

  await source.fill(
    "# Field report\n\nA **bold** statement with [a link](https://example.com/report).\n\n> First quote\n>\n> > Nested quote\n\n- Parent\n  - Child\n\n| Item | Status |\n| --- | --- |\n| Report | Ready |",
  )
  await expect(syntaxPreview).toContainText("# Field report")
  await expect(syntaxPreview).toContainText("**bold**")
  await example
    .getByRole("button", { name: "Import Markdown", exact: true })
    .click()
  await expect(
    editor.getByRole("heading", { name: "Field report" }),
  ).toBeVisible()
  await expect(editor.locator("strong")).toHaveText("bold")
  await expect(editor.locator("blockquote blockquote")).toContainText(
    "Nested quote",
  )
  await expect(editor.locator("ul ul li")).toHaveText("Child")
  await expect(editor.getByRole("table").locator("th, td")).toHaveCount(4)

  await example
    .getByRole("button", { name: "Export document", exact: true })
    .click()
  await expect(
    example.getByRole("textbox", { name: "Markdown output", exact: true }),
  ).toHaveValue(/Field report/)

  const convertedPreview = example.getByRole("region", {
    name: "Markdown converted preview",
    exact: true,
  })

  await expect(
    convertedPreview.getByRole("heading", { name: "Field report" }),
  ).toBeVisible()
  await expect(convertedPreview.locator("strong")).toHaveText("bold")
  await testInfo.attach("public-document-markdown.html", {
    body: await example
      .getByRole("textbox", { name: "HTML output", exact: true })
      .inputValue(),
    contentType: "text/html",
  })

  await source.fill("![unsupported image](https://example.com/image.png)")
  await example
    .getByRole("button", { name: "Import Markdown", exact: true })
    .click()
  await expect(example.getByRole("alert")).toBeVisible()
  await expect(
    editor.getByRole("heading", { name: "Field report" }),
  ).toBeVisible()
})

test("markdown-streaming: controls the local producer, commits at EOF, cancels, and rejects stale replacement", async ({
  page,
}) => {
  const example = page.getByTestId("public-document-markdown-streaming")

  const editor = example.getByRole("textbox", {
    name: "Streaming editor",
    exact: true,
  })

  const start = example.getByRole("button", {
    name: "Stream local Markdown",
    exact: true,
  })

  const scenario = example.getByRole("combobox", {
    name: "Stream scenario",
    exact: true,
  })

  const speed = example.getByRole("combobox", {
    name: "Producer speed",
    exact: true,
  })

  const position = example.getByRole("slider", {
    name: "Producer position",
    exact: true,
  })

  const selectedPosition = example.getByRole("status", {
    name: "Selected producer position",
    exact: true,
  })

  await scenario.selectOption("release-notes")
  await expect(
    example
      .getByTestId("public-document-markdown-stream-source")
      .getByRole("textbox", {
        name: "Raw Markdown source syntax preview",
        exact: true,
      }),
  ).toContainText("# Release notes")
  await example.getByRole("button", { name: "Next chunk", exact: true }).click()
  await expect(selectedPosition).toContainText("1 of")
  await example
    .getByRole("button", { name: "Previous chunk", exact: true })
    .click()
  await expect(selectedPosition).toContainText("0 of")
  await position.focus()
  await position.press("End")
  await expect(selectedPosition).not.toContainText("0 of")
  await position.press("Home")
  await expect(selectedPosition).toContainText("0 of")
  await speed.selectOption("80")
  await example
    .getByRole("button", { name: "Show stream progress", exact: true })
    .click()

  const output = example.getByRole("textbox", {
    name: "Streaming output",
    exact: true,
  })

  await start.click()
  await expect(output).not.toHaveValue("")
  await expect(editor).toContainText("Existing stream document")
  await expect(editor).not.toContainText("Release notes")
  await example
    .getByRole("button", { name: "Pause producer", exact: true })
    .click()
  const pausedOutput = await output.inputValue()
  await expect(
    example.getByRole("status", { name: "Producer state", exact: true }),
  ).toHaveText("Producer paused")
  await page.waitForTimeout(200)
  await expect(output).toHaveValue(pausedOutput)
  await example.getByRole("button", { name: "Next chunk", exact: true }).click()
  await expect(selectedPosition).toContainText("1 of")
  await example
    .getByRole("button", { name: "Restart at selected chunk", exact: true })
    .click()
  await expect(output).toHaveValue(/^# Release/)
  await expect(editor).toContainText("Existing stream document")
  await example
    .getByRole("button", { name: "Pause producer", exact: true })
    .click()
  const soughtOutput = await output.inputValue()
  await page.waitForTimeout(200)
  await expect(output).toHaveValue(soughtOutput)
  await example
    .getByRole("button", { name: "Resume producer", exact: true })
    .click()
  await expect(start).toBeEnabled()
  await expect(
    editor.getByRole("heading", { name: "Release notes" }),
  ).toBeVisible()

  const convertedPreview = example.getByRole("region", {
    name: "Streamed Markdown converted preview",
    exact: true,
  })

  await expect(
    convertedPreview.getByRole("heading", { name: "Release notes" }),
  ).toBeVisible()

  await start.click()
  await expect(output).not.toHaveValue("")
  await example
    .getByRole("button", { name: "Cancel stream", exact: true })
    .click()
  await expect(start).toBeEnabled()
  await expect(
    editor.getByRole("heading", { name: "Release notes" }),
  ).toBeVisible()

  await start.click()
  await expect(output).not.toHaveValue("")
  await editor.fill("Host edit wins")
  await expect(editor).toHaveText("Host edit wins")
  await expect(example.getByRole("alert")).toBeVisible()
})

test("markdown-to-lexical: keeps raw source while a debounced rich document replaces old content", async ({
  page,
}) => {
  const example = page.getByTestId("public-document-markdown-to-lexical")

  const editor = example.getByRole("textbox", {
    name: "Markdown to Lexical editor",
    exact: true,
  })

  const source = example.getByRole("textbox", {
    name: "Markdown to Lexical source",
    exact: true,
  })

  await expect(editor).toContainText("Initial rich value")
  await source.fill("# Converted document\n\nA **rich** Lexical value.")
  await expect(source).toHaveValue(
    "# Converted document\n\nA **rich** Lexical value.",
  )
  await expect(
    editor.getByRole("heading", { name: "Converted document" }),
  ).toBeVisible()
  await expect(editor.locator("strong")).toHaveText("rich")
  await expect(editor).not.toContainText("Initial rich value")
})

test("@a11y public document examples: initial states", async ({
  page,
}, testInfo) => {
  const example = page.getByTestId("public-document-example")

  for (const sectionName of [
    "public-document-html",
    "public-document-markdown",
    "public-document-markdown-streaming",
    "public-document-markdown-to-lexical",
  ]) {
    const section = example.getByTestId(sectionName)

    const report = await new AxeBuilder({ page })
      .include(`[data-testid="${sectionName}"]`)
      .analyze()

    await testInfo.attach(`${sectionName}-axe.json`, {
      body: JSON.stringify(report),
      contentType: "application/json",
    })
    expect(report.violations).toEqual([])
    await expect(section.getByRole("textbox").first()).toBeVisible()
  }
})
