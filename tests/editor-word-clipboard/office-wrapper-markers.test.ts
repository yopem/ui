import { DocumentError } from "@editor/document/boundary"
import { parseDocument } from "@editor/document/index"
import { normalizeWordClipboardHTML } from "@editor/word-clipboard-model"
import { expect, test } from "bun:test"

const geometryOnlyList = `<style>
@list l0 {mso-list-id:10;mso-list-template-ids:20;}
@list l0:level1 {mso-level-tab-stop:none;mso-level-number-position:left;margin-left:24pt;text-indent:-24pt;}
</style>`

function documentFor(source: string) {
  const normalized = normalizeWordClipboardHTML(source)

  if (!normalized) throw new Error("Word HTML was not detected.")

  return JSON.stringify(parseDocument(normalized, "html"))
}

test("shell accepts bounded inert Word wrap metadata", () => {
  const document = documentFor(
    '<body class="MsoNormal" style="tab-interval:36pt;word-wrap:break-word"><p>Shell text</p></body>',
  )

  expect(document).toContain('"text":"Shell text"')
  expect(() =>
    normalizeWordClipboardHTML(
      '<body class="MsoNormal" style="word-wrap:url(https://invalid.example)"><p>Text</p></body>',
    ),
  ).toThrow(DocumentError)
})

test("nested bookmark wrappers remove exact markers and preserve geometry-only lists", () => {
  const document = documentFor(
    `${geometryOnlyList}<p style="mso-list:l0 level1 lfo1"><span style="mso-bookmark:OLE_LINK1"><a name="OLE_LINK1"></a><![if !supportLists]><span lang="EN-US"><span style="mso-list:Ignore">1.<span style="font: 7pt 'Times New Roman'">&nbsp;&nbsp;</span></span></span><![endif]><span style="mso-bookmark:OLE_LINK2">First</span></span></p><p style="mso-list:l0 level1 lfo1"><span style="mso-bookmark:OLE_LINK3"><span><span style="mso-list:Ignore">2.<span style="font: 7pt 'Times New Roman'">&nbsp;&nbsp;</span></span></span><span>Second</span></span></p>`,
  )

  expect(document).toContain('"listType":"number"')
  expect(document).toContain('"yopemListMarker":"decimal"')
  expect(document).toContain('"start":1')
  expect(document).toContain('"text":"First"')
  expect(document).toContain('"text":"Second"')
  expect(document).not.toContain('"text":"1."')
  expect(document).not.toContain('"text":"2."')
})

test("a missing marker uses only an explicit list-definition fallback", () => {
  const definition =
    '<style>@list l1:level1 {mso-level-number-format:bullet;mso-level-text:"o";}</style>'

  expect(
    documentFor(
      `${definition}<p style="mso-list:l1 level1 lfo1">Fallback item</p>`,
    ),
  ).toContain('"yopemListMarker":"circle"')

  expect(() =>
    normalizeWordClipboardHTML(
      `${geometryOnlyList}<p style="mso-list:l0 level1 lfo1">Missing marker</p>`,
    ),
  ).toThrow(DocumentError)
})

test("named anchors unwrap only bounded inert names and preserve supported links", () => {
  const normalized = normalizeWordClipboardHTML(
    '<h2><a name="safe-target">Heading</a></h2><p class="MsoNormal"><a href="https://example.test/reference">Reference</a></p>',
  )

  expect(normalized).not.toBeNull()
  expect(normalized).toContain("<h2>Heading</h2>")
  expect(normalized).toContain(
    '<a href="https://example.test/reference">Reference</a>',
  )

  for (const anchor of [
    '<a name="bad name">Text</a>',
    '<a name="safe" href="https://example.test/">Text</a>',
    '<a name="safe" onclick="alert(1)">Text</a>',
    '<a href="javascript:alert(1)">Text</a>',
  ])
    expect(() =>
      normalizeWordClipboardHTML(`<p class="MsoNormal">${anchor}</p>`),
    ).toThrow(DocumentError)
})

test("generated underscore bookmarks remain inert transparent wrappers", () => {
  const normalized = normalizeWordClipboardHTML(
    '<p class="MsoNormal"><a name="_GoBack"><span style="mso-bookmark:_GoBack">Retained text</span></a></p>',
  )

  expect(normalized).not.toBeNull()
  expect(normalized).toContain("Retained text")
  expect(normalized).not.toContain("_GoBack")
  expect(normalized).not.toContain("<a")
})

test("unsupported bookmark, marker font, and resource metadata fail closed", () => {
  for (const source of [
    '<p class="MsoNormal" style="mso-bookmark:url(https://invalid.example)">Text</p>',
    '<p class="MsoNormal" style="font:7pt url(https://invalid.example)">Text</p>',
    `${geometryOnlyList}<p style="mso-list:l0 level1 lfo1"><span style="mso-list:Ignore">1.<span style="font:7pt url(https://invalid.example)"> </span></span>Text</p>`,
    `${geometryOnlyList}<p style="mso-list:l0 level1 lfo1"><span style="mso-list:Ignore;background-image:url(https://invalid.example)">1.</span>Text</p>`,
    '<style>@import url(https://invalid.example/office.css);</style><p class="MsoNormal">Text</p>',
    '<p class="MsoNormal"><img src="https://invalid.example/image.png"></p>',
  ])
    expect(() => normalizeWordClipboardHTML(source)).toThrow(DocumentError)
})
