import { expect, test } from "@playwright/test"

test("public Markdown clipboard inserts a fragment and rejects invalid input", async ({
  page,
  context,
}, testInfo) => {
  test.slow()
  await page.goto("/editor/examples#public-document", {
    waitUntil: "domcontentloaded",
  })
  const root = page.getByTestId("editor-example-public-document")
  await root.getByRole("button", { name: "Live preview", exact: true }).click()
  await expect(page.getByTestId("public-document-example")).toBeVisible()
  await context.grantPermissions(["clipboard-read", "clipboard-write"], {
    origin: new URL(page.url()).origin,
  })

  const example = page.getByTestId("public-document-markdown")

  const editor = example.getByRole("textbox", {
    name: "Markdown editor",
    exact: true,
  })

  const source = example.getByRole("textbox", {
    name: "Markdown source",
    exact: true,
  })

  await expect(editor).toHaveAttribute("contenteditable", "true")
  await source.fill("**inserted**")
  await example
    .getByRole("button", {
      name: "Copy Markdown clipboard sample",
      exact: true,
    })
    .click()
  await expect(example.getByRole("status")).toHaveText(
    "Markdown clipboard sample copied.",
  )
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toBe("**inserted**")

  await page.evaluate(() => navigator.clipboard.writeText("**inserted**"))
  await expect(editor).toHaveAttribute("contenteditable", "true")
  await editor.fill("Keep original")
  await editor.press("Home")

  for (let index = 0; index < 5; index += 1) await editor.press("ArrowRight")

  await editor.press("ControlOrMeta+V")
  await expect(editor.locator("strong")).toHaveText("inserted")
  await expect(editor).toContainText("Keep insertedoriginal")

  await page.evaluate(() => navigator.clipboard.writeText(" \n "))
  await expect(editor).toHaveAttribute("contenteditable", "true")
  await editor.fill("Keep original")
  await editor.press("End")
  await editor.press("ControlOrMeta+Shift+ArrowLeft")
  await editor.press("ControlOrMeta+V")
  await expect(example.getByRole("alert")).toBeVisible()
  await expect(editor).toHaveText("Keep original")
  await expect
    .poll(() => page.evaluate(() => window.getSelection()?.toString() ?? ""))
    .toBe("original")

  const failureInputs = [
    "![unsupported](https://example.com/image.png)",
    " \n ",
  ]

  for (const input of failureInputs) {
    await source.fill(input)
    await example
      .getByRole("button", {
        name: "Copy Markdown clipboard sample",
        exact: true,
      })
      .click()
    await expect(editor).toHaveAttribute("contenteditable", "true")
    await editor.fill("Keep original")
    await editor.press("End")
    await editor.press("ControlOrMeta+Shift+ArrowLeft")
    await expect
      .poll(() => page.evaluate(() => window.getSelection()?.toString() ?? ""))
      .toBe("original")
    await editor.press("ControlOrMeta+V")
    await expect(example.getByRole("alert")).toBeVisible()
    await expect(editor).toHaveText("Keep original")
    await expect
      .poll(() => page.evaluate(() => window.getSelection()?.toString() ?? ""))
      .toBe("original")
  }

  await testInfo.attach("markdown-clipboard-fragment.json", {
    body: JSON.stringify({
      inserted: "**inserted**",
      failures: failureInputs,
      result: await editor.innerText(),
      retainedSelection: await page.evaluate(
        () => window.getSelection()?.toString() ?? "",
      ),
    }),
    contentType: "application/json",
  })
})

test("default document paste keeps plain Markdown syntax native", async ({
  page,
  context,
}) => {
  await page.goto("/editor/examples#public-document", {
    waitUntil: "domcontentloaded",
  })
  const root = page.getByTestId("editor-example-public-document")
  await root.getByRole("button", { name: "Live preview", exact: true }).click()
  await expect(page.getByTestId("public-document-example")).toBeVisible()
  await context.grantPermissions(["clipboard-read", "clipboard-write"], {
    origin: new URL(page.url()).origin,
  })

  const editor = page
    .getByTestId("public-document-html")
    .getByRole("textbox", { name: "HTML editor", exact: true })

  await expect(editor).toHaveAttribute("contenteditable", "true")
  await editor.fill("Keep original")
  await editor.press("End")
  await editor.press("ControlOrMeta+Shift+ArrowLeft")
  await page.evaluate(() => navigator.clipboard.writeText("**literal**"))
  await editor.press("ControlOrMeta+V")

  await expect(editor).toHaveText("Keep **literal**")
  await expect(editor.locator("strong")).toHaveCount(0)
})

