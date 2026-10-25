import type { Element, Root, RootContent } from "hast"
import type { LexicalEditor } from "lexical"

import { z } from "zod"

import { DocumentError, exportDocument } from "./document"
import {
  checkText,
  parseHTMLSyntax,
  safeDocumentStyle,
  safeDocumentURL,
} from "./document/boundary"
import { docxLimits } from "./docx-limits"
import {
  hasASCIIControlCharacter,
  hasForbiddenURLCharacter,
} from "./docx-security"
import { escapeXmlText } from "./docx-xml"
import { writeZipArchive, type ZipWriteEntry } from "./docx-zip"
import {
  getTableSpanGeometry,
  parseTableBorderHTML,
  type TableBorder,
} from "./table-presentation-schema"

const wordNamespace =
  "http://schemas.openxmlformats.org/wordprocessingml/2006/main"

const relationshipNamespace =
  "http://schemas.openxmlformats.org/officeDocument/2006/relationships"

const packageRelationshipNamespace =
  "http://schemas.openxmlformats.org/package/2006/relationships"

const contentTypeNamespace =
  "http://schemas.openxmlformats.org/package/2006/content-types"

const mainDocumentType =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"

const stylesType =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"

const numberingType =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"

const relationshipTypeBase = `${relationshipNamespace}/`

interface RunStyle {
  bold?: boolean
  italic?: boolean
  underline?: boolean
  strike?: boolean
  code?: boolean
  subscript?: boolean
  superscript?: boolean
  caps?: boolean
  fontSize?: number
  fontFamily?: string
  color?: string
  backgroundColor?: string
}

interface ListInfo {
  abstractId: number
  numId: number
  level: number
  tag: "ol" | "ul"
  start: number
}

interface TableCellPlacement {
  node: Element
  row: number
  column: number
  rowSpan: number
  colSpan: number
}

interface ExportContext {
  lists: WeakMap<Element, ListInfo>
  listDefinitions: ListInfo[]
  links: Map<string, string>
}

function fail(message: string): never {
  throw new DocumentError([message])
}

function isElement(node: RootContent): node is Element {
  return node.type === "element"
}

function prop(node: Element, name: string) {
  const value = node.properties[name]

  if (value === undefined || value === null) return undefined

  if (Array.isArray(value)) return value.map(String).join(" ")

  return String(value)
}

function children(node: Element) {
  return node.children.filter(
    (child): child is Element => child.type === "element",
  )
}

function assertProperties(node: Element, allowed: readonly string[]) {
  const properties = new Set(allowed)

  for (const key of Object.keys(node.properties))
    if (!properties.has(key)) fail(`Unsupported DOCX export attribute: ${key}.`)
}

function assertState(node: Element) {
  const source = prop(node, "dataEditorState")

  if (!source) return
  let state: unknown

  try {
    state = JSON.parse(source)
  } catch {
    fail("Invalid document state for DOCX export.")
  }

  const parsed = z.strictObject({}).safeParse(state)

  if (!parsed.success || Object.keys(parsed.data).length)
    fail("Unsupported document state for DOCX export.")
}

function assertBlockPresentation(
  node: Element,
  css: ReadonlyMap<string, string>,
) {
  const source = prop(node, "dataEditorBlockPresentation")

  if (!source) return
  let value: unknown

  try {
    value = JSON.parse(source)
  } catch {
    fail("Invalid block presentation for DOCX export.")
  }

  const parsed = z.record(z.string(), z.unknown()).safeParse(value)

  if (!parsed.success) fail("Invalid block presentation for DOCX export.")
  const presentation = parsed.data

  if (
    Object.keys(presentation).some(
      (key) => !["lineHeight", "textIndent"].includes(key),
    ) ||
    (presentation.lineHeight &&
      css.get("line-height") !== presentation.lineHeight) ||
    (presentation.textIndent &&
      css.get("text-indent") !== presentation.textIndent)
  )
    fail("Unsupported block presentation for DOCX export.")
}

function cssDeclarations(node: Element) {
  const source = prop(node, "style")
  const result = new Map<string, string>()

  if (!source) return result
  safeDocumentStyle(source)

  for (const declaration of source.split(";")) {
    if (!declaration.trim()) continue
    const separator = declaration.indexOf(":")

    if (separator < 1) fail("Invalid document style for DOCX export.")
    result.set(
      declaration.slice(0, separator).trim().toLowerCase(),
      declaration.slice(separator + 1).trim(),
    )
  }

  return result
}

function parseFontSize(value: string) {
  const match = /^(\d+(?:\.\d+)?)(pt|px)$/.exec(value)

  if (!match) fail("DOCX export supports font sizes in px or pt only.")
  const number = Number(match[1])
  const halfPoints = Math.round(number * (match[2] === "px" ? 1.5 : 2))

  if (!Number.isInteger(halfPoints) || halfPoints < 2 || halfPoints > 320)
    fail("DOCX font size is outside its supported range.")

  return halfPoints
}

