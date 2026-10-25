import type { MediaInput } from "@editor/media/schema"

import { DocumentError } from "@editor/document/boundary"
import { parseDocument } from "@editor/document/index"
import { normalizeWordClipboardHTML } from "@editor/word-clipboard-model"
import { expect, test } from "bun:test"

import { wordHTML, wordImageHTML } from "./word-html.fixture"

test("Word HTML becomes strict native text, nested lists, and tables", () => {
  const normalized = normalizeWordClipboardHTML(wordHTML)

  expect(normalized).not.toBeNull()

  if (!normalized) throw new Error("Word HTML was not detected.")
  const document = JSON.stringify(parseDocument(normalized, "html"))

  expect(document).toContain('"text":"Word heading"')
  expect(document).toContain("font-size: 12pt")
  expect(document).toContain("#c00000")
  expect(document).toContain('"indent":1')
  expect(document).toContain('"lineHeight":"1.5"')
  expect(document).toContain('"textIndent":"16px"')
  expect(document).toContain('"listType":"number"')
  expect(document).toContain('"yopemListMarker":"lower-alpha"')
  expect(document).toContain('"type":"table"')
  expect(document).toContain('"text":"Ready"')
})

test("ordinary HTML delegates and non-Word rich input does not get rewritten", () => {
  expect(
    normalizeWordClipboardHTML("<p><strong>Keep HTML</strong></p>"),
  ).toBeNull()
})

test("Word images require a bounded resolver and become canonical media", () => {
  expect(() => normalizeWordClipboardHTML(wordImageHTML)).toThrow(
    "Word images require an explicit host resolver.",
  )

  const calls: {
    source: string
    alt: string
    width?: number
    height?: number
  }[] = []

  const normalized = normalizeWordClipboardHTML(wordImageHTML, (image) => {
    calls.push(image)

    return {
      kind: "image",
      url: "https://assets.example.test/word-image.png",
      alt: image.alt,
      caption: "",
      width: 320,
      alignment: "start",
    }
  })

  expect(calls).toEqual([
    {
      source: "file:///C:/Users/word/image.png",
      alt: "Word image",
      width: 320,
      height: 200,
    },
  ])

  if (!normalized) throw new Error("Word HTML was not detected.")
  const document = JSON.stringify(parseDocument(normalized, "html"))
  expect(document).toContain('"type":"yopem-media"')
  expect(document).toContain(
    '"url":"https://assets.example.test/word-image.png"',
  )
  expect(document).toContain('"text":"Keep "')
  expect(document).toContain('"text":" text"')
})

test("a rejecting image resolver thenable is consumed and rejected synchronously", async () => {
  const rejection = Promise.reject(new Error("unexpected async resolver"))
  const unhandled: unknown[] = []

  const resolverOutput: MediaInput = Object.assign(rejection, {
    kind: "image" as const,
    url: "https://assets.example.test/word-image.png",
  })

  function onUnhandled(event: PromiseRejectionEvent) {
    unhandled.push(event.reason)
  }

  globalThis.addEventListener("unhandledrejection", onUnhandled)

  try {
    expect(() =>
      normalizeWordClipboardHTML(wordImageHTML, () => resolverOutput),
    ).toThrow("Word image resolver returned invalid media metadata.")
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(unhandled).toEqual([])
  } finally {
    globalThis.removeEventListener("unhandledrejection", onUnhandled)
  }
})

test("thenable media metadata is not accepted as a synchronous resolver value", async () => {
  const media: MediaInput = {
    kind: "image",
    url: "https://assets.example.test/word.png",
    alt: "Image",
  }

  Object.setPrototypeOf(media, Promise.prototype)
  expect(() => normalizeWordClipboardHTML(wordImageHTML, () => media)).toThrow(
    "Word image resolver returned invalid media metadata.",
  )
  await new Promise((resolve) => setTimeout(resolve, 0))
})

test("resolver then getters cannot change acceptance after their first read", async () => {
  const rejected = Promise.reject(new Error("Unexpected deferred resolver"))
  const nativeThen = rejected.then.bind(rejected)

  const media: MediaInput = {
    kind: "image",
    url: "https://assets.example.test/word.png",
  }

  let reads = 0

  const result = new Proxy(media, {
    get(target, property) {
      if (property === "then") {
        reads += 1

        return reads === 1 ? nativeThen : undefined
      }

      if (property === "kind") return target.kind

      if (property === "url") return target.url

      return undefined
    },
  })

  expect(() => normalizeWordClipboardHTML(wordImageHTML, () => result)).toThrow(
    "Word image resolver returned invalid media metadata.",
  )
  await new Promise((resolve) => setTimeout(resolve, 0))
  expect(reads).toBe(1)
})

test("invalid image metadata and unsupported rich formatting reject before import", () => {
  expect(() =>
    normalizeWordClipboardHTML(wordImageHTML, (image) => ({
      kind: "image",
      url: "javascript:alert(1)",
      alt: image.alt,
    })),
  ).toThrow()

  expect(() =>
    normalizeWordClipboardHTML(
      '<p class="MsoNormal" style="font-family: Papyrus">Unsupported font</p>',
    ),
  ).toThrow(DocumentError)

  expect(() =>
    normalizeWordClipboardHTML(
      '<p class="MsoListParagraph" style="mso-list:l0 level3 lfo1"><span style="mso-list:Ignore">•</span>Skipped level</p>',
    ),
  ).toThrow(DocumentError)
})

test("Word clipboard source and structure stay within document bounds", () => {
  expect(() =>
    normalizeWordClipboardHTML(
      `<p class="MsoNormal">${"x".repeat(1_048_577)}</p>`,
    ),
  ).toThrow("Document exceeds 1 MiB.")

  expect(() =>
    normalizeWordClipboardHTML(
      '<p class="MsoNormal"><iframe src="https://example.test"></iframe></p>',
    ),
  ).toThrow(DocumentError)
})
