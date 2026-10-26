import { createDocumentEditor } from "@editor/document/convert"
import { createHeadlessEditor } from "@lexical/headless"
import {
  DocumentError,
  exportDocument,
  htmlDocument,
  importDocument,
  parseDocument,
  streamMarkdown,
} from "@yopem-ui/editor/document"
import { serializeMediaHtml } from "@yopem-ui/editor/media/html"
import { parseMedia } from "@yopem-ui/editor/media/schema"
import { describe, expect, test } from "bun:test"

const values = [
  parseMedia({
    kind: "image",
    url: "https://example.com/photo.png",
    alt: "Photo",
    caption: "Caption <safe>",
    width: 640,
    alignment: "end",
  }),
  parseMedia({
    kind: "audio",
    url: "https://example.com/audio.mp3",
    alt: "Audio",
    trackUrl: "https://example.com/captions.vtt",
  }),
  parseMedia({
    kind: "video",
    url: "https://example.com/video.mp4",
    alt: "Video",
    trackUrl: "https://example.com/captions.vtt",
    alignment: "center",
  }),
  parseMedia({
    kind: "file",
    url: "https://example.com/file.pdf",
    name: "File <safe>.pdf",
  }),
  parseMedia({
    kind: "embed",
    url: "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
    alt: "Video embed",
  }),
] as const

function documentJSON(
  media: Record<string, string | number | boolean | undefined>,
) {
  return JSON.stringify({
    root: {
      type: "root",
      version: 1,
      children: [{ type: "yopem-media", version: 1, media }],
      direction: null,
      format: "",
      indent: 0,
    },
  })
}

describe("document media fidelity", () => {
  for (const media of values) {
    test(`retains native ${media.kind} through JSON, HTML and Markdown`, () => {
      const editor = createDocumentEditor()
      importDocument(editor, documentJSON(media), "json")
      const expected = parseDocument(exportDocument(editor, "json"), "json")

      for (const format of ["json", "html", "markdown"] as const) {
        expect(parseDocument(exportDocument(editor, format), format)).toEqual(
          expected,
        )
      }

      expect(exportDocument(editor, "markdown")).toContain("data-yopem-media")
      expect(htmlDocument(editor)).toContain("data-yopem-media")
      expect(parseDocument(serializeMediaHtml(media), "html")).toEqual(expected)
    })
  }

  test("retains media beside math, mentions and native block presentation", () => {
    const editor = createDocumentEditor()
    importDocument(
      editor,
      `<p style="text-align: center; line-height: 2">Before <span data-editor-math="inline" data-editor-tex="x^2">x^2</span><span data-mention-id="ada" data-mention-label="Ada">@Ada</span></p>${values.map(serializeMediaHtml).join("")}`,
      "html",
    )
    const expected = parseDocument(exportDocument(editor, "json"), "json")

    for (const format of ["html", "markdown"] as const)
      expect(parseDocument(exportDocument(editor, format), format)).toEqual(
        expected,
      )
    expect(htmlDocument(editor)).toContain("<math")
  })

  for (const media of [
    { ...values[0], url: "javascript:alert(1)" },
    { ...values[0], url: "https://user:secret@example.com/a" },
    { ...values[0], url: "https://example.com/a?token=secret" },
    { ...values[0], trackUrl: "https://example.com/a?signature=secret" },
    { ...values[0], width: 4097 },
    { ...values[0], alignment: "left" },
    { ...values[0], unexpected: true },
    { ...values[4], url: "https://evil.example/embed/dQw4w9WgXcQ" },
  ]) {
    test(`rejects malformed media ${JSON.stringify(media)}`, () => {
      expect(() => parseDocument(documentJSON(media), "json")).toThrow(
        DocumentError,
      )
    })
  }

  for (const html of [
    '<img src="https://example.com/a.png" alt="Photo">',
    '<video src="https://example.com/a.mp4" controls></video>',
    '<iframe src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"></iframe>',
    '<figure data-yopem-media="null"></figure>',
    serializeMediaHtml(values[0]).replace('alt="Photo"', 'alt="Other"'),
    serializeMediaHtml(values[0]).replace("<img ", '<img onerror="alert(1)" '),
    serializeMediaHtml(values[4]).replace(
      'href="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"',
      'href="https://evil.example/embed/dQw4w9WgXcQ"',
    ),
    serializeMediaHtml(values[0]).replace(
      "</figure>",
      "<p>Hidden content</p></figure>",
    ),
  ]) {
    test(`rejects noncanonical HTML ${html}`, () => {
      expect(() => parseDocument(html, "html")).toThrow(DocumentError)
      expect(() => parseDocument(html, "markdown")).toThrow(DocumentError)
    })
  }

  test("rejects absent target registration and readonly imports without replacement", () => {
    const editor = createHeadlessEditor({
      namespace: "no-media",
      onError(error) {
        throw error
      },
    })

    const original = editor.getEditorState()
    expect(() =>
      importDocument(editor, serializeMediaHtml(values[0]), "html"),
    ).toThrow(DocumentError)
    expect(editor.getEditorState()).toBe(original)
    const reader = createDocumentEditor()
    reader.setEditable(false)
    const before = reader.getEditorState()
    expect(() =>
      importDocument(reader, documentJSON(values[0]), "json"),
    ).toThrow(DocumentError)
    expect(reader.getEditorState()).toBe(before)
  })

  test("cancellation and stale streaming keep host content", async () => {
    const editor = createDocumentEditor()
    importDocument(editor, "Original", "markdown")
    const before = editor.getEditorState()
    const controller = new AbortController()

    async function* cancelled() {
      await Promise.resolve()
      yield serializeMediaHtml(values[0])
      controller.abort()
    }

    expect(
      await streamMarkdown(editor, cancelled(), {
        signal: controller.signal,
      }).then(
        () => null,
        (error: Error) => error,
      ),
    ).toBeInstanceOf(DocumentError)
    expect(editor.getEditorState()).toBe(before)

    async function* stale() {
      await Promise.resolve()
      yield serializeMediaHtml(values[0])
      importDocument(editor, "Host update", "markdown")
    }

    expect(
      await streamMarkdown(editor, stale()).then(
        () => null,
        (error: Error) => error,
      ),
    ).toBeInstanceOf(DocumentError)
    expect(exportDocument(editor, "markdown")).toContain("Host update")
  })

  test("keeps media and document limits", () => {
    expect(() =>
      parseDocument(
        documentJSON({ ...values[0], caption: "x".repeat(10001) }),
        "json",
      ),
    ).toThrow(DocumentError)
    expect(() => parseDocument("x".repeat(1048577), "html")).toThrow(
      DocumentError,
    )
    expect(() =>
      parseDocument("![Photo](https://example.com/a.png)", "markdown"),
    ).toThrow(DocumentError)
  })
})
