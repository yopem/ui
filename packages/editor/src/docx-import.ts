import type { LexicalEditor } from "lexical"

import {
  checkText,
  DocumentError,
  safeDocumentStyle,
  safeDocumentURL,
} from "./document/boundary"
import { importDocument, parseDocument } from "./document/index"
import { docxLimits } from "./docx-limits"
import {
  hasASCIIControlCharacter,
  hasForbiddenURLCharacter,
} from "./docx-security"
import {
  assertSafeXml,
  parseXml,
  xmlAttribute,
  xmlChild,
  xmlChildren,
  xmlText,
  type XmlNode,
} from "./docx-xml"
import { readZipArchiveAsync } from "./docx-zip"
import { parseTableBorderHTML } from "./table-presentation-schema"

const packageRelationshipNamespace =
  "http://schemas.openxmlformats.org/package/2006/relationships"

const contentTypeNamespace =
  "http://schemas.openxmlformats.org/package/2006/content-types"

const wordNamespaces = new Set([
  "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
  "http://purl.oclc.org/ooxml/wordprocessingml/main",
])

const relationshipTypePrefix =
  "http://schemas.openxmlformats.org/officeDocument/2006/relationships/"

const strictRelationshipTypePrefix =
  "http://purl.oclc.org/ooxml/officeDocument/relationships/"

export type DocxSource = Blob | ArrayBuffer | Uint8Array

export interface DocxImportOptions {
  signal?: AbortSignal
}

interface Relation {
  id: string
  type: string
  kind: string
  target: string
  external: boolean
}

interface ListDefinition {
  format: string
  text: string
  start: number
}

interface NumberingIndex {
  nums: Map<number, { abstractId: number; starts: Map<number, number> }>
  abstracts: Map<number, Map<number, ListDefinition>>
}

interface ParagraphList {
  id: number
  level: number
  tag: "ol" | "ul"
  start: number
}

type HtmlBlock =
  | { kind: "html"; html: string }
  | {
      kind: "list"
      tag: "ol" | "ul"
      start: number
      items: { blocks: HtmlBlock[] }[]
    }

interface ListStackEntry {
  id: number
  tag: "ol" | "ul"
  list: Extract<HtmlBlock, { kind: "list" }>
  item: { blocks: HtmlBlock[] }
}

interface TextStyle {
  bold: boolean
  italic: boolean
  underline: boolean
  strike: boolean
  code: boolean
  subscript: boolean
  superscript: boolean
  highlight: boolean
  css: Map<string, string>
}

interface TableCell {
  start: number
  span: number
  rowSpan: number
  tag: "td" | "th"
  style: string
  border: string | undefined
  content: string
}

function fail(message: string): never {
  throw new DocumentError([message])
}

function checkSignal(signal?: AbortSignal) {
  if (signal?.aborted) fail("DOCX import cancelled.")
}

function encodeHtml(source: string) {
  return source
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

function decodeXmlPart(files: ReadonlyMap<string, Uint8Array>, name: string) {
  const bytes = files.get(name)

  if (!bytes) return undefined
  let text: string

  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes)
  } catch {
    fail(`DOCX XML is not UTF-8: ${name}.`)
  }

  assertSafeXml(text)

  return text
}

function assertXmlAttributes(node: XmlNode, allowed: readonly string[]) {
  const names = new Set(allowed)

  for (const name of node.attributes.keys())
    if (name !== "xmlns" && !name.startsWith("xmlns:") && !names.has(name))
      fail(`Unsupported DOCX XML attribute: ${name}.`)
}

function requireRootNamespace(node: XmlNode, name: string, expected: string) {
  if (node.name !== name || node.namespaceURI !== expected)
    fail(`Invalid DOCX XML root: ${name}.`)
  assertXmlAttributes(node, [])
}

function elementChildren(node: XmlNode) {
  for (const child of node.children) {
    if (child.type === "text" && child.value.trim())
      fail(`Unexpected text in DOCX XML element: ${node.name}.`)

    if (child.type === "element" && child.namespaceURI !== node.namespaceURI)
      fail(`Unexpected DOCX XML namespace in: ${node.name}.`)
  }

  return node.children.filter(
    (child): child is XmlNode => child.type === "element",
  )
}

function relationKind(type: string) {
  const prefixes = [relationshipTypePrefix, strictRelationshipTypePrefix]

  if (!prefixes.some((prefix) => type.startsWith(prefix)))
    fail("Unsupported DOCX relationship namespace.")

  return type.slice(type.lastIndexOf("/") + 1)
}

function relationshipSource(path: string) {
  if (path === "_rels/.rels") return ""
  const match = /^(.*\/)?_rels\/([^/]+)\.rels$/.exec(path)

  if (!match) fail("Invalid DOCX relationship part name.")

  return `${match[1] ?? ""}${match[2]}`
}

