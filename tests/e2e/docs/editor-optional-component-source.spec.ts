import { expect, test } from "@playwright/test"

const examples = [
  { item: "editor-code", entry: "code", identifier: "EditorCode" },
  { item: "editor-csv", entry: "csv", identifier: "EditorCsvExtension" },
  { item: "editor-search", entry: "search", identifier: "EditorSearchRoot" },
  {
    item: "editor-cursor-overlay",
    entry: "cursor-overlay",
    identifier: "EditorCursorOverlay",
  },
  {
    item: "editor-columns",
    entry: "columns",
    identifier: "EditorColumnsExtension",
  },
  { item: "editor-date", entry: "date", identifier: "EditorDateExtension" },
  {
    item: "editor-drawing",
    entry: "drawing",
    identifier: "EditorDrawingInsertButton",
  },
  { item: "editor-media", entry: "media", identifier: "MediaInsertControl" },
  {
    item: "editor-footnotes",
    entry: "footnote",
    identifier: "EditorFootnoteExtension",
  },
  { item: "editor-toc", entry: "toc", identifier: "EditorTocExtension" },
  {
    item: "editor-word-clipboard",
    entry: "word-clipboard",
    identifier: "registerWordClipboardPaste",
  },
  { item: "editor-review", entry: "review", identifier: "createEditorReview" },
  {
    item: "editor-block-selection",
    entry: "block-selection-index",
    identifier: "createEditorBlockSelection",
  },
] as const

for (const example of examples) {
  test(`${example.item} copies a complete consumer preview`, async ({
    page,
    context,
  }, testInfo) => {
    test.slow()
    await page.goto(`/components/${example.item}`)
    await context.grantPermissions(["clipboard-read", "clipboard-write"], {
      origin: new URL(page.url()).origin,
    })
    const copy = page.getByRole("button", { name: /^Copy .+ source$/u }).first()
    await expect(copy).toBeEnabled()
    await page.evaluate(() =>
      navigator.clipboard.writeText("Clipboard sentinel"),
    )
    await copy.click()
    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toContain(`@/components/editor/${example.entry}`)
    const source = await page.evaluate(() => navigator.clipboard.readText())
    expect(source).toContain(`@/components/editor/${example.entry}`)
    expect(source).toContain(example.identifier)
    expect(source).not.toMatch(
      /from\s+["'](?:\.{1,2}\/|@\/catalog\/|@registry\/|@workspace\/|@yopem-ui\/)/u,
    )

    if (example.item === "editor-code") {
      expect(source).not.toContain("prettier")
      expect(source).not.toContain("/code-format")
    }

    if (example.item === "editor-toc") {
      expect(source).not.toContain("typeahead-index")
    }

    await testInfo.attach(`${example.item}-consumer-preview.tsx`, {
      body: source,
      contentType: "text/plain",
    })
  })
}

for (const part of [
  {
    slug: "media-insert-control",
    name: "MediaInsertControl",
    renderer: true,
  },
  { slug: "media-content", name: "MediaContent", renderer: false },
] as const) {
  test(`${part.name} copies a closed consumer preview`, async ({
    page,
    context,
  }, testInfo) => {
    await page.goto(`/editor/${part.slug}`)
    await context.grantPermissions(["clipboard-read", "clipboard-write"], {
      origin: new URL(page.url()).origin,
    })

    const copy = page.getByRole("button", {
      name: `Copy ${part.name} usage`,
      exact: true,
    })

    await expect(copy).toBeEnabled()
    await copy.click()

    const source = await page.evaluate(() => navigator.clipboard.readText())

    expect(source).toContain("@/components/editor/media")
    expect(source).toContain(part.name)
    expect(source).not.toMatch(
      /from\s+["'](?:\.{1,2}\/|@\/catalog\/|@registry\/|@workspace\/|@yopem-ui\/)/u,
    )

    if (part.renderer) {
      expect(source).toContain("MediaExtension")
      expect(source).toContain("EditorRoot")
      expect(source).not.toContain("@/components/ui/heading")
    } else {
      expect(source).not.toContain("MediaExtension")
      expect(source).not.toContain("EditorRoot")
    }

    await testInfo.attach(`${part.slug}-consumer-preview.tsx`, {
      body: source,
      contentType: "text/plain",
    })
  })
}