function runStyleFromCss(
  css: ReadonlyMap<string, string>,
  block = false,
): RunStyle {
  const style: RunStyle = {}

  for (const [property, value] of css) {
    switch (property) {
      case "font-size":
        style.fontSize = parseFontSize(value)
        break
      case "font-family": {
        const quoted = /^(?:'([^']+)'|"([^"]+)")$/.exec(value)
        const family = quoted?.[1] ?? quoted?.[2] ?? value

        if (
          !family ||
          /[,;\\]/.test(family) ||
          hasASCIIControlCharacter(family)
        )
          fail("DOCX export supports one font family at a time.")
        style.fontFamily = family
        break
      }

      case "color":
        style.color = value
        break
      case "background-color":
        style.backgroundColor = value
        break
      case "font-weight": {
        const weight = Number(value)

        if (
          value !== "normal" &&
          value !== "bold" &&
          (!Number.isInteger(weight) || weight < 100 || weight > 900)
        )
          fail("Unsupported DOCX font weight.")
        style.bold = value === "bold" || weight >= 600
        break
      }

      case "font-style":
        if (value !== "italic" && value !== "normal")
          fail("Unsupported DOCX font style.")
        style.italic = value === "italic"
        break
      case "text-decoration":
        if (!["none", "underline", "line-through"].includes(value))
          fail("Unsupported DOCX text decoration.")
        style.underline = value === "underline"
        style.strike = value === "line-through"
        break
      case "text-transform":
        if (value !== "uppercase" && value !== "none")
          fail("DOCX export does not support this text transform.")
        style.caps = value === "uppercase"
        break
      case "white-space":
        if (value !== "pre-wrap") fail("Unsupported DOCX white-space style.")
        break
      case "line-height":
      case "text-align":
      case "text-indent":
      case "padding-inline-start":
        if (!block) fail(`Unsupported inline DOCX style property: ${property}.`)
        break
      default:
        fail(`Unsupported DOCX style property: ${property}.`)
    }
  }

  return style
}

function mergeRunStyle(base: RunStyle, patch: RunStyle): RunStyle {
  return { ...base, ...patch }
}

