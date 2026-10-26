import { DocumentError, safeDocumentStyle } from "@editor/document/boundary"
import { parseDocument } from "@editor/document/index"
import { normalizeWordClipboardHTML } from "@editor/word-clipboard-model"
import { expect, test } from "bun:test"
import { z } from "zod"

const nodeSchema = z.looseObject({
  type: z.string(),
  tag: z.string().optional(),
  listType: z.string().optional(),
  text: z.string().optional(),
  style: z.string().optional(),
  start: z.number().optional(),
  $: z.looseObject({ yopemListMarker: z.string().optional() }).optional(),
  children: z.array(z.unknown()).optional(),
})

function rootFor(source: string) {
  const normalized = normalizeWordClipboardHTML(source)

  if (!normalized) throw new Error("Word HTML was not detected.")

  return nodeSchema.parse(parseDocument(normalized, "html").root)
}

function nodesFor(source: string) {
  const nodes: z.infer<typeof nodeSchema>[] = []

  function visit(node: z.infer<typeof nodeSchema>) {
    nodes.push(node)

    for (const child of node.children ?? []) visit(nodeSchema.parse(child))
  }

  visit(rootFor(source))

  return nodes
}

function listStructureFor(source: string) {
  const lists: {
    type: string | undefined
    marker: string | undefined
    start: number | undefined
    depth: number
  }[] = []

  function visit(node: z.infer<typeof nodeSchema>, parentDepth: number) {
    const isList = node.type === "list"

    if (isList)
      lists.push({
        type: node.listType,
        marker: node.$?.yopemListMarker,
        start: node.listType === "number" ? node.start : undefined,
        depth: parentDepth,
      })

    const depth = parentDepth + Number(isList)

    for (const child of node.children ?? [])
      visit(nodeSchema.parse(child), depth)
  }

  visit(rootFor(source), 0)

  return lists
}

const officeStyles = `<style>
p.MsoNormal, li.MsoNormal, div.MsoNormal {
  mso-style-unhide:no; mso-style-qformat:yes; mso-style-parent:"";
  margin-top:0cm; margin-right:0cm; margin-bottom:10pt; margin-left:0cm;
  mso-pagination:widow-orphan; font-size:12pt; font-family:"Cambria",serif;
  mso-ascii-font-family:Cambria; mso-ascii-theme-font:minor-latin;
  mso-fareast-font-family:Cambria; mso-fareast-theme-font:minor-latin;
  mso-hansi-font-family:Cambria; mso-hansi-theme-font:minor-latin;
  mso-bidi-font-family:Cambria; mso-bidi-theme-font:minor-bidi;
  mso-ansi-language:EN-US; mso-fareast-language:EN-US;
}
h2 {
  mso-style-priority:9; mso-style-qformat:yes; mso-style-link:"Heading 2 Char";
  mso-style-next:"Body Text"; margin-top:10pt; margin-right:0cm;
  margin-bottom:0cm; margin-left:0cm; mso-pagination:widow-orphan lines-together;
  page-break-after:avoid; mso-outline-level:2; font-size:16pt;
  font-family:"Calibri",sans-serif; color:#4F81BD; mso-themecolor:accent1;
}
span.Heading2Char {
  mso-style-name:"Heading 2 Char"; mso-style-locked:yes;
  mso-ansi-font-size:16pt; mso-bidi-font-size:16pt;
  font-family:"Calibri",sans-serif; color:#4F81BD; font-weight:bold;
}
p.Compact {mso-style-name:Compact; margin-top:1.8pt; margin-bottom:1.8pt; font-family:"Cambria",serif;}
</style>`

