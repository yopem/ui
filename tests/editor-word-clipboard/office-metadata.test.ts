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

const pinnedWordListHTML = `<style>
@list l3 {mso-list-id:691758522;mso-list-template-ids:-928866714;}
@list l3:level1 {mso-level-tab-stop:none;mso-level-number-position:left;margin-left:24.0pt;text-indent:-24.0pt;}
@list l1 {mso-list-id:360324877;mso-list-template-ids:-1268981388;}
@list l1:level2 {mso-level-number-format:alpha-lower;mso-level-tab-stop:36.0pt;mso-level-number-position:left;margin-left:60.0pt;text-indent:-24.0pt;}
@list l5 {mso-list-id:1492597651;mso-list-template-ids:2032308722;}
@list l5:level1 {mso-level-number-format:bullet;mso-level-text:\uf0b7;mso-level-tab-stop:none;mso-level-number-position:left;margin-left:24.0pt;text-indent:-24.0pt;font-family:Symbol;mso-bidi-font-family:Symbol;}
@list l4 {mso-list-id:1074932639;mso-list-template-ids:1727566320;}
@list l4:level2 {mso-level-number-format:bullet;mso-level-text:\uf02d;mso-level-tab-stop:36.0pt;mso-level-number-position:left;margin-left:60.0pt;text-indent:-24.0pt;font-family:Symbol;mso-bidi-font-family:Symbol;}
@list l0 {mso-list-id:285352212;mso-list-template-ids:-2133687518;}
@list l0:level3 {mso-level-number-format:bullet;mso-level-text:\uf0b7;mso-level-tab-stop:72.0pt;mso-level-number-position:left;margin-left:96.0pt;text-indent:-24.0pt;font-family:Symbol;mso-bidi-font-family:Symbol;}
@list l2 {mso-list-id:653025141;mso-list-template-ids:-905516306;}
@list l2:level1 {mso-level-number-format:bullet;mso-level-text:\uf0b7;mso-level-tab-stop:none;mso-level-number-position:left;margin-left:24.0pt;text-indent:-24.0pt;font-family:Symbol;mso-bidi-font-family:Symbol;}
</style>
<p class="MsoNormal" style="margin-left:24pt;text-indent:-24pt;mso-list:l3 level1 lfo1"><span style="mso-list:Ignore">1.&nbsp;&nbsp;&nbsp;</span>one</p>
<p class="MsoNormal" style="margin-left:24pt;text-indent:-24pt;mso-list:l3 level1 lfo1"><span style="mso-list:Ignore">2.&nbsp;&nbsp;&nbsp;</span>two</p>
<p class="MsoNormal" style="margin-left:60pt;text-indent:-24pt;mso-list:l1 level2 lfo2;tab-stops:list 36pt"><span style="mso-list:Ignore">a.&nbsp;&nbsp;&nbsp;</span>a</p>
<p class="MsoNormal" style="margin-left:60pt;text-indent:-24pt;mso-list:l1 level2 lfo2;tab-stops:list 36pt"><span style="mso-list:Ignore">b.&nbsp;&nbsp;&nbsp;</span>b</p>
<p class="MsoNormal" style="margin-left:24pt;text-indent:-24pt;mso-list:l5 level1 lfo3"><span style="mso-list:Ignore">·&nbsp;&nbsp;&nbsp;</span>one</p>
<p class="MsoNormal" style="margin-left:24pt;text-indent:-24pt;mso-list:l5 level1 lfo3"><span style="mso-list:Ignore">·&nbsp;&nbsp;&nbsp;</span>two</p>
<p class="MsoNormal" style="margin-left:60pt;text-indent:-24pt;mso-list:l4 level2 lfo4;tab-stops:list 36pt"><span style="mso-list:Ignore">-&nbsp;&nbsp;&nbsp;</span>three</p>
<p class="MsoNormal" style="margin-left:96pt;text-indent:-24pt;mso-list:l0 level3 lfo5;tab-stops:list 72pt"><span style="mso-list:Ignore">·&nbsp;&nbsp;&nbsp;</span>four</p>
<p class="MsoNormal" style="margin-left:24pt;text-indent:-24pt;mso-list:l5 level1 lfo3"><span style="mso-list:Ignore">·&nbsp;&nbsp;&nbsp;</span>Same list</p>
<p class="MsoNormal" style="margin-left:24pt;text-indent:-24pt;mso-list:l2 level1 lfo6"><span style="mso-list:Ignore">·&nbsp;&nbsp;&nbsp;</span>Different list</p>`

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

