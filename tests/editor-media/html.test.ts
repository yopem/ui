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
      expect(html).toContain('sandbox="allow-scripts allow-presentation"')
      expect(html).toContain('referrerpolicy="no-referrer"')
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
