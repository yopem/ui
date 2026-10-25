import { expect, test } from "@playwright/test"
import { z } from "zod"

const documentationSchema = z.object({
  parts: z.array(
    z.object({ name: z.string(), importPath: z.string().nullable() }),
  ),
})

const cases = [
  ["editor-docx", "parseDocx", "docx"],
  ["editor-docx", "importDocx", "docx"],
  ["editor-docx", "exportDocx", "docx"],
  ["editor-docx", "EditorDocxImportControl", "docx-controls"],
  ["editor-docx", "EditorDocxExportControl", "docx-controls"],
  ["editor-docx", "EditorDocxControls", "docx-controls"],
  ["editor-word-clipboard", "EditorWordClipboardExtension", "word-clipboard"],
  ["editor-word-clipboard", "registerWordClipboardPaste", "word-clipboard"],
  [
    "editor-word-clipboard",
    "normalizeWordClipboardHTML",
    "word-clipboard-model",
  ],
  ["editor-code-format", "formatEditorCode", "code-format"],
  ["editor-columns", "EditorColumnsControls", "columns"],
  ["editor-date", "EditorDateControls", "date"],
  ["editor-footnotes", "EditorFootnoteControls", "footnote"],
  ["editor-toc", "EditorTocControls", "toc"],
  ["editor-search", "EditorSearchRoot", "search"],
  ["editor-cursor-overlay", "EditorCursorOverlay", "cursor-overlay"],
  [
    "editor-cursor-overlay",
    "createEditorCursorOverlay",
    "cursor-overlay-store",
  ],
  ["editor-search", "findEditorSearchMatches", "search-model"],
] as const

for (const [item, name, module] of cases) {
  test(`${item} publishes its consumer entry`, async ({ request }) => {
    const response = await request.get(`/r/docs/${item}.json`)

    expect(response.status()).toBe(200)
    expect(response.headers()["content-type"]).toContain("application/json")

    const document = documentationSchema.parse(await response.json())
    const entry = document.parts.find((part) => part.name === name)

    expect(entry).toBeDefined()
    expect(entry?.importPath).toBe(`@/components/editor/${module}`)
  })
}
