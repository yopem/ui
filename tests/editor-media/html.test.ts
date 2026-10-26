import { serializeMediaHtml } from "@editor/media/html"
import { parseMedia } from "@editor/media/schema"
import { expect, test } from "bun:test"

test("semantic HTML escapes text and validates all URL attributes", () => {
  const image = serializeMediaHtml(
    parseMedia({
      kind: "image",
      url: "https://example.com/image.png",
      alt: '<script>alert("x")</script>',
      caption: '<img src=x onerror="bad">',
      alignment: "end",
      width: 640,
    }),
  )

  expect(image).toContain("<figure ")
  expect(image).toContain("<figcaption>&lt;img")
  expect(image).toContain('width="640"')
  expect(image).not.toContain("<script>")
  expect(image).not.toContain("<img src=x")

  for (const kind of ["video", "audio", "file", "embed"] as const) {
    const html = serializeMediaHtml(
      parseMedia({
        kind,
        url:
          kind === "embed"
            ? "https://vimeo.com/123456"
            : "https://example.com/a",
        name: 'x"><script>',
        trackUrl: "https://example.com/captions.vtt",
      }),
    )

    expect(html).not.toContain("<script>")

    if (kind === "embed") {
      expect(html).toContain(
        '<a href="https://player.vimeo.com/video/123456" rel="noopener noreferrer">',
      )
      expect(html).not.toContain("<iframe")
    }

    if (kind === "audio" || kind === "video") {
      expect(html).toContain(" controls ")
      expect(html).toContain('<track kind="captions"')
    }
  }

  expect(() =>
    serializeMediaHtml({
      ...parseMedia({ kind: "file", url: "https://example.com" }),
      url: "javascript:alert(1)",
    }),
  ).toThrow()
})

test("tweet and configured iframe HTML keep source metadata inert", () => {
  for (const media of [
    parseMedia({
      kind: "embed",
      embedType: "tweet",
      url: "https://x.com/YopemUI/status/1234567890123456789",
    }),
    parseMedia({
      kind: "embed",
      embedType: "iframe",
      url: "https://embed.example.com/player/42",
    }),
  ]) {
    const html = serializeMediaHtml(media)
    const attribute = /data-yopem-media="([^"]*)"/u.exec(html)?.[1]

    if (!attribute) throw new Error("Missing canonical media metadata")

    const decoded = attribute
      .replaceAll("&quot;", '"')
      .replaceAll("&#39;", "'")
      .replaceAll("&lt;", "<")
      .replaceAll("&gt;", ">")
      .replaceAll("&amp;", "&")

    expect(parseMedia(JSON.parse(decoded))).toEqual(media)
    expect(html).not.toContain("<iframe")
    expect(html).toContain('rel="noopener noreferrer"')
  }
})
