import { DocumentError } from "@editor/document/boundary"
import { parseDocument } from "@editor/document/index"
import { normalizeWordClipboardHTML } from "@editor/word-clipboard-model"
import { expect, test } from "bun:test"

function documentFor(source: string) {
  const normalized = normalizeWordClipboardHTML(source)

  if (!normalized) throw new Error("Word HTML was not detected.")

  return JSON.stringify(parseDocument(normalized, "html"))
}

const listRules = `
@list l0 { mso-list-id: 10; mso-list-template-ids: 20; }
@list l0:level1 {
  mso-level-number-format: decimal;
  mso-level-text: "%1.";
  mso-level-start-at: 4;
}
@list l1:level1 {
  mso-level-number-format: bullet;
  mso-level-text: "o";
}`

test("Office list definitions supply ordered and bullet markers and starts", () => {
  const document = documentFor(
    `<style>${listRules}</style><p style="mso-list:l0 level1 lfo1">First</p><p style="mso-list:l0 level1 lfo1">Second</p><p style="mso-list:l1 level1 lfo2">Third</p>`,
  )

  expect(document).toContain('"listType":"number"')
  expect(document).toContain('"yopemListMarker":"decimal"')
  expect(document).toContain('"start":4')
  expect(document).toContain('"listType":"bullet"')
  expect(document).toContain('"yopemListMarker":"circle"')
  expect(document).toContain('"text":"First"')
  expect(document).toContain('"text":"Second"')
  expect(document).toContain('"text":"Third"')
})

test("supported list marker spans must agree with referenced definitions", () => {
  const document = documentFor(
    `<style>${listRules}</style><p style="mso-list:l0 level1 lfo1"><span style="mso-list:Ignore">4. </span>First</p>`,
  )

  expect(document).toContain('"yopemListMarker":"decimal"')
  expect(document).toContain('"start":4')
})

test("list references reject missing levels and conflicting marker metadata", () => {
  expect(() =>
    normalizeWordClipboardHTML(
      `<style>${listRules}</style><p style="mso-list:l0 level2 lfo1">Missing level</p>`,
    ),
  ).toThrow(DocumentError)

  expect(() =>
    normalizeWordClipboardHTML(
      `<style>${listRules}</style><p style="mso-list:l0 level1 lfo1"><span style="mso-list:Ignore">1. </span>Conflict</p>`,
    ),
  ).toThrow(DocumentError)
})

test("unsupported list definitions fail closed", () => {
  for (const definition of [
    '@list l0:level1 { mso-level-number-format: picture; mso-level-text: "x"; }',
    '@list l0:level1 { mso-level-number-format: decimal; mso-level-text: "%2."; }',
    '@list l0:level1 { mso-level-number-format: decimal; mso-level-text: "%1."; mso-level-start-at: 2147483648; }',
    "@list l0:level1 { mso-level-number-format: decimal; background: url(https://example.test/a); }",
  ])
    expect(() =>
      normalizeWordClipboardHTML(
        `<style>${definition}</style><p style="mso-list:l0 level1 lfo1">Text</p>`,
      ),
    ).toThrow(DocumentError)
})

test("page and font-face layout metadata is ignored only when inert", () => {
  expect(
    documentFor(
      '<style>@page WordSection1 { size: 612pt 792pt; margin: 72pt 90pt; } @font-face { font-family: Cambria; panose-1: 2 4 5 3 5 4 6 3 2 4; mso-font-charset: 0; }</style><p class="MsoNormal">Text</p>',
    ),
  ).toContain('"text":"Text"')

  for (const atRule of [
    "@page { background: url(https://example.test/page); }",
    "@font-face { font-family: Word; src: url(https://example.test/font.woff2); }",
    "@page { color: red; }",
    "@font-face { font-family: Word; font-display: swap; }",
  ])
    expect(() =>
      normalizeWordClipboardHTML(
        `<style>${atRule}</style><p class="MsoNormal">Text</p>`,
      ),
    ).toThrow(DocumentError)
})