test("pinned Word descriptors preserve nested and separate list instances", () => {
  const normalized = normalizeWordClipboardHTML(pinnedWordListHTML)

  expect(normalized).not.toBeNull()

  if (!normalized) throw new Error("Word list HTML was not detected.")
  const document = JSON.stringify(parseDocument(normalized, "html"))

  expect(document).toContain('"text":"one"')
  expect(document).toContain('"text":"Same list"')
  expect(document).toContain('"text":"Different list"')
  expect(document).toContain('"yopemListMarker":"lower-alpha"')
  expect((document.match(/"listType":"number"/g) ?? []).length).toBe(2)
  expect((document.match(/"listType":"bullet"/g) ?? []).length).toBe(4)
  expect((normalized.match(/<ul\b/g) ?? []).length).toBe(4)
  expect(normalized).toContain("<li>two<ol")
  expect(normalized).toContain("<li>two<ul")
  expect(normalized).toContain("<li>three<ul")
})

test("Office starts accept sequential visible markers", () => {
  const normalized = normalizeWordClipboardHTML(
    `<style>@list l0:level1 {mso-level-number-format:decimal;mso-level-text:%1.;mso-level-start-at:3;mso-level-tab-stop:none;mso-level-number-position:left;margin-left:24.0pt;text-indent:-24.0pt;}</style><p style="margin-left:24pt;text-indent:-24pt;mso-list:l0 level1 lfo1"><span style="mso-list:Ignore">3.</span>three</p><p style="margin-left:24pt;text-indent:-24pt;mso-list:l0 level1 lfo1"><span style="mso-list:Ignore">4.</span>four</p>`,
  )

  expect(normalized).not.toBeNull()

  if (!normalized) throw new Error("Word list HTML was not detected.")
  expect(normalized).toMatch(/<ol\b[^>]*\bstart="3"/)
  expect((normalized.match(/<ol\b/g) ?? []).length).toBe(1)
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
    "@list l0:level1 { mso-level-number-format: decimal; mso-level-text: url(https://example.test/marker); }",
    "@list l0:level1 { mso-level-number-format: decimal; mso-level-text: %1.; mso-level-tab-stop: expression(alert(1)); }",
    "@list l0:level1 { mso-level-number-format: bullet; mso-level-text: o; font-family: url(https://example.test/font); }",
    "@list l0:level1 { mso-level-number-format: decimal; mso-level-number-position: center; }",
    "@list l0:level1 { mso-level-number-format: decimal; mso-level-text: %1.; margin-left: 25pt; }",
    "@list l0:level1 { mso-level-number-format: decimal; mso-level-text: %1.; text-indent: -23pt; }",
    "@list l0:level1 { mso-level-number-format: decimal; mso-level-text: %1.; mso-level-tab-stop: 36pt; }",
  ])
    expect(() =>
      normalizeWordClipboardHTML(
        `<style>${definition}</style><p style="mso-list:l0 level1 lfo1">Text</p>`,
      ),
    ).toThrow(DocumentError)

  expect(() =>
    normalizeWordClipboardHTML(
      '<style>@list l0:level1 { mso-level-number-format: bullet; mso-level-text: "o"; }</style><p style="tab-stops: list url(https://example.test/tab); mso-list: l0 level1 lfo1">Text</p>',
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