test("HTML clipboard keeps precedence over plain Markdown", async ({
  page,
  context,
}) => {
  await page.goto("/editor/examples#public-document", {
    waitUntil: "domcontentloaded",
  })
  const root = page.getByTestId("editor-example-public-document")
  await root.getByRole("button", { name: "Live preview", exact: true }).click()
  await expect(page.getByTestId("public-document-example")).toBeVisible()
  await context.grantPermissions(["clipboard-read", "clipboard-write"], {
    origin: new URL(page.url()).origin,
  })

  const example = page.getByTestId("public-document-markdown")

  const editor = example.getByRole("textbox", {
    name: "Markdown editor",
    exact: true,
  })

  await page.evaluate(async () => {
    await navigator.clipboard.write([
      new ClipboardItem({
        "text/html": new Blob(["<p><strong>HTML wins</strong></p>"], {
          type: "text/html",
        }),
        "text/plain": new Blob(["**plain loses**"], { type: "text/plain" }),
      }),
    ])
  })
  await expect(editor).toHaveAttribute("contenteditable", "true")
  await editor.fill("Replace me")
  await editor.press("ControlOrMeta+A")
  await editor.press("ControlOrMeta+V")

  await expect(editor.locator("strong")).toHaveText("HTML wins")
  await expect(editor).not.toContainText("plain loses")
})

test("text/markdown MIME keeps precedence over text/plain when supported", async ({
  page,
  context,
}) => {
  await page.goto("/editor/examples#public-document", {
    waitUntil: "domcontentloaded",
  })
  const root = page.getByTestId("editor-example-public-document")
  await root.getByRole("button", { name: "Live preview", exact: true }).click()
  await expect(page.getByTestId("public-document-example")).toBeVisible()
  await context.grantPermissions(["clipboard-read", "clipboard-write"], {
    origin: new URL(page.url()).origin,
  })

  const supportsMarkdown = await page.evaluate(
    () => window.ClipboardItem?.supports?.("text/markdown") ?? false,
  )

  test.skip(
    !supportsMarkdown,
    "Browser does not support text/markdown clipboard data",
  )

  const example = page.getByTestId("public-document-markdown")

  const editor = example.getByRole("textbox", {
    name: "Markdown editor",
    exact: true,
  })

  await page.evaluate(async () => {
    await navigator.clipboard.write([
      new ClipboardItem({
        "text/markdown": new Blob(["*Markdown MIME wins*"], {
          type: "text/markdown",
        }),
        "text/plain": new Blob(["**plain loses**"], { type: "text/plain" }),
      }),
    ])
  })
  await expect(editor).toHaveAttribute("contenteditable", "true")
  await editor.fill("Replace me")
  await editor.press("ControlOrMeta+A")
  await editor.press("ControlOrMeta+V")

  await expect(editor.locator("em")).toHaveText("Markdown MIME wins")
  await expect(editor).not.toContainText("plain loses")
})

test("Markdown fragment paste respects host veto, history and read-only state", async ({
  page,
  context,
}) => {
  test.slow()
  await context.grantPermissions(["clipboard-read", "clipboard-write"])
  await page.goto("/editor/examples#public-document")
  await page
    .getByTestId("editor-example-public-document")
    .getByRole("button", { name: "Live preview", exact: true })
    .click()
  const example = page.getByTestId("public-document-markdown")

  const editor = example.getByRole("textbox", {
    name: "Markdown editor",
    exact: true,
  })

  await expect(editor).toHaveAttribute("contenteditable", "true")
  await expect(editor).toHaveAttribute("contenteditable", "true")
  await editor.fill("Keep original")
  await page.evaluate(() => navigator.clipboard.writeText("**inserted**"))
  await example
    .getByRole("button", { name: "Block Markdown paste", exact: true })
    .click()
  await editor.press("End")
  await editor.press("ControlOrMeta+Shift+ArrowLeft")
  await editor.press("ControlOrMeta+v")
  await expect(editor).toHaveText("Keep original")
  await example
    .getByRole("button", { name: "Allow Markdown paste", exact: true })
    .click()
  await editor.press("End")
  await editor.press("ControlOrMeta+Shift+ArrowLeft")
  await editor.press("ControlOrMeta+v")
  await expect(editor.locator("strong")).toHaveText("inserted")
  await expect(editor).toHaveText("Keep inserted")
  await editor.press("ControlOrMeta+z")
  await expect(editor).toHaveText("Keep original")
  await editor.press("ControlOrMeta+Shift+z")
  await expect(editor).toHaveText("Keep inserted")
  await example
    .getByRole("button", {
      name: "Make Markdown editor read-only",
      exact: true,
    })
    .click()
  await expect(editor).toHaveAttribute("contenteditable", "false")
  await editor.click()
  await page.keyboard.press("ControlOrMeta+v")
  await expect(editor).toHaveText("Keep inserted")
})