test("pinned public Word list HTML retains visible text and list structure", async () => {
  const source = await Bun.file(
    new URL("./fixtures/plate-word-lists.html", import.meta.url),
  ).text()

  const nodes = nodesFor(source)

  const text = nodes
    .filter((node) => node.type === "text")
    .map((node) => node.text ?? "")
    .join("")

  expect(
    nodes.some((node) => node.type === "heading" && node.tag === "h2"),
  ).toBe(true)

  for (const phrase of [
    "Some nested lists",
    "one",
    "two",
    "a",
    "b",
    "Sub paragraph",
    "three",
    "four",
    "Same list",
    "Different list adjacent to the one above.",
  ])
    expect(text).toContain(phrase)

  expect(text).not.toContain("1.")
  expect(text).not.toContain("2.")
  expect(text).not.toContain("a.")
  expect(listStructureFor(source)).toEqual([
    { type: "number", marker: "decimal", start: 1, depth: 0 },
    { type: "number", marker: "lower-alpha", start: 1, depth: 1 },
    { type: "bullet", marker: "disc", start: undefined, depth: 0 },
    { type: "bullet", marker: "disc", start: undefined, depth: 1 },
    { type: "bullet", marker: "disc", start: undefined, depth: 2 },
    { type: "bullet", marker: "disc", start: undefined, depth: 0 },
    { type: "bullet", marker: "disc", start: undefined, depth: 0 },
  ])
})

test("declared Word character and heading styles retain supported typography", () => {
  const nodes = nodesFor(
    `${officeStyles}<h2>Heading</h2><p class="MsoNormal"><span class="Heading2Char">Character</span></p><p class="Compact">Compact</p>`,
  )

  const heading = nodes.find((node) => node.type === "heading")
  const character = nodes.find((node) => node.text === "Character")
  const compact = nodes.find((node) => node.text === "Compact")

  expect(heading?.tag).toBe("h2")
  expect(character?.style).toContain('font-family: "Calibri",sans-serif')
  expect(character?.style).toContain("font-size: 16pt")
  expect(compact?.style).toContain('font-family: "Cambria",serif')
})

test("Word font stacks allow known local families without resource syntax", () => {
  for (const family of [
    '"Cambria",serif',
    "'Calibri', sans-serif",
    '"Times New Roman", serif',
  ]) {
    expect(safeDocumentStyle(`font-family: ${family}`)).toContain(family)
  }

  for (const family of [
    '"Cambria";src:url(https://invalid.example/font)',
    "url(https://invalid.example/font)",
    "var(--host-font)",
    "\"Cambria'",
    '"Cambria",serif,monospace',
  ]) {
    expect(() => safeDocumentStyle(`font-family: ${family}`)).toThrow(
      DocumentError,
    )
  }
})

test("unsupported Word style values and undeclared classes reject", () => {
  for (const style of [
    "mso-style-qformat:maybe",
    "mso-style-priority:10000",
    "mso-ascii-theme-font:url(https://invalid.example/font)",
    "mso-themecolor:unknown",
    "margin-bottom:url(https://invalid.example/layout)",
    "margin-top:-1pt",
  ]) {
    expect(() =>
      nodesFor(`<p class="MsoNormal" style="${style}">Keep</p>`),
    ).toThrow(DocumentError)
  }

  expect(() =>
    nodesFor('<p class="NotDeclared" style="mso-style-name:Normal">Keep</p>'),
  ).toThrow(DocumentError)
  expect(() =>
    nodesFor(
      '<style>p[data-host] {color:red}</style><p class="MsoNormal">Keep</p>',
    ),
  ).toThrow(DocumentError)
  expect(() =>
    nodesFor(
      '<style>@font-face {font-family:Cambria;src:url(https://invalid.example/font)}</style><p class="MsoNormal">Keep</p>',
    ),
  ).toThrow(DocumentError)
})

test("Word rule count is bounded independently of HTML bytes", () => {
  const styles = Array.from(
    { length: 257 },
    (_, index) => `.Mso${index} {color:red}`,
  ).join("\n")

  expect(() =>
    nodesFor(`<style>${styles}</style><p class="Mso0">Keep</p>`),
  ).toThrow(DocumentError)
})
