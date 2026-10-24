import { $insertMedia } from "@editor/media/extension"
import { $createMediaNode, MediaNode } from "@editor/media/model"
import { parseMedia, parseProvider } from "@editor/media/schema"
import { describe, expect, test } from "bun:test"
import {
  $createParagraphNode,
  $getRoot,
  $getSelection,
  $isNodeSelection,
  createEditor,
} from "lexical"

const image = {
  kind: "image" as const,
  url: "https://example.com/image.png",
  alt: "Mountain",
  caption: "Summit",
  width: 320,
  alignment: "center" as const,
}

describe("media validation", () => {
  test("rejects unsafe URLs, dimensions, and text limits", () => {
    for (const url of [
      "javascript:alert(1)",
      "data:image/png;base64,AA",
      "blob:https://example.com/x",
      "//example.com/a",
      "https://user:secret@example.com/a",
      "https://example.com/\nimage",
      "http://example.com/a",
    ])
      expect(() => parseMedia({ ...image, url })).toThrow()

    for (const width of [-1, 0, Infinity, NaN, 9000])
      expect(() => parseMedia({ ...image, width })).toThrow()

    expect(() => parseMedia({ ...image, alt: "a".repeat(2001) })).toThrow()
    expect(() => parseMedia({ ...image, caption: "a".repeat(10001) })).toThrow()
  })

  test("canonicalizes supported providers and rejects lookalike hosts", () => {
    expect(parseProvider("https://youtu.be/dQw4w9WgXcQ")).toEqual({
      provider: "youtube",
      url: "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
    })
    expect(parseProvider("https://vimeo.com/123456").url).toBe(
      "https://player.vimeo.com/video/123456",
    )
    expect(parseProvider("https://dai.ly/abc123").provider).toBe("dailymotion")
    expect(parseProvider("https://coub.com/view/abc123").provider).toBe("coub")
    expect(
      parseProvider("https://v.youku.com/v_show/id_X123.html").provider,
    ).toBe("youku")

    for (const url of [
      "https://youtube.com.evil.test/watch?v=dQw4w9WgXcQ",
      "https://evil.youtube.com/watch?v=dQw4w9WgXcQ",
      "https://youtube.com:444/watch?v=dQw4w9WgXcQ",
      "https://user:pw@youtu.be/dQw4w9WgXcQ",
      '<iframe src="https://vimeo.com/123">',
      "https://x.com/user/status/123",
    ])
      expect(() => parseProvider(url)).toThrow()
  })
})

describe("native media nodes", () => {
  test("inserts a block node and selects it at a range selection", () => {
    const editor = createEditor({
      namespace: "media-insert",
      nodes: [MediaNode],
      onError(error) {
        throw error
      },
    })

    editor.update(
      () => {
        $getRoot().append($createParagraphNode())
        $getRoot().getFirstChildOrThrow().selectEnd()
      },
      { discrete: true },
    )
    editor.update(() => expect($insertMedia(image)).toBe(true), {
      discrete: true,
    })

    editor.getEditorState().read(() => {
      const selection = $getSelection()
      expect($isNodeSelection(selection)).toBe(true)
      expect(
        $getRoot()
          .getChildren()
          .some((node) => node instanceof MediaNode),
      ).toBe(true)
    })
  })

  test("roundtrips all media kinds through isolated Lexical JSON", () => {
    const media = [
      { ...image, kind: "image" as const },
      {
        ...image,
        kind: "video" as const,
        trackUrl: "https://example.com/en.vtt",
      },
      { ...image, kind: "audio" as const },
      { ...image, kind: "file" as const, name: "report.pdf" },
      { ...image, kind: "embed" as const, url: "https://vimeo.com/123456" },
    ]

    const source = createEditor({
      namespace: "media-source",
      nodes: [MediaNode],
      onError(error) {
        throw error
      },
    })

    source.update(
      () => {
        for (const value of media) $getRoot().append($createMediaNode(value))
      },
      { discrete: true },
    )

    const json = source.getEditorState().toJSON()

    const target = createEditor({
      namespace: "media-target",
      nodes: [MediaNode],
      onError(error) {
        throw error
      },
    })

    target.setEditorState(target.parseEditorState(JSON.stringify(json)))
    expect(target.getEditorState().toJSON()).toEqual(json)
  })

  test("validates media imported from Lexical JSON", () => {
    const editor = createEditor({
      namespace: "media-import",
      nodes: [MediaNode],
      onError(error) {
        throw error
      },
    })

    expect(() =>
      editor.update(
        () =>
          MediaNode.importJSON({
            type: "yopem-media",
            version: 1,
            media: { ...parseMedia(image), url: "javascript:alert(1)" },
          }),
        { discrete: true },
      ),
    ).toThrow()
  })
})
