import { exportDocument, importDocument, parseDocument } from "@editor/document"
import { createDocumentEditor } from "@editor/document/convert"
import { parseMedia } from "@yopem-ui/editor/media/schema"
import { describe, expect, test } from "bun:test"

const invalidMetadata = [
  { uploadKind: "embed" },
  { uploadKind: "unknown" },
  { file: "bytes" },
  { progress: 40 },
  { callback: "resume" },
  { url: "https://user:secret@host.test/file" },
  { children: [] },
] as const

function source(patch?: (typeof invalidMetadata)[number]) {
  return JSON.stringify({
    root: {
      type: "root",
      version: 1,
      children: [
        {
          type: "editor-media-placeholder",
          version: 1,
          uploadKind: "file",
          ...patch,
        },
      ],
      direction: null,
      format: "",
      indent: 0,
    },
  })
}

for (const suffix of ["?", "#"] as const) {
  test(`legacy ordinary media preserves empty ${suffix} in portable formats`, () => {
    const url = `https://media.test/audio.mp3${suffix}`
    const trackUrl = `https://media.test/captions.vtt${suffix}`
    const editor = createDocumentEditor()

    const input = JSON.stringify({
      root: {
        type: "root",
        version: 1,
        direction: null,
        format: "",
        indent: 0,
        children: [
          {
            type: "yopem-media",
            version: 1,
            media: parseMedia({ kind: "audio", url, trackUrl }),
          },
        ],
      },
    })

    importDocument(editor, input, "json")
    const expected = parseDocument(exportDocument(editor, "json"), "json")
    expect(JSON.stringify(expected)).toContain(url)
    expect(JSON.stringify(expected)).toContain(trackUrl)

    for (const format of ["json", "html", "markdown"] as const) {
      const output = exportDocument(editor, format)
      expect(parseDocument(output, format)).toEqual(expected)
      const restored = createDocumentEditor()
      importDocument(restored, output, format)
      expect(parseDocument(exportDocument(restored, "json"), "json")).toEqual(
        expected,
      )
    }
  })
}

describe("inert media placeholder document readers", () => {
  test("JSON HTML and Markdown retain canonical kind without task data", () => {
    const editor = createDocumentEditor()
    importDocument(editor, source(), "json")
    const expected = parseDocument(exportDocument(editor, "json"), "json")

    for (const format of ["json", "html", "markdown"] as const)
      expect(parseDocument(exportDocument(editor, format), format)).toEqual(
        expected,
      )
  })

  for (const patch of invalidMetadata) {
    test(`rejects transient or malformed metadata ${JSON.stringify(patch)}`, () => {
      expect(() => parseDocument(source(patch), "json")).toThrow()
    })
  }
})
