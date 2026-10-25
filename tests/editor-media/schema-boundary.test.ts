import { mediaSchema, parseMedia } from "@editor/media/schema"
import { expect, test } from "bun:test"

test("media boundary schema validates serialized input before domain parsing", () => {
  const source =
    '{"kind":"image","url":"https://media.example.test/approved.png","alt":"Approved image"}'

  const input = mediaSchema.parse(JSON.parse(source))

  expect(parseMedia(input)).toMatchObject({
    kind: "image",
    url: "https://media.example.test/approved.png",
    alt: "Approved image",
  })
})

test("media boundary validation rejects malformed input and unsafe URLs", () => {
  const inputs = [
    null,
    "https://media.example.test/approved.png",
    { kind: "image" },
    { kind: "unknown", url: "https://media.example.test/approved.png" },
    { kind: "image", url: "javascript:alert(1)" },
    { kind: "image", url: "https://user:secret@media.example.test/image.png" },
  ]

  for (const input of inputs)
    expect(() => parseMedia(mediaSchema.parse(input))).toThrow()
})