function resolvePart(source: string, target: string) {
  if (
    !target ||
    target.length > 2048 ||
    target.includes("\\") ||
    target.includes("%") ||
    target.includes("?") ||
    target.includes("#") ||
    /^[a-z][a-z\d+.-]*:/i.test(target)
  )
    fail("Invalid internal DOCX relationship target.")

  const targetPath = target.replace(/^\//, "")
  const parts = targetPath.split("/")

  if (parts.some((part) => !part || part === "."))
    fail("Invalid internal DOCX relationship target.")

  const segments = target.startsWith("/")
    ? []
    : source.split("/").slice(0, -1).filter(Boolean)

  for (const part of parts) {
    if (part === "..") {
      if (!segments.length) fail("DOCX relationship escapes package root.")
      segments.pop()
    } else segments.push(part)
  }

  if (!segments.length) fail("Invalid internal DOCX relationship target.")

  return segments.join("/")
}

function safeHyperlink(value: string) {
  if (
    value.length > 2048 ||
    hasForbiddenURLCharacter(value) ||
    !safeDocumentURL(value)
  )
    return false
  const url = new URL(value)

  return !url.username && !url.password
}

function parseRelationships(
  path: string,
  source: string,
  files: ReadonlyMap<string, Uint8Array>,
  externalCount: { value: number },
) {
  const root = parseXml(source)
  requireRootNamespace(root, "Relationships", packageRelationshipNamespace)
  const result = new Map<string, Relation>()
  const entries = elementChildren(root)

  if (entries.length > docxLimits.relationships)
    fail("DOCX relationship count exceeds its limit.")

  for (const entry of entries) {
    if (entry.name !== "Relationship")
      fail("Unsupported DOCX relationship element.")
    assertXmlAttributes(entry, ["Id", "Type", "Target", "TargetMode"])

    if (elementChildren(entry).length)
      fail("Invalid DOCX relationship element.")
    const id = xmlAttribute(entry, "Id")
    const type = xmlAttribute(entry, "Type")
    const target = xmlAttribute(entry, "Target")
    const targetMode = xmlAttribute(entry, "TargetMode")

    if (
      !id ||
      !/^rId[1-9]\d{0,5}$/.test(id) ||
      !type ||
      type.length > 256 ||
      !target ||
      result.has(id) ||
      (targetMode !== undefined &&
        targetMode !== "External" &&
        targetMode !== "Internal")
    )
      fail("Invalid DOCX relationship.")

    const kind = relationKind(type)
    const external = targetMode === "External"

    if (external) {
      externalCount.value++

      if (
        externalCount.value > docxLimits.externalRelationships ||
        kind !== "hyperlink" ||
        !safeHyperlink(target)
      )
        fail("Unsafe or unsupported external DOCX relationship.")
    } else {
      const resolved = resolvePart(source, target)

      if (!files.has(resolved)) fail("DOCX relationship target is missing.")
      result.set(id, { id, type, kind, target: resolved, external })
      continue
    }

    result.set(id, { id, type, kind, target, external })
  }

  if (path === "_rels/.rels") {
    for (const relation of result.values())
      if (
        !["officeDocument", "core-properties", "extended-properties"].includes(
          relation.kind,
        ) ||
        relation.external
      )
        fail("Unsupported DOCX package relationship.")
  }

  return result
}

function contentTypes(files: ReadonlyMap<string, Uint8Array>) {
  const xml = decodeXmlPart(files, "[Content_Types].xml")

  if (!xml) fail("DOCX content types part is missing.")
  const root = parseXml(xml)
  requireRootNamespace(root, "Types", contentTypeNamespace)
  let hasDocument = false

  for (const entry of elementChildren(root)) {
    if (entry.name === "Default") {
      assertXmlAttributes(entry, ["Extension", "ContentType"])

      if (elementChildren(entry).length)
        fail("Invalid DOCX content type entry.")
      const extension = xmlAttribute(entry, "Extension")
      const contentType = xmlAttribute(entry, "ContentType")

      if (
        !extension ||
        !contentType ||
        /macroEnabled|vbaProject/i.test(contentType)
      )
        fail("Unsupported DOCX content type.")
    } else if (entry.name === "Override") {
      assertXmlAttributes(entry, ["PartName", "ContentType"])

      if (elementChildren(entry).length)
        fail("Invalid DOCX content type entry.")
      const partName = xmlAttribute(entry, "PartName")
      const contentType = xmlAttribute(entry, "ContentType")

      if (
        !partName ||
        !contentType ||
        /macroEnabled|vbaProject/i.test(contentType)
      )
        fail("Unsupported DOCX content type.")

      if (
        partName === "/word/document.xml" &&
        contentType ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"
      )
        hasDocument = true
    } else fail("Unsupported DOCX content type entry.")
  }

  if (!hasDocument || files.has("word/vbaProject.bin"))
    fail("DOCX main document content type is missing or unsafe.")
}

function readRelationships(
  files: ReadonlyMap<string, Uint8Array>,
  xmlParts: ReadonlyMap<string, string>,
) {
  const parsed = new Map<string, Map<string, Relation>>()
  const externalCount = { value: 0 }

  for (const path of xmlParts.keys()) {
    if (!path.endsWith(".rels")) continue
    const source = relationshipSource(path)
    parsed.set(path, parseRelationships(path, source, files, externalCount))
  }

  return parsed
}

function relationshipPart(path: string) {
  const slash = path.lastIndexOf("/")
  const directory = slash < 0 ? "" : path.slice(0, slash + 1)
  const filename = slash < 0 ? path : path.slice(slash + 1)

  return `${directory}_rels/${filename}.rels`
}

function requireWordRoot(root: XmlNode, name: string) {
  if (root.name !== `w:${name}` || !wordNamespaces.has(root.namespaceURI))
    fail(`Invalid WordprocessingML root: ${name}.`)
  assertXmlAttributes(root, [])
}

function parseStyles(source: string | undefined) {
  const result = new Map<string, { type: string; outline: number | null }>()
  const basedOn = new Map<string, string>()

  if (!source) return result
  const root = parseXml(source)
  requireWordRoot(root, "styles")

  for (const entry of elementChildren(root)) {
    if (entry.name === "w:docDefaults") {
      assertXmlAttributes(entry, [])

      if (elementChildren(entry).length)
        fail("DOCX default style formatting is unsupported.")
      continue
    }

    if (entry.name !== "w:style") fail("Unsupported DOCX style definition.")
    assertXmlAttributes(entry, ["w:type", "w:default", "w:styleId"])
    const id = xmlAttribute(entry, "w:styleId")
    const type = xmlAttribute(entry, "w:type")
    const properties = xmlChild(entry, "w:pPr")
    const runProperties = xmlChild(entry, "w:rPr")

    const outline = properties
      ? xmlChild(properties, "w:outlineLvl")
      : undefined

    const levelText = outline ? xmlAttribute(outline, "w:val") : undefined
    const level = levelText === undefined ? null : Number(levelText)
    const base = xmlChild(entry, "w:basedOn")
    const baseId = base ? xmlAttribute(base, "w:val") : undefined
    const defaultValue = xmlAttribute(entry, "w:default")

    if (
      (defaultValue !== undefined && !["0", "1"].includes(defaultValue)) ||
      !id ||
      !type ||
      !["paragraph", "character"].includes(type) ||
      result.has(id) ||
      (base !== undefined && !baseId) ||
      (baseId !== undefined && (baseId !== "Normal" || id === "Normal"))
    )
      fail("Invalid DOCX style definition.")

    if (properties) {
      if (
        elementChildren(properties).some(
          (property) => property.name !== "w:outlineLvl",
        )
      )
        fail("DOCX paragraph style formatting is unsupported.")
      assertXmlAttributes(properties, [])
    }

    if (runProperties && elementChildren(runProperties).length)
      fail("DOCX run style formatting is unsupported.")

    if (outline) {
      assertXmlAttributes(outline, ["w:val"])

      if (levelText === undefined || elementChildren(outline).length)
        fail("Invalid DOCX outline level.")
    }

    for (const child of elementChildren(entry)) {
      if (
        ![
          "w:name",
          "w:basedOn",
          "w:next",
          "w:qFormat",
          "w:pPr",
          "w:rPr",
        ].includes(child.name)
      )
        fail("Unsupported DOCX style property.")

      if (
        child.name === "w:name" ||
        child.name === "w:basedOn" ||
        child.name === "w:next"
      ) {
        assertXmlAttributes(child, ["w:val"])

        if (!xmlAttribute(child, "w:val") || elementChildren(child).length)
          fail("Invalid DOCX style metadata.")
      } else if (child.name === "w:qFormat") {
        assertXmlAttributes(child, [])

        if (elementChildren(child).length) fail("Invalid DOCX style metadata.")
      } else if (child.name === "w:rPr") assertXmlAttributes(child, [])
    }

    if (level !== null && (!Number.isInteger(level) || level < 0 || level > 8))
      fail("Invalid DOCX outline level.")

    result.set(id, { type, outline: level })

    if (baseId) basedOn.set(id, baseId)
  }

  const normal = result.get("Normal")

  for (const [id, baseId] of basedOn) {
    if (!normal || baseId !== "Normal")
      fail("Unsupported DOCX style inheritance.")
    const style = result.get(id)

    if (style?.outline === null && normal.outline !== null)
      result.set(id, { ...style, outline: normal.outline })
  }

  return result
}

function parseNumbering(
  source: string | undefined,
): NumberingIndex | undefined {
  if (!source) return undefined
  const root = parseXml(source)
  requireWordRoot(root, "numbering")
  const abstracts = new Map<number, Map<number, ListDefinition>>()

  const nums = new Map<
    number,
    { abstractId: number; starts: Map<number, number> }
  >()

  for (const abstract of xmlChildren(root, "w:abstractNum")) {
    const rawId = xmlAttribute(abstract, "w:abstractNumId")
    const id = rawId === undefined ? Number.NaN : Number(rawId)

    if (!Number.isInteger(id) || id < 0 || abstracts.has(id))
      fail("Invalid DOCX abstract numbering definition.")
    const levels = new Map<number, ListDefinition>()

    for (const level of xmlChildren(abstract, "w:lvl")) {
      const rawLevel = xmlAttribute(level, "w:ilvl")
      const index = rawLevel === undefined ? Number.NaN : Number(rawLevel)
      const format = xmlAttribute(xmlChild(level, "w:numFmt") ?? level, "w:val")
      const text = xmlAttribute(xmlChild(level, "w:lvlText") ?? level, "w:val")

      const rawStart = xmlAttribute(
        xmlChild(level, "w:start") ?? level,
        "w:val",
      )

      const start = rawStart === undefined ? 1 : Number(rawStart)

      if (
        !Number.isInteger(index) ||
        index < 0 ||
        index > 8 ||
        !format ||
        !text ||
        text.length > 64 ||
        !Number.isInteger(start) ||
        start < 1 ||
        start > 2_147_483_647 ||
        levels.has(index)
      )
        fail("Invalid DOCX numbering level.")

      levels.set(index, { format, text, start })
    }

    abstracts.set(id, levels)
  }

  for (const num of xmlChildren(root, "w:num")) {
    const rawId = xmlAttribute(num, "w:numId")
    const numId = rawId === undefined ? Number.NaN : Number(rawId)
    const abstractIdElement = xmlChild(num, "w:abstractNumId")

    const rawAbstractId = abstractIdElement
      ? xmlAttribute(abstractIdElement, "w:val")
      : undefined

    const abstractId =
      rawAbstractId === undefined ? Number.NaN : Number(rawAbstractId)

    const starts = new Map<number, number>()

    if (
      !Number.isInteger(numId) ||
      numId < 1 ||
      nums.has(numId) ||
      !Number.isInteger(abstractId) ||
      !abstracts.has(abstractId)
    )
      fail("Invalid DOCX numbering instance.")

    for (const override of xmlChildren(num, "w:lvlOverride")) {
      if (xmlChild(override, "w:lvl"))
        fail("Custom DOCX numbering overrides are unsupported.")
      const rawLevel = xmlAttribute(override, "w:ilvl")
      const level = rawLevel === undefined ? Number.NaN : Number(rawLevel)
      const startElement = xmlChild(override, "w:startOverride")

      const rawStart = startElement
        ? xmlAttribute(startElement, "w:val")
        : undefined

      const start = rawStart === undefined ? Number.NaN : Number(rawStart)

      if (
        !Number.isInteger(level) ||
        level < 0 ||
        level > 8 ||
        !Number.isInteger(start) ||
        start < 1 ||
        start > 2_147_483_647
      )
        fail("Invalid DOCX numbering override.")
      starts.set(level, start)
    }

    nums.set(numId, { abstractId, starts })
  }

  return { nums, abstracts }
}

function numericAttribute(node: XmlNode, name: string, fallback = 0) {
  const raw = xmlAttribute(node, name)

  if (raw === undefined) return fallback
  const value = Number(raw)

  if (!Number.isSafeInteger(value)) fail(`Invalid DOCX numeric value: ${name}.`)

  return value
}

function resolveList(
  properties: XmlNode | undefined,
  numbering: NumberingIndex | undefined,
): ParagraphList | undefined {
  if (!properties) return undefined
  const numPr = xmlChild(properties, "w:numPr")

  if (!numPr) return undefined
  const numIdElement = xmlChild(numPr, "w:numId")
  const rawId = numIdElement ? xmlAttribute(numIdElement, "w:val") : undefined
  const id = rawId === undefined ? Number.NaN : Number(rawId)

  if (id === 0) return undefined
  const rawLevel = xmlAttribute(xmlChild(numPr, "w:ilvl") ?? numPr, "w:val")
  const level = rawLevel === undefined ? 0 : Number(rawLevel)
  const instance = numbering?.nums.get(id)

  const definition =
    instance === undefined
      ? undefined
      : numbering?.abstracts.get(instance.abstractId)?.get(level)

  if (
    !Number.isInteger(id) ||
    id < 1 ||
    !Number.isInteger(level) ||
    level < 0 ||
    level > 8 ||
    !instance ||
    !definition
  )
    fail("DOCX paragraph uses missing numbering data.")

  const tag =
    definition.format === "bullet"
      ? "ul"
      : definition.format === "decimal"
        ? "ol"
        : null

  const markerValid =
    tag === "ul"
      ? !/%\d/.test(definition.text)
      : tag === "ol" && definition.text === `%${level + 1}.`

  if (!tag || !markerValid) fail("Unsupported DOCX numbering format.")

  return {
    id,
    level,
    tag,
    start: instance.starts.get(level) ?? definition.start,
  }
}

function addHtmlStyle(
  styles: Map<string, string>,
  property: string,
  value: string,
) {
  styles.set(property, value)
}

function styleString(styles: Map<string, string>) {
  const source = [...styles]
    .map(([property, value]) => `${property}: ${value}`)
    .join("; ")

  return source ? safeDocumentStyle(source) : ""
}

function boolValue(node: XmlNode) {
  const value = xmlAttribute(node, "w:val")?.toLowerCase()

  return (
    value !== "0" && value !== "false" && value !== "off" && value !== "none"
  )
}

function wordColor(value: string | undefined) {
  if (!value || value.toLowerCase() === "auto") return undefined

  if (!/^[\da-f]{6}$/i.test(value)) fail("Unsupported DOCX color value.")

  return `#${value.toLowerCase()}`
}

const highlightColors = new Map([
  ["black", "#000000"],
  ["blue", "#0000ff"],
  ["cyan", "#00ffff"],
  ["darkblue", "#000080"],
  ["darkcyan", "#008080"],
  ["darkgray", "#808080"],
  ["darkgreen", "#008000"],
  ["darkmagenta", "#800080"],
  ["darkred", "#800000"],
  ["darkyellow", "#808000"],
  ["green", "#00ff00"],
  ["lightgray", "#c0c0c0"],
  ["magenta", "#ff00ff"],
  ["red", "#ff0000"],
  ["white", "#ffffff"],
  ["yellow", "#ffff00"],
])

function fontFamily(node: XmlNode) {
  const names = ["w:ascii", "w:hAnsi", "w:eastAsia", "w:cs"]
  assertXmlAttributes(node, names)

  const candidates = names.flatMap((name) => {
    const value = xmlAttribute(node, name)

    return value === undefined ? [] : [value]
  })

  if (!candidates.length) return undefined

  const families = candidates.map((candidate) => {
    const normalized = candidate.toLowerCase()

    if (["arial", "helvetica", "georgia", "inter"].includes(normalized))
      return candidate

    if (
      ["courier new", "courier", "consolas", "monospace"].includes(normalized)
    )
      return "monospace"

    if (normalized === "ibm plex mono") return "IBM Plex Mono"

    if (["times new roman", "cambria", "serif"].includes(normalized))
      return "serif"

    if (normalized === "sans-serif") return "sans-serif"

    return fail("Unsupported DOCX font family.")
  })

  const family = families[0]

  if (!family || families.some((value) => value !== family))
    fail("DOCX run uses conflicting font families.")

  return family
}

function readTextStyle(node: XmlNode | undefined): TextStyle {
  const style: TextStyle = {
    bold: false,
    italic: false,
    underline: false,
    strike: false,
    code: false,
    subscript: false,
    superscript: false,
    highlight: false,
    css: new Map(),
  }

  if (!node) return style

  for (const property of elementChildren(node)) {
    switch (property.name) {
      case "w:b":
        style.bold = boolValue(property)
        break
      case "w:i":
        style.italic = boolValue(property)
        break
      case "w:u":
        style.underline = xmlAttribute(property, "w:val") !== "none"
        break
      case "w:strike":
      case "w:dstrike":
        style.strike = boolValue(property)
        break
      case "w:color": {
        const value = wordColor(xmlAttribute(property, "w:val"))

        if (value) addHtmlStyle(style.css, "color", value)
        break
      }

      case "w:highlight": {
        const value = xmlAttribute(property, "w:val")?.toLowerCase()

        if (value && value !== "none") {
          const color = highlightColors.get(value)

          if (!color) fail("Unsupported DOCX highlight color.")
          addHtmlStyle(style.css, "background-color", color)
          style.highlight = true
        }

        break
      }

      case "w:shd": {
        const value = wordColor(xmlAttribute(property, "w:fill"))

        if (value) addHtmlStyle(style.css, "background-color", value)
        break
      }

      case "w:sz":
      case "w:szCs": {
        const raw = xmlAttribute(property, "w:val")
        const size = raw === undefined ? Number.NaN : Number(raw)

        if (!Number.isInteger(size) || size < 2 || size > 320)
          fail("Unsupported DOCX font size.")
        addHtmlStyle(style.css, "font-size", `${size / 2}pt`)
        break
      }

      case "w:rFonts": {
        const family = fontFamily(property)

        if (family) addHtmlStyle(style.css, "font-family", family)
        break
      }

      case "w:vertAlign": {
        const value = xmlAttribute(property, "w:val")
        style.subscript = value === "subscript"
        style.superscript = value === "superscript"

        if (!style.subscript && !style.superscript)
          fail("Unsupported DOCX vertical text alignment.")
        break
      }

      case "w:rStyle": {
        const value = xmlAttribute(property, "w:val")

        if (value === "Strong") style.bold = true
        else if (value === "Emphasis" || value === "SubtleEmphasis")
          style.italic = true
        else if (value === "IntenseEmphasis") {
          style.bold = true
          style.italic = true
        } else if (value === "Code" || value === "SourceCode") {
          style.code = true
          addHtmlStyle(style.css, "font-family", "monospace")
        } else if (value !== "Hyperlink" && value !== "DefaultParagraphFont")
          fail("Unsupported DOCX character style.")
        break
      }

      case "w:lang":
      case "w:noProof":
      case "w:proofErr":
      case "w:rtl":
      case "w:cs":
      case "w:spacing":
      case "w:kern":
      case "w:position":
      case "w:fitText":
      case "w:snapToGrid":
        break
      default:
        fail(`Unsupported DOCX run property: ${property.name}.`)
    }
  }

  return style
}

function wrapTextStyle(content: string, style: TextStyle, preserve = false) {
  let output = content

  if (style.code) output = `<code>${output}</code>`

  if (style.highlight) output = `<mark>${output}</mark>`

  if (style.superscript) output = `<sup>${output}</sup>`

  if (style.subscript) output = `<sub>${output}</sub>`

  if (style.strike) output = `<del>${output}</del>`

  if (style.underline) output = `<u>${output}</u>`

  if (style.italic) output = `<em>${output}</em>`

  if (style.bold) output = `<strong>${output}</strong>`
  const styles = new Map(style.css)

  if (preserve) styles.set("white-space", "pre-wrap")
  const css = styleString(styles)

  if (css) output = `<span style="${encodeHtml(css)}">${output}</span>`

  return output
}

function parseRun(run: XmlNode): string {
  const allowed = new Set([
    "w:rPr",
    "w:t",
    "w:tab",
    "w:br",
    "w:noBreakHyphen",
    "w:softHyphen",
  ])

  const children = elementChildren(run)

  for (const child of children)
    if (!allowed.has(child.name))
      fail(`Unsupported DOCX run content: ${child.name}.`)

  const style = readTextStyle(xmlChild(run, "w:rPr"))
  let output = ""

  for (const child of children) {
    if (child.name === "w:rPr") continue

    if (child.name === "w:t") {
      const value = xmlText(child)

      const preserve =
        xmlAttribute(child, "xml:space") === "preserve" ||
        /^\s|\s$|\s{2,}/.test(value)

      output += wrapTextStyle(encodeHtml(value), style, preserve)
    } else if (child.name === "w:tab")
      output += wrapTextStyle("&#9;", style, true)
    else if (child.name === "w:br") {
      const kind = xmlAttribute(child, "w:type")

      if (kind && kind !== "textWrapping")
        fail("Page and column breaks are unsupported in DOCX input.")
      output += "<br>"
    } else if (child.name === "w:noBreakHyphen")
      output += wrapTextStyle("&#8209;", style)
    else output += wrapTextStyle("&shy;", style)
  }

  return output
}

function parseInline(
  parent: XmlNode,
  relationships: ReadonlyMap<string, Relation>,
): string {
  let output = ""

  for (const child of elementChildren(parent)) {
    if (child.name === "w:pPr" || child.name === "w:proofErr") continue

    if (child.name === "w:r") output += parseRun(child)
    else if (child.name === "w:hyperlink") {
      const id = xmlAttribute(child, "r:id")
      const relation = id ? relationships.get(id) : undefined
      const title = xmlAttribute(child, "w:tooltip")
      const target = xmlAttribute(child, "w:tgtFrame")
      const history = xmlAttribute(child, "w:history")
      assertXmlAttributes(child, [
        "r:id",
        "w:history",
        "w:tooltip",
        "w:tgtFrame",
      ])

      if (relation?.kind !== "hyperlink" || !relation.external)
        fail("Unsupported internal or unresolved DOCX hyperlink.")

      if (
        (title !== undefined && hasASCIIControlCharacter(title)) ||
        (target !== undefined &&
          (!["_blank", "_self"].includes(target) ||
            hasASCIIControlCharacter(target))) ||
        (history !== undefined && !["1", "true"].includes(history))
      )
        fail("Unsupported DOCX hyperlink metadata.")

      const attributes = [
        `href="${encodeHtml(relation.target)}"`,
        title ? `title="${encodeHtml(title)}"` : "",
        target ? `target="${encodeHtml(target)}"` : "",
      ]
        .filter(Boolean)
        .join(" ")

      output += `<a ${attributes}>${parseInline(child, relationships)}</a>`
    } else fail(`Unsupported DOCX inline content: ${child.name}.`)
  }

  return output
}

function headingTag(
  styleId: string | undefined,
  styles: ReadonlyMap<string, { type: string; outline: number | null }>,
) {
  if (!styleId) return "p"
  const style = styles.get(styleId)

  if (style && style.type !== "paragraph")
    fail(`Unsupported DOCX paragraph style: ${styleId}.`)

  if (styleId === "Normal" || styleId === "BodyText") {
    if (style?.outline !== null && style?.outline !== undefined)
      fail(`Unsupported DOCX paragraph style: ${styleId}.`)

    return "p"
  }

  if (styleId === "Quote" || styleId === "Code") {
    if (style?.outline !== null && style?.outline !== undefined)
      fail(`Unsupported DOCX paragraph style: ${styleId}.`)

    return styleId === "Quote" ? "blockquote" : "pre"
  }

  const named = /^Heading([1-6])$/i.exec(styleId)

  if (named) {
    if (
      style?.outline !== null &&
      style?.outline !== undefined &&
      style.outline !== Number(named[1]) - 1
    )
      fail(`Unsupported DOCX paragraph style: ${styleId}.`)

    return `h${named[1]}`
  }

  if (!style) fail("DOCX paragraph uses an unknown style.")

  if (style.outline !== null && style.outline < 6)
    return `h${style.outline + 1}`

  return fail(`Unsupported DOCX paragraph style: ${styleId}.`)
}

function cssTwips(value: string | undefined) {
  if (value === undefined) return undefined
  const twips = Number(value)

  if (!Number.isSafeInteger(twips) || twips < 0 || twips > 30_720)
    fail("Unsupported DOCX paragraph indentation.")

  return `${Number((twips / 240).toFixed(2))}em`
}

function paragraphStyle(
  properties: XmlNode | undefined,
  list: ParagraphList | undefined,
) {
  const styles = new Map<string, string>()
  let alignment: string | undefined
  let direction: string | undefined

  if (!properties) return { css: "", direction }

  for (const property of elementChildren(properties)) {
    switch (property.name) {
      case "w:pStyle":
      case "w:numPr":
      case "w:rPr":
      case "w:spacing":
      case "w:keepNext":
      case "w:keepLines":
      case "w:pageBreakBefore":
      case "w:widowControl":
      case "w:contextualSpacing":
      case "w:adjustRightInd":
      case "w:snapToGrid":
      case "w:tabs":
      case "w:outlineLvl":
      case "w:suppressLineNumbers":
        if (property.name === "w:pageBreakBefore" && boolValue(property))
          fail("DOCX page breaks are unsupported.")

        if (property.name === "w:spacing") {
          const line = xmlAttribute(property, "w:line")
          const lineRule = xmlAttribute(property, "w:lineRule")

          if (lineRule && lineRule !== "auto")
            fail("Unsupported DOCX paragraph line spacing.")

          if (line !== undefined) {
            const value = Number(line) / 240

            if (!Number.isFinite(value) || value < 1 || value > 4)
              fail("Unsupported DOCX paragraph line spacing.")
            styles.set("line-height", String(Number(value.toFixed(2))))
          }
        }

        break
      case "w:jc": {
        const value = xmlAttribute(property, "w:val")

        if (
          !value ||
          !["left", "right", "center", "both", "start", "end"].includes(value)
        )
          fail("Unsupported DOCX paragraph alignment.")
        alignment = value === "both" ? "justify" : value
        break
      }

      case "w:ind":
        if (!list) {
          const left =
            xmlAttribute(property, "w:start") ??
            xmlAttribute(property, "w:left")

          const right =
            xmlAttribute(property, "w:end") ?? xmlAttribute(property, "w:right")

          const hanging = xmlAttribute(property, "w:hanging")
          const firstLine = xmlAttribute(property, "w:firstLine")

          if (
            hanging !== undefined ||
            (right !== undefined && Number(right) !== 0) ||
            property.attributes.has("w:firstLineChars") ||
            property.attributes.has("w:hangingChars")
          )
            fail("Unsupported DOCX paragraph indentation.")
          const inlineStart = cssTwips(left)
          const indent = cssTwips(firstLine)

          if (inlineStart && inlineStart !== "0em")
            styles.set("padding-inline-start", inlineStart)

          if (indent && indent !== "0em") styles.set("text-indent", indent)
        }

        break
      case "w:bidi":
        if (boolValue(property)) direction = "rtl"
        break
      default:
        fail(`Unsupported DOCX paragraph property: ${property.name}.`)
    }
  }

  if (alignment) styles.set("text-align", alignment)

  return { css: styleString(styles), direction }
}

function parseParagraph(
  paragraph: XmlNode,
  relationships: ReadonlyMap<string, Relation>,
  styles: ReadonlyMap<string, { type: string; outline: number | null }>,
  numbering: NumberingIndex | undefined,
) {
  const properties = xmlChild(paragraph, "w:pPr")

  const styleId = xmlAttribute(
    xmlChild(properties ?? paragraph, "w:pStyle") ?? paragraph,
    "w:val",
  )

  const tag = headingTag(styleId, styles)
  const list = resolveList(properties, numbering)
  const presentation = paragraphStyle(properties, list)
  const content = parseInline(paragraph, relationships)

  const attrs = [
    presentation.css ? ` style="${encodeHtml(presentation.css)}"` : "",
    presentation.direction ? ` dir="${presentation.direction}"` : "",
  ].join("")

  const html =
    tag === "blockquote"
      ? `<blockquote><p${attrs}>${content}</p></blockquote>`
      : tag === "pre"
        ? `<pre${attrs}><code>${content}</code></pre>`
        : `<${tag}${attrs}>${content}</${tag}>`

  return { html, list }
}

function paragraphToHtml(
  paragraph: XmlNode,
  relationships: ReadonlyMap<string, Relation>,
  styles: ReadonlyMap<string, { type: string; outline: number | null }>,
  numbering: NumberingIndex | undefined,
) {
  return parseParagraph(paragraph, relationships, styles, numbering)
}

function tableBorder(properties: XmlNode | undefined) {
  if (!properties) return undefined

  const sides = new Map<string, string | null>([
    ["top", null],
    ["bottom", null],
    ["start", null],
    ["end", null],
  ])

  const seen = new Set<string>()

  for (const edge of elementChildren(properties)) {
    const side = edge.name.slice(2)

    if (!sides.has(side) || seen.has(side))
      fail("Unsupported DOCX table border edge.")
    seen.add(side)
    assertXmlAttributes(edge, ["w:val", "w:sz", "w:color"])

    if (elementChildren(edge).length) fail("Invalid DOCX table border edge.")
    const value = xmlAttribute(edge, "w:val")

    if (value === "nil" || value === "none") {
      if (
        xmlAttribute(edge, "w:sz") !== undefined ||
        xmlAttribute(edge, "w:color") !== undefined
      )
        fail("Unsupported DOCX table border style.")
      sides.set(side, "hidden")
    } else if (value === "single") {
      const size = xmlAttribute(edge, "w:sz")
      const color = xmlAttribute(edge, "w:color")

      if (
        (size && size !== "4") ||
        (color && !["000000", "auto"].includes(color))
      )
        fail("Unsupported DOCX table border style.")
      sides.set(side, "solid")
    } else fail("Unsupported DOCX table border style.")
  }

  const values = [...sides.values()]
  const common = values[0] ?? null

  const source =
    common !== null && values.every((value) => value === common)
      ? common
      : JSON.stringify(Object.fromEntries(sides))

  try {
    parseTableBorderHTML(source)
  } catch {
    fail("Invalid DOCX table border metadata.")
  }

  return source
}

function parseTableCell(
  cell: XmlNode,
  header: boolean,
  relationships: ReadonlyMap<string, Relation>,
  styles: ReadonlyMap<string, { type: string; outline: number | null }>,
  numbering: NumberingIndex | undefined,
) {
  const properties = xmlChild(cell, "w:tcPr")
  assertXmlAttributes(cell, [])

  if (properties) assertXmlAttributes(properties, [])

  if (properties) {
    const supportedProperties = [
      "w:gridSpan",
      "w:vMerge",
      "w:shd",
      "w:vAlign",
      "w:tcW",
      "w:tcBorders",
    ]

    const children = elementChildren(properties)

    if (
      children.some((property) => !supportedProperties.includes(property.name))
    )
      fail("Unsupported DOCX table cell property.")

    for (const property of children) {
      if (property.name === "w:tcBorders") {
        assertXmlAttributes(property, [])
        continue
      }

      if (property.name === "w:shd" || property.name === "w:tcW") continue
      assertXmlAttributes(property, ["w:val"])

      if (elementChildren(property).length)
        fail("Invalid DOCX table cell property.")
    }
  }

  const spanElement = xmlChild(properties ?? cell, "w:gridSpan")
  const span = spanElement ? numericAttribute(spanElement, "w:val") : 1
  const mergeElement = xmlChild(properties ?? cell, "w:vMerge")

  const mergeValue = mergeElement
    ? (xmlAttribute(mergeElement, "w:val") ?? "continue")
    : undefined

  const shade = xmlChild(properties ?? cell, "w:shd")

  if (shade) {
    assertXmlAttributes(shade, ["w:val", "w:color", "w:fill"])

    if (
      elementChildren(shade).length ||
      ![undefined, "clear"].includes(xmlAttribute(shade, "w:val")) ||
      ![undefined, "auto"].includes(xmlAttribute(shade, "w:color"))
    )
      fail("Unsupported DOCX table cell shading.")
  }

  const fill = shade ? wordColor(xmlAttribute(shade, "w:fill")) : undefined

  const vertical = xmlAttribute(
    xmlChild(properties ?? cell, "w:vAlign") ?? cell,
    "w:val",
  )

  const widthElement = xmlChild(properties ?? cell, "w:tcW")
  const rawWidth = xmlAttribute(widthElement ?? cell, "w:w")

  const widthType = widthElement
    ? xmlAttribute(widthElement, "w:type")
    : undefined

  const width = rawWidth === undefined ? undefined : Number(rawWidth)

  if (widthElement) {
    assertXmlAttributes(widthElement, ["w:w", "w:type"])

    if (
      elementChildren(widthElement).length ||
      width === undefined ||
      widthType === undefined
    )
      fail("Invalid DOCX table cell width.")
  }

  const cellStyles = new Map<string, string>()
  const border = tableBorder(xmlChild(properties ?? cell, "w:tcBorders"))
  const children = elementChildren(cell)

  if (!Number.isInteger(span) || span < 1 || span > 50)
    fail("Invalid DOCX table column span.")

  if (mergeValue !== undefined && !["restart", "continue"].includes(mergeValue))
    fail("Invalid DOCX table row merge.")

  if (fill) cellStyles.set("background-color", fill)

  if (vertical && ["top", "center", "bottom"].includes(vertical))
    cellStyles.set(
      "vertical-align",
      vertical === "center" ? "middle" : vertical,
    )
  else if (vertical) fail("Unsupported DOCX table cell alignment.")

  if (widthType === "auto" && width !== 0)
    fail("Unsupported DOCX table cell width.")

  if (widthType === "dxa") {
    if (
      width === undefined ||
      !Number.isSafeInteger(width) ||
      width < 720 ||
      width > 9_600 ||
      width % 15 !== 0
    )
      fail("Unsupported DOCX table cell width.")

    cellStyles.set("width", `${width / 15}px`)
  } else if (widthType && widthType !== "auto")
    fail("Unsupported DOCX table cell width unit.")

  if (
    children.some((child) => !["w:tcPr", "w:p", "w:tbl"].includes(child.name))
  )
    fail("Unsupported DOCX table cell content.")

  const content = children
    .filter((child) => child.name === "w:p" || child.name === "w:tbl")
    .map((child) => {
      if (child.name === "w:tbl")
        return parseTable(child, relationships, styles, numbering)

      const paragraph = paragraphToHtml(child, relationships, styles, numbering)

      if (paragraph.list) fail("Lists inside DOCX table cells are unsupported.")

      return paragraph.html
    })
    .join("")

  return {
    span,
    merge: mergeValue === "restart",
    continuation: mergeValue === "continue",
    tag: header ? ("th" as const) : ("td" as const),
    style: styleString(cellStyles),
    border,
    content: content || "<p></p>",
  }
}

function parseTable(
  table: XmlNode,
  relationships: ReadonlyMap<string, Relation>,
  styles: ReadonlyMap<string, { type: string; outline: number | null }>,
  numbering: NumberingIndex | undefined,
) {
  const tableProperties = xmlChild(table, "w:tblPr")
  const tableGrid = xmlChild(table, "w:tblGrid")
  assertXmlAttributes(table, [])

  if (tableGrid) assertXmlAttributes(tableGrid, [])
  const tableChildren = elementChildren(table)

  if (
    tableChildren.some(
      (child) => !["w:tblPr", "w:tblGrid", "w:tr"].includes(child.name),
    )
  )
    fail("Unsupported DOCX table content.")
  const rows = xmlChildren(table, "w:tr")

  if (!rows.length || rows.length > 50) fail("Invalid DOCX table row count.")

  const rowData: {
    cells: TableCell[]
    header: boolean
    height: number | undefined
  }[] = []

  const active = new Map<number, { span: number; cell: TableCell }>()
  let bodyStarted = false
  let columnCount = 0

  for (const row of rows) {
    assertXmlAttributes(row, [])
    const rowChildren = elementChildren(row)

    if (rowChildren.some((child) => !["w:trPr", "w:tc"].includes(child.name)))
      fail("Unsupported DOCX table row content.")
    const trProperties = xmlChild(row, "w:trPr")

    if (trProperties) assertXmlAttributes(trProperties, [])

    if (
      trProperties &&
      elementChildren(trProperties).some(
        (property) =>
          property.name !== "w:tblHeader" && property.name !== "w:trHeight",
      )
    )
      fail("Unsupported DOCX table row property.")
    const headerElement = xmlChild(trProperties ?? row, "w:tblHeader")

    if (headerElement) {
      assertXmlAttributes(headerElement, ["w:val"])

      if (elementChildren(headerElement).length)
        fail("Invalid DOCX table header row.")
    }

    const header = headerElement !== undefined && boolValue(headerElement)
    const rowHeightElement = xmlChild(trProperties ?? row, "w:trHeight")

    if (rowHeightElement) {
      assertXmlAttributes(rowHeightElement, ["w:val", "w:hRule"])

      if (elementChildren(rowHeightElement).length)
        fail("Invalid DOCX table row height.")
    }

    const rowHeightValue = rowHeightElement
      ? xmlAttribute(rowHeightElement, "w:val")
      : undefined

    const rowHeight =
      rowHeightValue === undefined ? undefined : Number(rowHeightValue)

    const rowHeightRule = rowHeightElement
      ? xmlAttribute(rowHeightElement, "w:hRule")
      : undefined

    if (
      rowHeightElement &&
      (rowHeight === undefined ||
        !Number.isSafeInteger(rowHeight) ||
        rowHeight < 0 ||
        rowHeight > 150_000 ||
        (rowHeightRule && rowHeightRule !== "atLeast"))
    )
      fail("Invalid DOCX table row height.")

    if (header && bodyStarted) fail("DOCX table header rows must be first.")

    if (!header) bodyStarted = true
    const rawCells = xmlChildren(row, "w:tc")

    if (!rawCells.length || rawCells.length > 50)
      fail("Invalid DOCX table column count.")
    const placed: TableCell[] = []
    const next = new Map<number, { span: number; cell: TableCell }>()
    let column = 0

    for (const rawCell of rawCells) {
      const parsed = parseTableCell(
        rawCell,
        header,
        relationships,
        styles,
        numbering,
      )

      if (parsed.continuation) {
        const value = active.get(column)

        if (
          !value ||
          value.span !== parsed.span ||
          parsed.content !== "<p></p>" ||
          parsed.style !== value.cell.style ||
          parsed.border !== value.cell.border
        )
          fail("DOCX table merge has no empty origin cell.")
        value.cell.rowSpan++

        if (value.cell.rowSpan > 50)
          fail("DOCX table merge exceeds its row limit.")
        next.set(column, value)
        column += value.span

        if (column > 50) fail("DOCX table exceeds its column limit.")
        continue
      }

      const cell: TableCell = {
        start: column,
        span: parsed.span,
        rowSpan: 1,
        tag: parsed.tag,
        style: parsed.style,
        border: parsed.border,
        content: parsed.content,
      }

      placed.push(cell)

      if (parsed.merge) next.set(column, { span: parsed.span, cell })
      column += parsed.span

      if (column > 50) fail("DOCX table exceeds its column limit.")
    }

    columnCount = Math.max(columnCount, column)
    rowData.push({ cells: placed, header, height: rowHeight })
    active.clear()

    for (const [start, value] of next) active.set(start, value)
  }

  const gridColumns = tableGrid ? elementChildren(tableGrid) : []

  if (
    tableGrid &&
    (gridColumns.length !== columnCount ||
      gridColumns.some((column) => column.name !== "w:gridCol"))
  )
    fail("DOCX table grid does not match table geometry.")

  const widths: number[] = []
  let hasGridWidths = false
  let hasMissingGridWidth = false

  for (const column of gridColumns) {
    assertXmlAttributes(column, ["w:w"])

    if (elementChildren(column).length) fail("Invalid DOCX table grid column.")
    const rawWidth = xmlAttribute(column, "w:w")

    if (rawWidth === undefined) {
      hasMissingGridWidth = true
      continue
    }

    const width = Number(rawWidth)

    if (
      !Number.isSafeInteger(width) ||
      width < 720 ||
      width > 9_600 ||
      width % 15 !== 0
    )
      fail("Unsupported DOCX table grid width.")

    widths.push(width / 15)
    hasGridWidths = true
  }

  if (hasGridWidths && hasMissingGridWidth)
    fail("DOCX table grid has incomplete column widths.")

  const tableAlignmentElement = tableProperties
    ? xmlChild(tableProperties, "w:jc")
    : undefined

  const tableAlignment = tableAlignmentElement
    ? xmlAttribute(tableAlignmentElement, "w:val")
    : undefined

  const tableWidthElement = tableProperties
    ? xmlChild(tableProperties, "w:tblW")
    : undefined

  const tableLayoutElement = tableProperties
    ? xmlChild(tableProperties, "w:tblLayout")
    : undefined

  if (tableProperties) {
    assertXmlAttributes(tableProperties, [])

    if (
      elementChildren(tableProperties).some(
        (property) =>
          !["w:tblW", "w:jc", "w:tblLayout"].includes(property.name),
      )
    )
      fail("Unsupported DOCX table property.")
  }

  if (tableAlignmentElement) {
    assertXmlAttributes(tableAlignmentElement, ["w:val"])

    if (
      elementChildren(tableAlignmentElement).length ||
      !["left", "center", "right"].includes(tableAlignment ?? "")
    )
      fail("Unsupported DOCX table alignment.")
  }

  if (tableWidthElement) {
    assertXmlAttributes(tableWidthElement, ["w:w", "w:type"])

    if (elementChildren(tableWidthElement).length)
      fail("Invalid DOCX table width.")
    const rawWidth = xmlAttribute(tableWidthElement, "w:w")
    const widthType = xmlAttribute(tableWidthElement, "w:type")
    const tableWidth = rawWidth === undefined ? Number.NaN : Number(rawWidth)
    const gridWidth = widths.reduce((sum, width) => sum + width * 15, 0)

    if (
      !Number.isSafeInteger(tableWidth) ||
      (hasGridWidths
        ? widthType !== "dxa" || tableWidth !== gridWidth
        : widthType !== "auto" || tableWidth !== 0)
    )
      fail("Unsupported DOCX table width.")
  } else if (hasGridWidths) fail("DOCX table width is missing.")

  if (tableLayoutElement) {
    assertXmlAttributes(tableLayoutElement, ["w:type"])

    if (
      elementChildren(tableLayoutElement).length ||
      (hasGridWidths
        ? xmlAttribute(tableLayoutElement, "w:type") !== "fixed"
        : xmlAttribute(tableLayoutElement, "w:type") !== "autofit")
    )
      fail("Unsupported DOCX table layout.")
  } else if (hasGridWidths) fail("DOCX table layout is missing.")

  const headerRows = rowData.filter((row) => row.header).length

  const header = headerRows
    ? `<thead>${rowData
        .slice(0, headerRows)
        .map(
          (row) =>
            `<tr${row.height === undefined ? "" : ` data-editor-row-height="${row.height / 15}"`}>${row.cells.map(renderTableCell).join("")}</tr>`,
        )
        .join("")}</thead>`
    : ""

  const bodyRows = rowData
    .slice(headerRows)
    .map(
      (row) =>
        `<tr${row.height === undefined ? "" : ` data-editor-row-height="${row.height / 15}"`}>${row.cells.map(renderTableCell).join("")}</tr>`,
    )
    .join("")

  const attributes = tableAlignment ? ` align="${tableAlignment}"` : ""

  const columnGroup = widths.length
    ? `<colgroup>${widths.map((width) => `<col style="width: ${width}px"/>`).join("")}</colgroup>`
    : ""

  return `<table${attributes}>${columnGroup}${header}<tbody>${bodyRows}</tbody></table>`
}

function renderTableCell(cell: TableCell) {
  const attributes = [
    cell.span > 1 ? ` colspan="${cell.span}"` : "",
    cell.rowSpan > 1 ? ` rowspan="${cell.rowSpan}"` : "",
    cell.style ? ` style="${encodeHtml(cell.style)}"` : "",
    cell.border ? ` data-editor-border="${encodeHtml(cell.border)}"` : "",
  ].join("")

  return `<${cell.tag}${attributes}>${cell.content}</${cell.tag}>`
}

function renderBlocks(blocks: readonly HtmlBlock[]): string {
  return blocks
    .map((block) => {
      if (block.kind === "html") return block.html

      const start =
        block.tag === "ol" && block.start !== 1 ? ` start="${block.start}"` : ""

      const items = block.items
        .map((item) => `<li>${renderBlocks(item.blocks)}</li>`)
        .join("")

      return `<${block.tag}${start}>${items}</${block.tag}>`
    })
    .join("")
}

function appendBlock(
  root: HtmlBlock[],
  stack: ListStackEntry[],
  block: { html: string; list?: ParagraphList },
) {
  if (!block.list) {
    stack.length = 0
    root.push({ kind: "html", html: block.html })

    return
  }

  const { id, level, tag, start } = block.list

  if (level > stack.length) fail("DOCX list level has no parent item.")

  while (stack.length > level + 1) stack.pop()
  const current = stack[level]

  if (current?.id === id && current.tag === tag) {
    const item: ListStackEntry["item"] = {
      blocks: [{ kind: "html", html: block.html }],
    }

    current.list.items.push(item)
    stack[level] = { ...current, item }

    return
  }

  if (current) stack.length = level
  const parent = level > 0 ? stack[level - 1] : undefined

  if (level > 0 && !parent) fail("DOCX nested list is missing its parent.")

  const list: Extract<HtmlBlock, { kind: "list" }> = {
    kind: "list",
    tag,
    start,
    items: [],
  }

  const container = parent ? parent.item.blocks : root
  container.push(list)

  const item: ListStackEntry["item"] = {
    blocks: [{ kind: "html", html: block.html }],
  }

  list.items.push(item)
  stack[level] = { id, tag, list, item }
}

function validateSection(section: XmlNode) {
  xmlChild(section, "w:pgSz")
  xmlChild(section, "w:pgMar")

  const attributes = new Map([
    ["w:pgSz", new Set(["w:w", "w:h", "w:orient", "w:code"])],
    [
      "w:pgMar",
      new Set([
        "w:top",
        "w:right",
        "w:bottom",
        "w:left",
        "w:header",
        "w:footer",
        "w:gutter",
      ]),
    ],
    ["w:cols", new Set(["w:num", "w:space", "w:sep", "w:equalWidth"])],
    ["w:docGrid", new Set(["w:type", "w:linePitch", "w:charSpace"])],
  ])

  for (const property of elementChildren(section)) {
    const allowedAttributes = attributes.get(property.name)

    if (!allowedAttributes)
      fail("DOCX section references unsupported content or settings.")

    if (elementChildren(property).length)
      fail("Invalid DOCX page layout property.")

    if (
      property.name === "w:pgSz" &&
      (!property.attributes.has("w:w") || !property.attributes.has("w:h"))
    )
      fail("Invalid DOCX page size.")

    for (const [name, value] of property.attributes) {
      if (!allowedAttributes.has(name))
        fail("Unsupported DOCX page layout attribute.")

      if (name === "w:orient") {
        if (value !== "portrait" && value !== "landscape")
          fail("Invalid DOCX page orientation.")
      } else if (property.name === "w:docGrid" && name === "w:type") {
        if (
          !["default", "lines", "linesAndChars", "snapToChars"].includes(value)
        )
          fail("Invalid DOCX document grid type.")
      } else {
        const number = Number(value)
        const maximum = name === "w:code" ? 65_535 : 31_680

        if (
          !Number.isSafeInteger(number) ||
          number < 0 ||
          number > maximum ||
          (property.name === "w:pgSz" && name !== "w:code" && number === 0) ||
          (name === "w:code" && number < 1) ||
          (property.name === "w:cols" && name === "w:num" && number !== 1)
        )
          fail("Invalid DOCX page layout value.")
      }
    }
  }
}

function wordBodyToHtml(
  root: XmlNode,
  relationships: ReadonlyMap<string, Relation>,
  styles: ReadonlyMap<string, { type: string; outline: number | null }>,
  numbering: NumberingIndex | undefined,
) {
  requireWordRoot(root, "document")
  const body = xmlChild(root, "w:body")

  if (!body) fail("DOCX document body is missing.")
  const blocks: HtmlBlock[] = []
  const stack: ListStackEntry[] = []
  const nodes = elementChildren(body)

  for (const [index, node] of nodes.entries()) {
    if (node.name === "w:p")
      appendBlock(
        blocks,
        stack,
        paragraphToHtml(node, relationships, styles, numbering),
      )
    else if (node.name === "w:tbl")
      appendBlock(blocks, stack, {
        html: parseTable(node, relationships, styles, numbering),
      })
    else if (node.name === "w:sectPr") {
      if (index !== nodes.length - 1)
        fail("DOCX section properties must follow document content.")
      validateSection(node)
    } else fail(`Unsupported DOCX document content: ${node.name}.`)
  }

  return renderBlocks(blocks)
}

function parsePackage(
  files: ReadonlyMap<string, Uint8Array>,
  xmlParts: ReadonlyMap<string, string>,
) {
  contentTypes(files)
  const relationships = readRelationships(files, xmlParts)
  const rootRelationships = relationships.get("_rels/.rels")

  if (!rootRelationships) fail("DOCX package relationships are missing.")

  const mains = [...rootRelationships.values()].filter(
    (relation) => relation.kind === "officeDocument",
  )

  const main = mains[0]

  if (mains.length !== 1 || main?.target !== "word/document.xml")
    fail("DOCX main document relationship is invalid.")

  const documentRelsPath = relationshipPart("word/document.xml")
  const documentRelationships = relationships.get(documentRelsPath) ?? new Map()

  const relationKinds = new Set<string>()

  for (const relation of documentRelationships.values()) {
    if (relation.external) continue

    if (
      ![
        "styles",
        "numbering",
        "settings",
        "webSettings",
        "fontTable",
        "theme",
      ].includes(relation.kind) ||
      (["styles", "numbering"].includes(relation.kind) &&
        relationKinds.has(relation.kind))
    )
      fail(`Unsupported DOCX document relationship: ${relation.kind}.`)
    relationKinds.add(relation.kind)
  }

  const stylesPart = [...documentRelationships.values()].find(
    (relation) => relation.kind === "styles",
  )?.target

  const numberingPart = [...documentRelationships.values()].find(
    (relation) => relation.kind === "numbering",
  )?.target

  const documentXml = xmlParts.get("word/document.xml")

  if (!documentXml) fail("DOCX main document part is missing.")

  return {
    document: parseXml(documentXml),
    styles: parseStyles(stylesPart ? xmlParts.get(stylesPart) : undefined),
    numbering: parseNumbering(
      numberingPart ? xmlParts.get(numberingPart) : undefined,
    ),
    documentRelationships,
  }
}

async function sourceBytes(source: DocxSource, signal?: AbortSignal) {
  const size =
    source instanceof Blob
      ? source.size
      : source instanceof ArrayBuffer
        ? source.byteLength
        : source.byteLength

  if (size > docxLimits.compressedBytes)
    fail("DOCX archive exceeds its compressed size limit.")
  checkSignal(signal)

  const bytes =
    source instanceof Blob
      ? new Uint8Array(await source.arrayBuffer())
      : source instanceof ArrayBuffer
        ? new Uint8Array(source)
        : source.slice()

  checkSignal(signal)

  return bytes
}

export async function parseDocx(
  source: DocxSource,
  options: DocxImportOptions = {},
) {
  try {
    const bytes = await sourceBytes(source, options.signal)
    const files = await readZipArchiveAsync(bytes, options.signal)
    const xmlParts = new Map<string, string>()

    for (const [name, data] of files) {
      if (!name.endsWith(".xml") && !name.endsWith(".rels")) continue
      checkSignal(options.signal)
      const xml = decodeXmlPart(files, name)

      if (xml === undefined) continue
      xmlParts.set(name, xml)
      checkText(xml)

      if (data.byteLength > docxLimits.uncompressedBytes)
        fail("DOCX XML part exceeds its size limit.")
    }

    const packageParts = parsePackage(files, xmlParts)
    checkSignal(options.signal)

    const html = wordBodyToHtml(
      packageParts.document,
      packageParts.documentRelationships,
      packageParts.styles,
      packageParts.numbering,
    )

    checkSignal(options.signal)

    return parseDocument(html, "html")
  } catch (error) {
    if (error instanceof DocumentError) throw error
    throw new DocumentError([
      error instanceof Error ? error.message : "DOCX import failed.",
    ])
  }
}

export async function importDocx(
  editor: LexicalEditor,
  source: DocxSource,
  options: DocxImportOptions = {},
) {
  if (!editor.isEditable()) throw new DocumentError(["Document is readonly."])
  const startingState = editor.getEditorState()
  const document = await parseDocx(source, options)

  checkSignal(options.signal)

  if (!editor.isEditable()) throw new DocumentError(["Document is readonly."])

  if (editor.getEditorState() !== startingState)
    throw new DocumentError(["Document changed during DOCX import."])
  importDocument(editor, JSON.stringify(document), "json")
}