function wordColor(value: string) {
  const color = value.toLowerCase()

  if (/^#[\da-f]{6}$/.test(color)) return color.slice(1)

  const named = new Map([
    ["black", "000000"],
    ["blue", "0000ff"],
    ["brown", "a52a2a"],
    ["gray", "808080"],
    ["green", "008000"],
    ["orange", "ffa500"],
    ["purple", "800080"],
    ["red", "ff0000"],
    ["white", "ffffff"],
    ["yellow", "ffff00"],
  ])

  const result = named.get(color)

  if (!result)
    fail("DOCX export supports named colors or six-digit hex colors.")

  return result
}

function runProperties(style: RunStyle) {
  const properties = [
    style.fontFamily
      ? `<w:rFonts w:ascii="${escapeXmlText(style.fontFamily)}" w:hAnsi="${escapeXmlText(style.fontFamily)}"/>`
      : style.code
        ? '<w:rFonts w:ascii="Consolas" w:hAnsi="Consolas"/>'
        : "",
    style.bold ? "<w:b/>" : "",
    style.italic ? "<w:i/>" : "",
    style.caps ? "<w:caps/>" : "",
    style.strike ? "<w:strike/>" : "",
    style.color ? `<w:color w:val="${wordColor(style.color)}"/>` : "",
    style.fontSize ? `<w:sz w:val="${style.fontSize}"/>` : "",
    style.underline ? '<w:u w:val="single"/>' : "",
    style.backgroundColor
      ? `<w:shd w:val="clear" w:color="auto" w:fill="${wordColor(style.backgroundColor)}"/>`
      : "",
    style.subscript ? '<w:vertAlign w:val="subscript"/>' : "",
    style.superscript ? '<w:vertAlign w:val="superscript"/>' : "",
  ].join("")

  return properties ? `<w:rPr>${properties}</w:rPr>` : ""
}

function emitText(value: string, style: RunStyle) {
  const output: string[] = []
  const parts = value.split(/(\n|\t)/)

  for (const part of parts) {
    if (!part) continue

    if (part === "\n") output.push("<w:br/>")
    else if (part === "\t") output.push("<w:tab/>")
    else {
      const encoded = escapeXmlText(part)
      const space = /^\s|\s$| {2,}/.test(part)
      const text = `<w:t${space ? ' xml:space="preserve"' : ""}>${encoded}</w:t>`
      output.push(`<w:r>${runProperties(style)}${text}</w:r>`)
    }
  }

  return output.join("")
}

function linkId(target: string, context: ExportContext) {
  if (
    target.length > 2048 ||
    hasForbiddenURLCharacter(target) ||
    !safeDocumentURL(target)
  )
    fail("Unsafe DOCX hyperlink.")

  const url = new URL(target)

  if (url.username || url.password)
    fail("DOCX hyperlinks cannot include URL credentials.")
  const existing = context.links.get(target)

  if (existing) return existing

  if (context.links.size >= docxLimits.externalRelationships)
    fail("DOCX hyperlink count exceeds its limit.")
  const id = `rId${context.links.size + 3}`
  context.links.set(target, id)

  return id
}

function inlineNode(
  node: RootContent,
  style: RunStyle,
  context: ExportContext,
): string {
  if (node.type === "text") return emitText(node.value, style)

  if (!isElement(node)) fail(`Unsupported DOCX inline node: ${node.type}.`)

  const tag = node.tagName

  if (
    [
      "strong",
      "b",
      "em",
      "i",
      "u",
      "s",
      "del",
      "sub",
      "sup",
      "code",
      "mark",
    ].includes(tag)
  ) {
    assertProperties(node, [])

    const patch: RunStyle =
      tag === "strong" || tag === "b"
        ? { bold: true }
        : tag === "em" || tag === "i"
          ? { italic: true }
          : tag === "u"
            ? { underline: true }
            : tag === "s" || tag === "del"
              ? { strike: true }
              : tag === "sub"
                ? { subscript: true }
                : tag === "sup"
                  ? { superscript: true }
                  : tag === "code"
                    ? { code: true }
                    : { backgroundColor: "#ffff00" }

    return node.children
      .map((child) => inlineNode(child, mergeRunStyle(style, patch), context))
      .join("")
  }

  if (tag === "span") {
    assertProperties(node, ["style"])
    const css = cssDeclarations(node)
    const patch = runStyleFromCss(css)

    return node.children
      .map((child) => inlineNode(child, mergeRunStyle(style, patch), context))
      .join("")
  }

  if (tag === "br") {
    assertProperties(node, [])

    return "<w:r><w:br/></w:r>"
  }

  if (tag === "a") {
    assertProperties(node, ["href", "title", "target", "rel"])
    const target = prop(node, "href")

    if (!target) fail("DOCX hyperlink has no URL.")
    const id = linkId(target, context)
    const title = prop(node, "title")
    const frame = prop(node, "target")

    const relations = (prop(node, "rel") ?? "")
      .split(/[\t\n\f\r ]+/)
      .filter(Boolean)

    if (
      (frame !== undefined && !["_blank", "_self"].includes(frame)) ||
      (frame !== undefined && hasASCIIControlCharacter(frame)) ||
      (title !== undefined && hasASCIIControlCharacter(title))
    )
      fail("DOCX hyperlink metadata is unsupported.")

    if (
      relations.length &&
      !(
        frame === "_blank" &&
        new Set(relations).size === 2 &&
        relations.every((relation) =>
          ["noopener", "noreferrer"].includes(relation),
        )
      )
    )
      fail("DOCX export cannot preserve link relations.")

    const attributes = [
      `r:id="${id}"`,
      'w:history="1"',
      title ? `w:tooltip="${escapeXmlText(title)}"` : "",
      frame ? `w:tgtFrame="${escapeXmlText(frame)}"` : "",
    ]
      .filter(Boolean)
      .join(" ")

    const content = node.children
      .map((child) => inlineNode(child, style, context))
      .join("")

    return `<w:hyperlink ${attributes}>${content}</w:hyperlink>`
  }

  fail(`Unsupported DOCX inline element: ${tag}.`)
}

function paragraphProperties(node: Element, list?: ListInfo, styleId?: string) {
  assertProperties(node, [
    "style",
    "dir",
    "dataEditorIndent",
    "dataEditorBlockPresentation",
    "dataEditorState",
  ])
  assertState(node)
  const css = cssDeclarations(node)
  assertBlockPresentation(node, css)
  const runStyle = runStyleFromCss(css, true)
  const styleProperty = styleId ? `<w:pStyle w:val="${styleId}"/>` : ""

  const listProperty = list
    ? `<w:numPr><w:ilvl w:val="${list.level}"/><w:numId w:val="${list.numId}"/></w:numPr>`
    : ""

  const alignment = css.get("text-align")

  const alignmentProperty = alignment
    ? `<w:jc w:val="${alignment === "justify" ? "both" : alignment}"/>`
    : ""

  const rawIndent = prop(node, "dataEditorIndent")

  if (rawIndent !== undefined) {
    const value = Number(rawIndent)

    if (
      !Number.isInteger(value) ||
      value < 0 ||
      value > 64 ||
      (value > 0 && css.get("padding-inline-start") !== `${value * 2}em`)
    )
      fail("DOCX export cannot preserve this block indentation.")
  }

  const left = css.get("padding-inline-start")
  const indent = css.get("text-indent")
  const leftTwips = left ? cssLengthToTwips(left) : 0
  const indentTwips = indent ? cssLengthToTwips(indent) : 0

  const indentationProperty =
    leftTwips || indentTwips
      ? `<w:ind${leftTwips ? ` w:start="${leftTwips}"` : ""}${indentTwips ? ` w:firstLine="${indentTwips}"` : ""}/>`
      : ""

  const lineHeight = css.get("line-height")

  const spacingProperty = lineHeight
    ? `<w:spacing w:line="${Math.round(Number(lineHeight) * 240)}" w:lineRule="auto"/>`
    : ""

  const direction = prop(node, "dir")

  if (direction && direction !== "rtl" && direction !== "ltr")
    fail("Unsupported DOCX paragraph direction.")
  const directionProperty = direction === "rtl" ? "<w:bidi/>" : ""

  const properties = [
    styleProperty,
    listProperty,
    directionProperty,
    spacingProperty,
    indentationProperty,
    alignmentProperty,
  ].join("")

  return {
    xml: properties ? `<w:pPr>${properties}</w:pPr>` : "",
    runStyle,
  }
}

function cssLengthToTwips(value: string) {
  if (value === "0") return 0
  const match = /^(\d+(?:\.\d+)?)(px|em|rem)$/.exec(value)

  if (!match) fail("DOCX export does not support this document length.")
  const length = Number(match[1])
  const twips = Math.round(length * (match[2] === "px" ? 15 : 240))

  if (!Number.isSafeInteger(twips) || twips < 0 || twips > 30_720)
    fail("DOCX paragraph indentation is outside its supported range.")

  return twips
}

function paragraphXml(
  node: Element,
  context: ExportContext,
  list?: ListInfo,
  styleId?: string,
  stylePatch: RunStyle = {},
) {
  const { xml, runStyle } = paragraphProperties(node, list, styleId)
  const inheritedRunStyle = mergeRunStyle(stylePatch, runStyle)

  const content = node.children
    .map((child) => inlineNode(child, inheritedRunStyle, context))
    .join("")

  return `<w:p>${xml}${content}</w:p>`
}

function listInfo(node: Element, context: ExportContext) {
  const info = context.lists.get(node)

  if (!info) fail("DOCX list metadata is missing.")

  return info
}

function renderList(node: Element, context: ExportContext) {
  const info = listInfo(node, context)
  assertProperties(node, [
    "start",
    "dataEditorIndent",
    "dataEditorBlockPresentation",
    "dataEditorState",
  ])
  assertState(node)
  const indent = prop(node, "dataEditorIndent")

  if (
    prop(node, "dataEditorBlockPresentation") ||
    (indent !== undefined && Number(indent) !== 0)
  )
    fail("DOCX export cannot preserve list presentation.")
  const items = children(node)

  if (!items.length || items.some((item) => item.tagName !== "li"))
    fail("Invalid DOCX list structure.")

  return items.map((item) => renderListItem(item, info, context)).join("")
}

function renderListItem(node: Element, info: ListInfo, context: ExportContext) {
  assertProperties(node, [
    "dataEditorIndent",
    "style",
    "dataEditorBlockPresentation",
    "dataEditorState",
  ])
  assertState(node)
  const indent = prop(node, "dataEditorIndent")

  if (
    prop(node, "dataEditorBlockPresentation") ||
    (indent !== undefined && Number(indent) !== 0)
  )
    fail("DOCX export cannot preserve list item presentation.")

  if (prop(node, "style")) fail("DOCX export cannot preserve list item styles.")

  const blocks = node.children.filter(
    (child) =>
      child.type === "element" || (child.type === "text" && child.value.trim()),
  )

  let numbered = false
  let output = ""

  for (const child of blocks) {
    if (child.type === "element" && child.tagName === "input")
      fail("Task-list items are unsupported in DOCX export.")

    if (child.type === "element" && ["ol", "ul"].includes(child.tagName)) {
      if (!numbered) {
        output += `<w:p><w:pPr><w:numPr><w:ilvl w:val="${info.level}"/><w:numId w:val="${info.numId}"/></w:numPr></w:pPr></w:p>`
        numbered = true
      }

      output += renderList(child, context)
      continue
    }

    if (
      child.type === "element" &&
      ["p", "h1", "h2", "h3", "h4", "h5", "h6"].includes(child.tagName)
    ) {
      output += paragraphFromElement(
        child,
        context,
        numbered ? {} : { list: info },
      )
      numbered = true
    } else if (child.type === "element" && child.tagName === "blockquote") {
      output += renderBlockquote(child, context, numbered ? undefined : info)
      numbered = true
    } else if (
      child.type === "element" &&
      ["pre", "table"].includes(child.tagName)
    ) {
      if (!numbered) {
        output += `<w:p><w:pPr><w:numPr><w:ilvl w:val="${info.level}"/><w:numId w:val="${info.numId}"/></w:numPr></w:pPr></w:p>`
        numbered = true
      }

      output += renderBlock(child, context)
    } else {
      output += paragraphFromInline(child, numbered ? undefined : info, context)
      numbered = true
    }
  }

  if (!numbered)
    output = `<w:p><w:pPr><w:numPr><w:ilvl w:val="${info.level}"/><w:numId w:val="${info.numId}"/></w:numPr></w:pPr></w:p>`

  return output
}

function paragraphFromInline(
  node: RootContent,
  list: ListInfo | undefined,
  context: ExportContext,
) {
  const content =
    node.type === "element"
      ? inlineNode(node, {}, context)
      : node.type === "text"
        ? emitText(node.value, {})
        : fail("Unsupported DOCX list item content.")

  const listProperties = list
    ? `<w:pPr><w:numPr><w:ilvl w:val="${list.level}"/><w:numId w:val="${list.numId}"/></w:numPr></w:pPr>`
    : ""

  return `<w:p>${listProperties}${content}</w:p>`
}

function collectLists(root: Root) {
  const lists = new WeakMap<Element, ListInfo>()
  const definitions: ListInfo[] = []

  function visit(node: RootContent, depth: number) {
    if (!isElement(node)) return

    if (node.tagName === "ol" || node.tagName === "ul") {
      if (depth > 8) fail("DOCX list nesting exceeds its limit.")
      const startValue = prop(node, "start")
      const start = startValue === undefined ? 1 : Number(startValue)

      if (!Number.isSafeInteger(start) || start < 1 || start > 2_147_483_647)
        fail("DOCX list start is outside its supported range.")
      const id = definitions.length + 1

      const info: ListInfo = {
        abstractId: id,
        numId: id,
        level: depth,
        tag: node.tagName,
        start,
      }

      definitions.push(info)
      lists.set(node, info)

      for (const child of node.children) visit(child, depth + 1)

      return
    }

    for (const child of node.children) visit(child, depth)
  }

  for (const child of root.children) visit(child, 0)

  return { lists, definitions }
}

function numberingXml(definitions: readonly ListInfo[]) {
  const entries = definitions
    .map((definition) => {
      const levels = Array.from(
        { length: definition.level + 1 },
        (_, level) => {
          const current = level === definition.level
          const bullet = current ? definition.tag === "ul" : level % 2 === 1
          const format = bullet ? "bullet" : "decimal"
          const marker = bullet ? "•" : `%${level + 1}.`
          const start = current ? definition.start : 1

          return `<w:lvl w:ilvl="${level}"><w:start w:val="${start}"/><w:numFmt w:val="${format}"/><w:lvlText w:val="${escapeXmlText(marker)}"/><w:lvlJc w:val="left"/><w:pPr><w:tabs><w:tab w:val="num" w:pos="${(level + 1) * 720}"/></w:tabs><w:ind w:start="${(level + 1) * 720}" w:hanging="360"/></w:pPr></w:lvl>`
        },
      ).join("")

      return `<w:abstractNum w:abstractNumId="${definition.abstractId}"><w:multiLevelType w:val="multilevel"/>${levels}</w:abstractNum><w:num w:numId="${definition.numId}"><w:abstractNumId w:val="${definition.abstractId}"/></w:num>`
    })
    .join("")

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:numbering xmlns:w="${wordNamespace}">${entries}</w:numbering>`
}

function stylesXml() {
  const headings = Array.from({ length: 6 }, (_, index) => {
    const level = index + 1

    return `<w:style w:type="paragraph" w:styleId="Heading${level}"><w:name w:val="heading ${level}"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/></w:style>`
  }).join("")

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="${wordNamespace}"><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>${headings}<w:style w:type="paragraph" w:styleId="Quote"><w:name w:val="Quote"/><w:basedOn w:val="Normal"/></w:style><w:style w:type="paragraph" w:styleId="Code"><w:name w:val="Code"/><w:basedOn w:val="Normal"/></w:style></w:styles>`
}

function paragraphFromElement(
  node: Element,
  context: ExportContext,
  options: { list?: ListInfo; quote?: boolean } = {},
) {
  const heading = /^h([1-6])$/.exec(node.tagName)

  const styleId = heading
    ? `Heading${heading[1]}`
    : options.quote
      ? "Quote"
      : undefined

  return paragraphXml(
    node,
    context,
    options.list,
    styleId,
    options.quote ? { italic: true } : {},
  )
}

function renderBlock(
  node: RootContent,
  context: ExportContext,
  quote = false,
): string {
  if (node.type === "text") {
    if (node.value.trim()) fail("Unexpected DOCX block text.")

    return ""
  }

  if (!isElement(node)) fail(`Unsupported DOCX block node: ${node.type}.`)

  switch (node.tagName) {
    case "p":
    case "h1":
    case "h2":
    case "h3":
    case "h4":
    case "h5":
    case "h6":
      return paragraphFromElement(node, context, { quote })
    case "blockquote":
      assertProperties(node, [])

      return node.children
        .map((child) => renderBlock(child, context, true))
        .join("")
    case "pre": {
      assertProperties(node, [
        "style",
        "dir",
        "dataEditorIndent",
        "dataEditorBlockPresentation",
        "dataEditorState",
      ])
      assertState(node)
      const code = children(node)

      const codeNode = code[0]

      if (code.length !== 1 || codeNode?.tagName !== "code")
        fail("Unsupported DOCX code block structure.")

      if (prop(codeNode, "className"))
        fail("DOCX export cannot preserve code language metadata.")

      return paragraphXml(node, context, undefined, "Code")
    }

    case "ol":
    case "ul":
      return renderList(node, context)
    case "table":
      return renderTable(node, context)
    default:
      fail(`Unsupported DOCX block element: ${node.tagName}.`)
  }
}

function tableCellBorder(value: string | undefined) {
  if (!value) return ""
  let border: TableBorder

  try {
    border = parseTableBorderHTML(value)
  } catch {
    fail("Invalid table border for DOCX export.")
  }

  if (!border) return ""
  const sides = ["top", "start", "bottom", "end"] as const
  const entries = new Map<string, "solid" | "hidden">()

  if (border === "solid" || border === "hidden") {
    for (const side of sides) entries.set(side, border)
  } else {
    for (const side of sides) {
      const value = border[side]

      if (value) entries.set(side, value)
    }
  }

  const xml = [...entries]
    .map(
      ([side, style]) =>
        `<w:${side} w:val="${style === "solid" ? "single" : "nil"}"${style === "solid" ? ' w:sz="4" w:color="000000"' : ""}/>`,
    )
    .join("")

  return xml ? `<w:tcBorders>${xml}</w:tcBorders>` : ""
}

function tableCellXml(
  node: Element,
  placement: TableCellPlacement,
  context: ExportContext,
  continuation = false,
) {
  assertProperties(node, [
    "style",
    "dir",
    "align",
    "colSpan",
    "rowSpan",
    "dataEditorBorder",
    "dataEditorHeaderState",
    "dataEditorIndent",
    "dataEditorBlockPresentation",
    "dataEditorState",
  ])
  assertState(node)
  const rawHeaderState = prop(node, "dataEditorHeaderState")
  const headerState = Number(rawHeaderState ?? (node.tagName === "th" ? 1 : 0))

  if (
    !Number.isInteger(headerState) ||
    headerState < 0 ||
    headerState > 1 ||
    (headerState === 1) !== (node.tagName === "th")
  )
    fail("DOCX export cannot preserve this table header style.")

  if (
    prop(node, "dir") ||
    prop(node, "align") ||
    prop(node, "dataEditorBlockPresentation") ||
    (prop(node, "dataEditorIndent") !== undefined &&
      Number(prop(node, "dataEditorIndent")) !== 0)
  )
    fail("DOCX export cannot preserve this table cell presentation.")
  const css = cssDeclarations(node)

  if (
    [...css.keys()].some(
      (key) =>
        ![
          "width",
          "background-color",
          "vertical-align",
          "min-inline-size",
          "overflow-wrap",
        ].includes(key),
    )
  )
    fail("DOCX export cannot preserve this table cell style.")
  const width = css.get("width")

  const widthMatch =
    width === undefined ? undefined : /^(\d+(?:\.\d+)?)px$/.exec(width)

  if (width !== undefined && !widthMatch)
    fail("DOCX table cell width must use pixels.")
  const widthPx = widthMatch ? Number(widthMatch[1]) : undefined

  if (widthPx !== undefined && (widthPx <= 0 || widthPx > 640))
    fail("DOCX table cell width is outside its supported range.")
  const fill = css.get("background-color")
  const vertical = css.get("vertical-align")
  const border = tableCellBorder(prop(node, "dataEditorBorder"))

  const cellProperties = [
    widthPx !== undefined
      ? `<w:tcW w:w="${Math.round(widthPx * 15)}" w:type="dxa"/>`
      : "",
    placement.colSpan > 1 ? `<w:gridSpan w:val="${placement.colSpan}"/>` : "",
    placement.rowSpan > 1
      ? `<w:vMerge w:val="${continuation ? "continue" : "restart"}"/>`
      : continuation
        ? '<w:vMerge w:val="continue"/>'
        : "",
    border,
    fill
      ? `<w:shd w:val="clear" w:color="auto" w:fill="${wordColor(fill)}"/>`
      : "",
    vertical
      ? `<w:vAlign w:val="${vertical === "middle" ? "center" : vertical}"/>`
      : "",
  ].join("")

  const properties = cellProperties ? `<w:tcPr>${cellProperties}</w:tcPr>` : ""

  if (continuation) return `<w:tc>${properties}<w:p/></w:tc>`

  const content = node.children
    .map((child) => renderBlock(child, context))
    .join("")

  return `<w:tc>${properties}${content || "<w:p/>"}</w:tc>`
}

function tableRows(node: Element) {
  const rows: { node: Element; header: boolean }[] = []

  if (
    node.children.some(
      (child) => child.type === "text" && child.value.trim() !== "",
    )
  )
    fail("Unsupported DOCX table text content.")
  const items = children(node)
  const directRows = items.some((child) => child.tagName === "tr")

  if (
    items.some(
      (child) =>
        !["tr", "colgroup", "thead", "tbody", "tfoot"].includes(child.tagName),
    )
  )
    fail("Unsupported DOCX table structure.")

  if (
    directRows &&
    items.some((child) => ["thead", "tbody", "tfoot"].includes(child.tagName))
  )
    fail("Mixed DOCX table sections are unsupported.")

  if (directRows) {
    for (const child of items)
      if (child.tagName === "tr") rows.push({ node: child, header: false })
  } else {
    for (const group of items.filter((child) =>
      ["thead", "tbody", "tfoot"].includes(child.tagName),
    )) {
      if (
        group.children.some((child) =>
          child.type === "text"
            ? child.value.trim() !== ""
            : child.type !== "element" || child.tagName !== "tr",
        )
      )
        fail("Unsupported DOCX table section.")

      for (const row of children(group))
        rows.push({ node: row, header: group.tagName === "thead" })
    }
  }

  if (!rows.length || rows.length > 50) fail("Invalid DOCX table row count.")

  return rows
}

function tableColumnWidths(node: Element, columnCount: number) {
  const source = prop(node, "dataEditorColWidths")

  const colgroups = children(node).filter(
    (child) => child.tagName === "colgroup",
  )

  if (colgroups.length > 1) fail("DOCX table has multiple column groups.")
  const colgroup = colgroups[0]
  let widths: number[] = []

  if (colgroup) assertProperties(colgroup, [])
  const columns = colgroup ? children(colgroup) : []

  if (colgroup && columns.length === 0)
    fail("DOCX table column group is empty.")

  if (columns.some((column) => column.tagName !== "col"))
    fail("Unsupported DOCX table column structure.")

  const groupWidths = columns.map((column) => {
    assertProperties(column, ["style"])
    const css = cssDeclarations(column)
    const width = css.get("width")

    if (!width || [...css.keys()].some((key) => key !== "width"))
      fail("Invalid table column width for DOCX export.")
    const match = /^(\d+(?:\.\d+)?)px$/.exec(width)
    const value = match ? Number(match[1]) : Number.NaN

    if (!Number.isFinite(value) || value < 48 || value > 640)
      fail("Invalid table column width for DOCX export.")

    return value
  })

  if (source) {
    let parsed: unknown

    try {
      parsed = JSON.parse(source)
    } catch {
      fail("Invalid table column widths for DOCX export.")
    }

    const parsedWidths = z
      .array(z.number().finite().min(48).max(640))
      .max(50)
      .safeParse(parsed)

    if (!parsedWidths.success)
      fail("Invalid table column widths for DOCX export.")
    const values = parsedWidths.data

    if (
      columns.length &&
      (groupWidths.length !== values.length ||
        groupWidths.some((width, index) => width !== values[index]))
    )
      fail("Table column widths do not match their metadata.")
    widths = values
  } else widths = groupWidths

  if (widths.length && widths.length !== columnCount)
    fail("Table column widths do not match DOCX table geometry.")

  return widths
}

function renderTable(node: Element, context: ExportContext) {
  assertProperties(node, [
    "style",
    "align",
    "dataEditorColWidths",
    "dataEditorState",
    "dataEditorRowStriping",
    "dataLexicalRowStriping",
    "dataLexicalFrozenColumn",
    "dataLexicalFrozenRow",
    "dataEditorFrozenColumns",
    "dataEditorFrozenRows",
  ])
  assertState(node)

  if (
    prop(node, "dataEditorRowStriping") !== undefined ||
    prop(node, "dataLexicalRowStriping") !== undefined ||
    prop(node, "dataLexicalFrozenColumn") !== undefined ||
    prop(node, "dataLexicalFrozenRow") !== undefined ||
    prop(node, "dataEditorFrozenColumns") !== undefined ||
    prop(node, "dataEditorFrozenRows") !== undefined
  )
    fail("DOCX export cannot preserve table striping or frozen regions.")
  const tableCss = cssDeclarations(node)

  if (
    [...tableCss.keys()].some(
      (key) => !["table-layout", "inline-size"].includes(key),
    )
  )
    fail("DOCX export cannot preserve this table style.")

  const rows = tableRows(node)

  if (
    rows.some(({ node: row }) =>
      row.children.some((child) =>
        child.type === "text"
          ? child.value.trim() !== ""
          : child.type !== "element" || !["td", "th"].includes(child.tagName),
      ),
    )
  )
    fail("Unsupported DOCX table row content.")

  const cellNodes = rows.flatMap(({ node: row }) =>
    children(row).filter((cell) => ["td", "th"].includes(cell.tagName)),
  )

  if (
    cellNodes.some((cell) =>
      children(cell).some(
        (child) =>
          !["p", "blockquote", "ol", "ul", "table"].includes(child.tagName),
      ),
    )
  )
    fail("Unsupported DOCX table cell content.")

  let geometry: ReturnType<typeof getTableSpanGeometry>

  try {
    geometry = getTableSpanGeometry(
      rows.map(({ node: row }) =>
        children(row)
          .filter((cell) => ["td", "th"].includes(cell.tagName))
          .map((cell) => ({
            colSpan: Number(prop(cell, "colSpan") ?? 1),
            rowSpan: Number(prop(cell, "rowSpan") ?? 1),
          })),
      ),
    )
  } catch (error) {
    fail(
      error instanceof Error ? error.message : "Invalid DOCX table geometry.",
    )
  }

  const widths = tableColumnWidths(node, geometry.columns)
  const tableInlineSize = tableCss.get("inline-size")
  const tableLayout = tableCss.get("table-layout")

  if (widths.length) {
    const width = widths.reduce((sum, value) => sum + value, 0)

    if (
      tableLayout !== "fixed" ||
      !tableInlineSize ||
      Number(tableInlineSize.replace(/px$/, "")) !== width
    )
      fail("Table layout CSS does not match its column widths.")
  } else if (tableCss.size)
    fail("DOCX export cannot preserve this table layout.")

  const placements: TableCellPlacement[] = geometry.placements.map(
    (placement, index) => {
      const cell = cellNodes[index]

      if (!cell) fail("Invalid DOCX table geometry.")

      return { ...placement, node: cell }
    },
  )

  const grid = `<w:tblGrid>${
    widths.length
      ? widths
          .map((width) => `<w:gridCol w:w="${Math.round(width * 15)}"/>`)
          .join("")
      : Array.from({ length: geometry.columns }, () => "<w:gridCol/>").join("")
  }</w:tblGrid>`

  const tableAlignment = prop(node, "align")

  if (
    tableAlignment !== undefined &&
    !["left", "center", "right"].includes(tableAlignment)
  )
    fail("Unsupported DOCX table alignment.")

  const tableProperties = [
    widths.length
      ? `<w:tblW w:w="${Math.round(widths.reduce((sum, width) => sum + width, 0) * 15)}" w:type="dxa"/>`
      : '<w:tblW w:w="0" w:type="auto"/>',
    tableAlignment
      ? `<w:jc w:val="${tableAlignment === "center" ? "center" : tableAlignment}"/>`
      : "",
    widths.length ? '<w:tblLayout w:type="fixed"/>' : "",
  ].join("")

  const rowXml = rows
    .map(({ node: row, header }, rowIndex) => {
      assertProperties(row, ["style", "dataEditorRowHeight", "dataEditorState"])
      assertState(row)
      const css = cssDeclarations(row)

      if ([...css.keys()].some((key) => key !== "height"))
        fail("DOCX export cannot preserve this table row style.")
      const attributeHeight = prop(row, "dataEditorRowHeight")
      const styleHeight = css.get("height")?.replace(/px$/, "")
      const rawHeight = attributeHeight ?? styleHeight
      const height = rawHeight === undefined ? undefined : Number(rawHeight)

      const rowCells = children(row).filter((cell) =>
        ["td", "th"].includes(cell.tagName),
      )

      const allHeaders =
        rowCells.length > 0 && rowCells.every((cell) => cell.tagName === "th")

      const hasHeaders = rowCells.some((cell) => cell.tagName === "th")

      if (hasHeaders && !allHeaders)
        fail("Mixed DOCX table header cells are unsupported.")

      if (header && !allHeaders) fail("DOCX header rows must use header cells.")

      if (
        attributeHeight !== undefined &&
        styleHeight !== undefined &&
        attributeHeight !== styleHeight
      )
        fail("DOCX table row height metadata does not match its style.")
      const rowHeader = header || allHeaders

      if (
        height !== undefined &&
        (!Number.isFinite(height) || height < 0 || height > 10_000)
      )
        fail("Invalid DOCX table row height.")

      const rowProperties = [
        height !== undefined
          ? `<w:trHeight w:val="${Math.round(height * 15)}" w:hRule="atLeast"/>`
          : "",
        rowHeader ? "<w:tblHeader/>" : "",
      ].join("")

      const cells: { start: number; xml: string }[] = []

      for (const placement of placements) {
        if (placement.row === rowIndex)
          cells.push({
            start: placement.column,
            xml: tableCellXml(placement.node, placement, context),
          })
        else if (
          placement.row < rowIndex &&
          placement.row + placement.rowSpan > rowIndex
        )
          cells.push({
            start: placement.column,
            xml: tableCellXml(placement.node, placement, context, true),
          })
      }

      cells.sort((left, right) => left.start - right.start)

      return `<w:tr>${rowProperties ? `<w:trPr>${rowProperties}</w:trPr>` : ""}${cells.map((cell) => cell.xml).join("")}</w:tr>`
    })
    .join("")

  return `<w:tbl><w:tblPr>${tableProperties}</w:tblPr>${grid}${rowXml}</w:tbl>`
}

function renderBlockquote(
  node: Element,
  context: ExportContext,
  list?: ListInfo,
) {
  assertProperties(node, [])
  let numbered = false

  return node.children
    .map((child) => {
      if (
        child.type === "element" &&
        ["p", "h1", "h2", "h3", "h4", "h5", "h6"].includes(child.tagName)
      ) {
        const output = paragraphFromElement(child, context, {
          quote: true,
          list: numbered ? undefined : list,
        })

        numbered = true

        return output
      }

      if (list)
        fail("DOCX list items cannot contain nested non-paragraph quotations.")

      return renderBlock(child, context, true)
    })
    .join("")
}

function documentBody(root: Root, context: ExportContext) {
  return root.children
    .map((child) => {
      if (child.type === "element" && child.tagName === "blockquote")
        return renderBlockquote(child, context)

      return renderBlock(child, context)
    })
    .join("")
}

function relationshipXml(context: ExportContext) {
  const relationships = [
    `<Relationship Id="rId1" Type="${relationshipTypeBase}styles" Target="styles.xml"/>`,
    `<Relationship Id="rId2" Type="${relationshipTypeBase}numbering" Target="numbering.xml"/>`,
    ...[...context.links].map(
      ([target, id]) =>
        `<Relationship Id="${id}" Type="${relationshipTypeBase}hyperlink" Target="${escapeXmlText(target)}" TargetMode="External"/>`,
    ),
  ].join("")

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="${packageRelationshipNamespace}">${relationships}</Relationships>`
}

function rootRelationshipsXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="${packageRelationshipNamespace}"><Relationship Id="rId1" Type="${relationshipTypeBase}officeDocument" Target="word/document.xml"/></Relationships>`
}

function contentTypesXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="${contentTypeNamespace}"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="${mainDocumentType}"/><Override PartName="/word/styles.xml" ContentType="${stylesType}"/><Override PartName="/word/numbering.xml" ContentType="${numberingType}"/></Types>`
}

function documentXml(body: string) {
  const section =
    '<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/></w:sectPr>'

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="${wordNamespace}" xmlns:r="${relationshipNamespace}"><w:body>${body}${section}</w:body></w:document>`
}

function textPart(path: string, source: string): ZipWriteEntry {
  checkText(source)

  return { name: path, data: new TextEncoder().encode(source) }
}

export function exportDocx(editor: LexicalEditor) {
  const html = exportDocument(editor, "html")
  const tree = parseHTMLSyntax(html)
  const { lists, definitions } = collectLists(tree)

  const context: ExportContext = {
    lists,
    listDefinitions: definitions,
    links: new Map(),
  }

  const document = documentXml(documentBody(tree, context))

  const entries = [
    textPart("[Content_Types].xml", contentTypesXml()),
    textPart("_rels/.rels", rootRelationshipsXml()),
    textPart("word/document.xml", document),
    textPart("word/styles.xml", stylesXml()),
    textPart("word/numbering.xml", numberingXml(context.listDefinitions)),
    textPart("word/_rels/document.xml.rels", relationshipXml(context)),
  ]

  const archive = writeZipArchive(entries)

  if (archive.byteLength > docxLimits.compressedBytes)
    fail("DOCX export exceeds the archive size limit.")

  return archive
}
