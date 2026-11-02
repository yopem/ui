import type {
  Element,
  ElementContent,
  Properties,
  Root,
  RootContent,
} from "hast"

import {
  isEditorLineHeight,
  isEditorStyleLength,
} from "@yopem-ui/editor/block-presentation"
import { editorColumnsFromHTMLAttributes } from "@yopem-ui/editor/columns-model"
import { editorDateFromHTMLAttributes } from "@yopem-ui/editor/date-model"
import {
  parseEditorDiagramMetadata,
  validateEditorDiagramSource,
} from "@yopem-ui/editor/diagram/model"
import { editorDrawingFromHTMLAttributes } from "@yopem-ui/editor/drawing/model"
import { editorEditableCardFromHTMLAttributes } from "@yopem-ui/editor/editable-card/model"
import {
  parseEditorFootnoteId,
  validateEditorFootnotesHTML,
} from "@yopem-ui/editor/footnote-model"
import { editorLabelSchema } from "@yopem-ui/editor/labels/model"
import {
  editorListMarkerSchema,
  isEditorListMarkerForType,
  parseEditorListMarkerHTML,
  parseEditorListStartHTML,
} from "@yopem-ui/editor/list-presentation/model"
import {
  editorMathFromHTMLAttributes,
  type EditorMathValue,
} from "@yopem-ui/editor/math-model"
import { renderEditorMath } from "@yopem-ui/editor/math-render"
import { mediaPlaceholderKindSchema } from "@yopem-ui/editor/media-placeholder-model"
import { serializeMediaHtml } from "@yopem-ui/editor/media/html"
import { decodeMention, mentionPlainText } from "@yopem-ui/editor/mention-codec"
import {
  parseTableBorderHTML,
  parseTableRowHeightHTML,
} from "@yopem-ui/editor/table-presentation-schema"
import {
  createEditorTocHeadingId,
  validateEditorTocHTML,
} from "@yopem-ui/editor/toc-model"
import { fromHtml } from "hast-util-from-html"
import { toHtml } from "hast-util-to-html"
import { z } from "zod"

import { documentMediaSchema } from "./media"
import { checkTableGrid, documentStateSchema } from "./state"

export class DocumentError extends Error {
  constructor(readonly diagnostics: readonly string[]) {
    super(diagnostics.join("\n"))
    this.name = "DocumentError"
  }
}

export const documentSlotNameSchema = z
  .string()
  .regex(/^[A-Za-z][A-Za-z0-9_-]{0,63}$/)
  .refine((name) => name !== "constructor" && name !== "prototype")

export const documentLimits = {
  bytes: 1_048_576,
  depth: 64,
  nodes: 65_536,
} as const

export function checkText(source: string) {
  if (!z.string().safeParse(source).success)
    throw new DocumentError(["Document source must be text."])

  if (source.length > documentLimits.bytes)
    throw new DocumentError(["Document exceeds 1 MiB."])
  const bytes = new TextEncoder().encode(source).byteLength

  if (bytes > documentLimits.bytes)
    throw new DocumentError(["Document exceeds 1 MiB."])

  return bytes
}

export function checkTree<T>(value: T) {
  let nodes = 0
  const pending: { value: unknown; depth: number }[] = [{ value, depth: 0 }]

  while (pending.length) {
    const entry = pending.pop()

    if (!entry) break

    if (++nodes > documentLimits.nodes)
      throw new DocumentError(["Document exceeds structure budget."])

    if (entry.depth > documentLimits.depth)
      throw new DocumentError(["Document exceeds depth limit."])

    if (entry.value instanceof Object) {
      if (
        Object.keys(entry.value).some((key) =>
          ["__proto__", "constructor", "prototype"].includes(key),
        )
      )
        throw new DocumentError(["Unsafe document key."])

      for (const child of Object.values(entry.value)) {
        if (child instanceof Object)
          pending.push({ value: child, depth: entry.depth + 1 })
      }
    }
  }

  return value
}

export function safeDocumentURL(value: string) {
  try {
    return ["https:", "http:", "mailto:", "tel:"].includes(
      new URL(value).protocol,
    )
  } catch {
    return false
  }
}

const linkTargets = new Set(["_blank", "_self"])

export function validateDocumentLink(
  target: Properties[string],
  rel: Properties[string],
) {
  if (
    target !== undefined &&
    target !== null &&
    !linkTargets.has(String(target))
  )
    throw new DocumentError(["Invalid link target."])

  const relations = Array.isArray(rel) ? rel.join(" ") : String(rel ?? "")

  if (/(?:^|[\t\n\f\r ])opener(?:$|[\t\n\f\r ])/i.test(relations))
    throw new DocumentError(["Unsafe link relation."])
}

const cssRules = new Map(
  Object.entries({
    color:
      /^(#[\da-f]{3,8}|[a-z]{3,20}|(?:rgb|hsl)a?\([\d.% ,/+-]+\)|(?:oklch|oklab|lch|lab)\([\d.e% ,/+-]+(?:none)?[\d.e% ,/+-]*\)|color\((?:srgb|srgb-linear|display-p3|a98-rgb|prophoto-rgb|rec2020|xyz|xyz-d50|xyz-d65) [\d.e% /+-]+\))$/i,
    "background-color":
      /^(#[\da-f]{3,8}|[a-z]{3,20}|(?:rgb|hsl)a?\([\d.% ,/+-]+\)|(?:oklch|oklab|lch|lab)\([\d.e% ,/+-]+(?:none)?[\d.e% ,/+-]*\)|color\((?:srgb|srgb-linear|display-p3|a98-rgb|prophoto-rgb|rec2020|xyz|xyz-d50|xyz-d65) [\d.e% /+-]+\))$/i,
    "font-size":
      /^(?:[1-9]\d?(?:\.\d+)?)(?:px|pt)$|^(?:[0-3](?:\.\d+)?)(?:rem|em)$/,
    "font-family":
      /^(?:(["']?)(?:Arial|Helvetica|Georgia|Inter|Calibri|Cambria|Cambria Math|Times New Roman|Symbol|IBM Plex Mono)\1(?:\s*,\s*(?:monospace|serif|sans-serif))?|monospace|serif|sans-serif)$/i,
    "font-weight": /^(?:normal|bold|[1-9]00)$/,
    "font-style": /^(?:normal|italic)$/,
    "text-decoration": /^(?:none|underline|line-through)$/,
    "text-transform": /^(?:lowercase|uppercase|capitalize|none)$/,
    "line-height": /^(?:normal|[1-3](?:\.\d{1,2})?)$/,
    "text-indent": /^(?:0|(?:[0-9]|[1-9]\d|1\d\d)(?:\.\d{1,2})?px)$/,
    "padding-inline-start": /^(?:[0-9]|[1-9]\d|1[01]\d|12[0-8])em$/,
    "text-align": /^(?:left|right|center|justify|start|end)$/,
    width: /^(?:[1-9]\d{0,3}|10000)px$/,
    height: /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?px$/i,
    border: /^1px solid (?:black|rgb\(0, 0, 0\)|currentColor)$/i,
    "vertical-align": /^(?:top|middle|bottom)$/,
    "white-space": /^pre-wrap$/,
    "table-layout": /^fixed$/,
    "inline-size": /^\d+(?:\.\d+)?px$/,
    "min-inline-size": /^(?:0|0px)$/,
    "overflow-wrap": /^anywhere$/,
  }),
)

export function safeDocumentStyle(source: string) {
  if (!source.trim()) return ""
  const output = new Map<string, string>()

  for (const declaration of source.split(";")) {
    if (!declaration.trim()) continue
    const separator = declaration.indexOf(":")
    const property = declaration.slice(0, separator).trim().toLowerCase()
    const value = declaration.slice(separator + 1).trim()

    if (property === "text-align" && value === "") continue

    const valid =
      property === "font-size"
        ? (isEditorStyleLength(value, 160) && Number.parseFloat(value) > 0) ||
          cssRules.get(property)?.test(value)
        : ["color", "background-color"].includes(property) &&
            /^var\(--[a-zA-Z_][a-zA-Z0-9_-]{0,100}\)$/.test(value)
          ? true
          : property === "line-height"
            ? isEditorLineHeight(value)
            : property === "text-indent"
              ? isEditorStyleLength(value, 160)
              : property === "list-style-type"
                ? editorListMarkerSchema.safeParse(value).success
                : /^border-(?:(?:top|bottom|left|right|inline-start|inline-end|block-start|block-end)-)?(?:style|width|color)$/.test(
                      property,
                    )
                  ? property.endsWith("style")
                    ? /^(?:solid|hidden)$/.test(value)
                    : property.endsWith("width")
                      ? value === "1px"
                      : /^(?:black|rgb\(0, 0, 0\)|currentcolor)$/i.test(value)
                  : property === "height"
                    ? cssRules.get(property)?.test(value) &&
                      Number.isFinite(Number(value.slice(0, -2)))
                    : cssRules.get(property)?.test(value)

    if (separator < 1 || !valid)
      throw new DocumentError([`Unsupported or unsafe CSS: ${property}.`])
    output.set(property, value)
  }

  return [...output]
    .map(([property, value]) => `${property}: ${value}`)
    .join("; ")
}

const tags = new Set([
  "aside",
  "section",
  "details",
  "summary",
  "div",
  "p",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "blockquote",
  "pre",
  "code",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "del",
  "sub",
  "sup",
  "mark",
  "span",
  "br",
  "hr",
  "a",
  "ul",
  "ol",
  "li",
  "table",
  "colgroup",
  "col",
  "thead",
  "tbody",
  "tfoot",
  "tr",
  "td",
  "th",
  "input",
  "figure",
  "nav",
  "time",
  "yopem-editor-label",
])

const inlineMetadataTags = new Set([
  "span",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "del",
  "sub",
  "sup",
  "mark",
  "code",
  "br",
  "hr",
  "input",
  "col",
  "colgroup",
])

const inlineDirectionTags = new Set([
  "span",
  "strong",
  "b",
  "em",
  "i",
  "s",
  "del",
  "sub",
  "sup",
  "u",
  "mark",
  "code",
])

const attributes = new Set([
  "dataEditorState",
  "dataEditorTextFormat",
  "dataEditorTextStyle",
  "align",
  "href",
  "title",
  "rel",
  "dataEditorCallout",
  "dataAppearance",
  "dataIcon",
  "dataEditorToggle",
  "dataEditorToggleBody",
  "dataEditorToggleSummary",
  "dataEditorToggleControl",
  "dataEditorToggleContent",
  "contentEditable",
  "open",
  "tabIndex",
  "ariaLabel",
  "target",
  "style",
  "dir",
  "start",
  "colSpan",
  "rowSpan",
  "type",
  "checked",
  "disabled",
  "dataEditorIndent",
  "dataEditorBlockPresentation",
  "dataEditorListMarker",
  "dataEditorBorder",
  "dataEditorHeaderState",
  "dataEditorRowHeight",
  "dataEditorColWidths",
  "dataEditorRowStriping",
  "dataLexicalRowStriping",
  "dataLexicalFrozenColumn",
  "dataLexicalFrozenRow",
  "dataEditorFrozenColumns",
  "dataEditorFrozenRows",
  "dataEditorFootnoteReference",
  "dataEditorFootnoteDefinition",
  "dataEditorFootnoteBacklink",
  "dataEditorFootnoteReferenceLink",
  "dataEditorToc",
  "dataEditorColumns",
  "dataEditorColumnsLayout",
  "dataEditorColumn",
  "dataEditorDate",
  "dateTime",
  "dataEditorDrawing",
  "dataEditorDrawingScene",
  "dataEditorEditableCard",
  "dataEditorMediaPlaceholder",
  "dataEditorDiagram",
  "dataEditorDiagramKind",
  "dataEditorDiagramView",
  "dataEditorSlot",
  "dataEditorLabel",
  "id",
  "role",
])

export function textOf(node: RootContent): string {
  if (node.type === "text") return node.value

  if (node.type !== "element") return ""

  return node.tagName === "br" ? "\n" : node.children.map(textOf).join("")
}

export function documentMathChildren(value: EditorMathValue): ElementContent[] {
  const result = renderEditorMath(value)

  if (!result.ok) return [{ type: "text" as const, value: value.tex }]

  const tree = parseHTMLSyntax(result.html)
  checkTree(tree)

  return tree.children.map((node) => {
    if (
      node.type !== "element" &&
      node.type !== "text" &&
      node.type !== "comment"
    )
      throw new DocumentError(["Invalid generated math HTML."])

    return node
  })
}

export function canonicalDocumentNode(node: Element) {
  const properties = node.properties

  const flags = [
    properties.dataEditorMath !== undefined ||
      properties.dataEditorTex !== undefined,
    properties.dataMentionId !== undefined ||
      properties.dataMentionLabel !== undefined,
    properties.dataYopemMedia !== undefined,
    properties.dataEditorFootnoteReference !== undefined,
    properties.dataEditorFootnoteDefinition !== undefined,
    properties.dataEditorToc !== undefined,
    properties.dataEditorColumns !== undefined ||
      properties.dataEditorColumnsLayout !== undefined,
    properties.dataEditorColumn !== undefined,
    properties.dataEditorDate !== undefined,
    properties.dataEditorDrawing !== undefined ||
      properties.dataEditorDrawingScene !== undefined,
    properties.dataEditorEditableCard !== undefined,
    properties.dataEditorMediaPlaceholder !== undefined,
    properties.dataEditorDiagram !== undefined ||
      properties.dataEditorDiagramKind !== undefined ||
      properties.dataEditorDiagramView !== undefined,
    properties.dataEditorSlot !== undefined,
    properties.dataEditorLabel !== undefined,
  ]

  if (!flags.some(Boolean)) return null

  if (flags.filter(Boolean).length > 1)
    throw new DocumentError(["Conflicting canonical metadata."])

  function allowed(keys: readonly string[]) {
    const allowedKeys = new Set(keys)

    if (Object.keys(properties).some((key) => !allowedKeys.has(key)))
      throw new DocumentError(["Unsupported canonical node metadata."])
  }

  function withoutSlots() {
    return {
      ...node,
      children: node.children.filter(
        (child) =>
          child.type !== "element" ||
          child.properties.dataEditorSlot === undefined,
      ),
    }
  }

  function state() {
    if (properties.dataEditorState === undefined) return

    try {
      const value: unknown = JSON.parse(String(properties.dataEditorState))
      checkTree(value)
      const parsed = documentStateSchema.parse(value)

      if (
        parsed.yopemReview !== undefined ||
        parsed.yopemSuggestion !== undefined ||
        parsed.yopemReviewStructural !== undefined ||
        parsed.yopemReviewBreak !== undefined ||
        parsed.yopemReviewNativeFragment !== undefined ||
        parsed.yopemReviewNativeOperation !== undefined
      )
        throw new Error("Untrusted review state")
    } catch {
      throw new DocumentError(["Invalid canonical node state."])
    }
  }

  const media = properties.dataYopemMedia !== undefined

  if (media) {
    const value = documentMediaSchema.parse(
      JSON.parse(z.string().parse(properties.dataYopemMedia)),
    )

    const expected = parseHTMLSyntax(serializeMediaHtml(value))

    if (
      node.tagName !== "figure" ||
      toHtml(withoutSlots()) !== toHtml(expected)
    )
      throw new DocumentError(["Invalid canonical media HTML."])

    return { type: "media" as const, value }
  }

  const math =
    properties.dataEditorMath !== undefined ||
    properties.dataEditorTex !== undefined

  if (math) {
    const content = withoutSlots()

    const value = editorMathFromHTMLAttributes({
      "data-editor-math": z.string().parse(properties.dataEditorMath),
      "data-editor-tex": z.string().parse(properties.dataEditorTex),
    })

    if (
      node.tagName !== (value.kind === "inline" ? "span" : "div") ||
      content.children.length !== node.children.length ||
      Object.keys(properties).some(
        (key) => !["dataEditorMath", "dataEditorTex"].includes(key),
      ) ||
      !(
        (content.children.every((child) => child.type === "text") &&
          textOf(content) === value.tex) ||
        toHtml({ type: "root", children: content.children }) ===
          toHtml({ type: "root", children: documentMathChildren(value) })
      )
    )
      throw new DocumentError(["Invalid canonical math HTML."])

    return { type: "math" as const, value }
  }

  if (
    properties.dataMentionId !== undefined ||
    properties.dataMentionLabel !== undefined
  ) {
    const identity = decodeMention({
      id: properties.dataMentionId,
      label: properties.dataMentionLabel,
    })

    if (
      !identity ||
      node.tagName !== "span" ||
      Object.keys(properties).some(
        (key) =>
          !["dataMentionId", "dataMentionLabel", "dir", "style"].includes(key),
      ) ||
      (properties.dir !== undefined && properties.dir !== "auto") ||
      node.children.some((child) => child.type !== "text") ||
      textOf(node) !== mentionPlainText(identity)
    )
      throw new DocumentError(["Invalid canonical mention HTML."])

    if (properties.style) safeDocumentStyle(String(properties.style))

    return { type: "mention" as const, value: identity }
  }

  if (properties.dataEditorFootnoteReference !== undefined) {
    const identifier = parseEditorFootnoteId(
      String(properties.dataEditorFootnoteReference),
    )

    allowed(["dataEditorFootnoteReference", "id", "role"])

    const links = node.children.filter(
      (child): child is Element =>
        child.type === "element" && child.tagName === "a",
    )

    const link = links[0]

    if (
      node.tagName !== "sup" ||
      (properties.role !== undefined && properties.role !== "doc-noteref") ||
      (link?.properties.role !== undefined &&
        link.properties.role !== "doc-noteref") ||
      (properties.role !== undefined && link?.properties.role !== undefined) ||
      (properties.id !== undefined &&
        !/^[A-Za-z0-9_.:-]{1,128}$/.test(String(properties.id))) ||
      links.length > 1 ||
      node.children.some(
        (child) =>
          child.type !== "text" &&
          !(
            child.type === "element" &&
            child.tagName === "a" &&
            child.properties.dataEditorFootnoteReferenceLink === "" &&
            child.properties.href !== undefined &&
            Object.keys(child.properties).every((key) =>
              [
                "dataEditorFootnoteReferenceLink",
                "href",
                "ariaLabel",
                "role",
              ].includes(key),
            ) &&
            child.children.every((value) => value.type === "text")
          ),
      )
    )
      throw new DocumentError(["Invalid canonical footnote reference HTML."])

    if (properties.style) safeDocumentStyle(String(properties.style))

    return { type: "footnote-reference" as const, value: identifier }
  }

  if (properties.dataEditorFootnoteDefinition !== undefined) {
    const identifier = parseEditorFootnoteId(
      String(properties.dataEditorFootnoteDefinition),
    )

    allowed([
      "dataEditorFootnoteDefinition",
      "dataEditorState",
      "dataEditorTextFormat",
      "dataEditorTextStyle",
      "dataEditorIndent",
      "dataEditorBlockPresentation",
      "dir",
      "id",
      "role",
      "style",
    ])
    state()

    if (
      node.tagName !== "div" ||
      (properties.role !== undefined &&
        !["doc-footnote", "doc-endnote"].includes(String(properties.role))) ||
      (properties.id !== undefined &&
        !/^[A-Za-z0-9_.:-]{1,128}$/.test(String(properties.id)))
    )
      throw new DocumentError(["Invalid canonical footnote definition HTML."])

    if (properties.style) safeDocumentStyle(String(properties.style))

    validateEditorFootnotesHTML(toHtml({ type: "root", children: [node] }))

    return { type: "footnote-definition" as const, value: identifier }
  }

  if (properties.dataEditorToc !== undefined) {
    allowed(["dataEditorToc", "ariaLabel"])

    if (
      node.tagName !== "nav" ||
      properties.dataEditorToc !== "" ||
      (properties.ariaLabel !== undefined &&
        properties.ariaLabel !== "Table of contents" &&
        !z
          .string()
          .regex(/^Table of contents [1-9][0-9]*$/)
          .safeParse(properties.ariaLabel).success)
    )
      throw new DocumentError(["Invalid canonical table of contents HTML."])

    const content = withoutSlots()

    if (content.children.length !== node.children.length)
      throw new DocumentError(["Table of contents nodes cannot own slots."])

    validateEditorTocHTML(toHtml({ type: "root", children: [content] }))

    return { type: "toc" as const }
  }

  if (
    properties.dataEditorColumns !== undefined ||
    properties.dataEditorColumnsLayout !== undefined
  ) {
    const layout = editorColumnsFromHTMLAttributes({
      "data-editor-columns": z.string().parse(properties.dataEditorColumns),
      "data-editor-columns-layout": z
        .string()
        .parse(properties.dataEditorColumnsLayout),
    })

    allowed([
      "dataEditorColumns",
      "dataEditorColumnsLayout",
      "dataEditorState",
      "dataEditorTextFormat",
      "dataEditorTextStyle",
      "dataEditorIndent",
      "dataEditorBlockPresentation",
      "dir",
      "style",
    ])
    state()

    const content = withoutSlots()

    const columns = content.children.filter(
      (child) => child.type === "element" && child.tagName === "div",
    )

    if (
      node.tagName !== "div" ||
      columns.length !== layout.length ||
      content.children.some((child) =>
        child.type === "text"
          ? child.value.trim().length > 0
          : child.type !== "element" || child.tagName !== "div",
      ) ||
      columns.some(
        (child) =>
          child.type !== "element" ||
          child.properties.dataEditorColumn !== "1" ||
          Object.keys(child.properties).some(
            (key) =>
              ![
                "dataEditorColumn",
                "dataEditorState",
                "dataEditorTextFormat",
                "dataEditorTextStyle",
                "dataEditorIndent",
                "dataEditorBlockPresentation",
                "dir",
                "style",
              ].includes(key),
          ),
      )
    )
      throw new DocumentError(["Invalid canonical editor columns HTML."])

    if (properties.style) safeDocumentStyle(String(properties.style))

    return { type: "columns-group" as const, value: layout }
  }

  if (properties.dataEditorColumn !== undefined) {
    allowed([
      "dataEditorColumn",
      "dataEditorState",
      "dataEditorTextFormat",
      "dataEditorTextStyle",
      "dataEditorIndent",
      "dataEditorBlockPresentation",
      "dir",
      "style",
    ])
    state()

    if (node.tagName !== "div" || properties.dataEditorColumn !== "1")
      throw new DocumentError(["Invalid canonical editor column HTML."])

    if (properties.style) safeDocumentStyle(String(properties.style))

    return { type: "column" as const }
  }

  if (properties.dataEditorDate !== undefined) {
    const value = editorDateFromHTMLAttributes({
      "data-editor-date": String(properties.dataEditorDate),
      datetime: z.string().parse(properties.dateTime),
    })

    allowed(["dataEditorDate", "dateTime"])

    if (
      node.tagName !== "time" ||
      node.children.some((child) => child.type !== "text") ||
      textOf(node) !== value
    )
      throw new DocumentError(["Invalid canonical editor date HTML."])

    return { type: "date" as const, value }
  }

  if (
    properties.dataEditorDrawing !== undefined ||
    properties.dataEditorDrawingScene !== undefined
  ) {
    const scene = editorDrawingFromHTMLAttributes({
      "data-editor-drawing": z.string().parse(properties.dataEditorDrawing),
      "data-editor-drawing-scene": z
        .string()
        .parse(properties.dataEditorDrawingScene),
    })

    const expected = `Drawing with ${scene.elements.length} elements`
    const content = withoutSlots()

    allowed([
      "dataEditorDrawing",
      "dataEditorDrawingScene",
      "ariaLabel",
      "role",
    ])

    if (
      node.tagName !== "figure" ||
      content.children.length !== node.children.length ||
      (properties.ariaLabel !== undefined &&
        properties.ariaLabel !== expected) ||
      (properties.role !== undefined && properties.role !== "group") ||
      content.children.some((child) => child.type !== "text") ||
      textOf(content) !== expected
    )
      throw new DocumentError(["Invalid canonical editor drawing HTML."])

    return { type: "drawing" as const, value: scene }
  }

  if (properties.dataEditorMediaPlaceholder !== undefined) {
    const value = mediaPlaceholderKindSchema.parse(
      properties.dataEditorMediaPlaceholder,
    )

    allowed(["dataEditorMediaPlaceholder"])

    if (
      node.tagName !== "div" ||
      node.children.some((child) => child.type !== "text") ||
      textOf(node) !== "Upload unavailable. Select a file."
    )
      throw new DocumentError(["Invalid canonical media placeholder HTML."])

    return { type: "media-placeholder" as const, value }
  }

  if (properties.dataEditorEditableCard !== undefined) {
    editorEditableCardFromHTMLAttributes({
      "data-editor-editable-card": String(properties.dataEditorEditableCard),
    })
    const content = withoutSlots()
    allowed(["dataEditorEditableCard", "ariaLabel"])

    if (
      node.tagName !== "figure" ||
      content.children.length !== node.children.length ||
      (properties.ariaLabel !== undefined &&
        properties.ariaLabel !== "Editable card") ||
      content.children.some((child) => child.type !== "text") ||
      textOf(content) !== "Editable card"
    )
      throw new DocumentError(["Invalid canonical editable card HTML."])

    return { type: "editable-card" as const }
  }

  if (
    properties.dataEditorDiagram !== undefined ||
    properties.dataEditorDiagramKind !== undefined ||
    properties.dataEditorDiagramView !== undefined
  ) {
    const kind = z.string().safeParse(properties.dataEditorDiagramKind)
    const viewMode = z.string().safeParse(properties.dataEditorDiagramView)

    const metadata = parseEditorDiagramMetadata({
      version: 1,
      kind: kind.success ? kind.data : null,
      viewMode: viewMode.success ? viewMode.data : null,
    })

    const code = node.children.find(
      (child) => child.type === "element" && child.tagName === "code",
    )

    const language = metadata
      ? {
          mermaid: "mermaid",
          plantuml: "plant-uml",
          graphviz: "dot",
          flowchart: "text",
        }[metadata.kind]
      : undefined

    const classes = code?.type === "element" ? code.properties.className : null

    if (
      node.tagName !== "pre" ||
      properties.dataEditorDiagram !== "1" ||
      !metadata ||
      code?.type !== "element" ||
      !Array.isArray(classes) ||
      classes.length !== 1 ||
      classes[0] !== `language-${language}` ||
      Object.keys(code.properties).some((key) => key !== "className") ||
      code.children.some((child) => child.type !== "text") ||
      node.children.filter(
        (child) => child.type === "element" && child.tagName === "code",
      ).length !== 1 ||
      node.children.some((child) =>
        child.type === "text"
          ? child.value.trim().length > 0
          : child.type !== "element" ||
            (child.tagName !== "code" &&
              child.properties.dataEditorSlot === undefined),
      )
    )
      throw new DocumentError(["Invalid canonical editor diagram HTML."])

    allowed([
      "dataEditorDiagram",
      "dataEditorDiagramKind",
      "dataEditorDiagramView",
      "dataEditorState",
      "dataEditorTextFormat",
      "dataEditorTextStyle",
      "dataEditorIndent",
      "dataEditorBlockPresentation",
      "dir",
      "style",
    ])
    state()

    if (
      properties.dataEditorTextFormat !== undefined &&
      !z.coerce
        .number()
        .int()
        .min(0)
        .max(2047)
        .safeParse(properties.dataEditorTextFormat).success
    )
      throw new DocumentError(["Invalid diagram text format."])

    if (properties.dataEditorTextStyle !== undefined)
      safeDocumentStyle(String(properties.dataEditorTextStyle))

    if (
      properties.dataEditorIndent !== undefined &&
      (!/^\d+$/.test(String(properties.dataEditorIndent)) ||
        Number(properties.dataEditorIndent) > 64)
    )
      throw new DocumentError(["Invalid diagram indentation."])

    if (properties.dataEditorBlockPresentation !== undefined) {
      try {
        documentStateSchema.parse({
          editorBlockPresentation: JSON.parse(
            String(properties.dataEditorBlockPresentation),
          ),
        })
      } catch {
        throw new DocumentError(["Invalid diagram block presentation."])
      }
    }

    if (
      properties.dir !== undefined &&
      !["ltr", "rtl"].includes(String(properties.dir))
    )
      throw new DocumentError(["Invalid diagram direction."])

    if (properties.style !== undefined)
      safeDocumentStyle(String(properties.style))

    validateEditorDiagramSource(textOf(code))

    return { type: "diagram" as const, value: metadata }
  }

  if (properties.dataEditorSlot !== undefined) {
    const name = documentSlotNameSchema.parse(properties.dataEditorSlot)

    allowed(["dataEditorSlot"])

    if (
      node.tagName !== "div" ||
      node.children.filter((child) => child.type === "element").length !== 1 ||
      node.children.some((child) =>
        child.type === "text"
          ? child.value.trim().length > 0
          : child.type !== "element",
      )
    )
      throw new DocumentError(["Invalid canonical document slot HTML."])

    return { type: "slot" as const, value: name }
  }

  if (node.tagName === "yopem-editor-label") {
    const label = editorLabelSchema.parse(properties.dataEditorLabel)
    allowed(["dataEditorLabel"])

    if (
      node.tagName !== "yopem-editor-label" ||
      node.children.some((child) => child.type !== "text") ||
      textOf(node) !== label
    )
      throw new DocumentError(["Invalid canonical editor label HTML."])

    return { type: "label" as const, value: label }
  }

  return null
}

export function tocHeadingText(node: RootContent): string {
  if (node.type === "text") return node.value

  if (node.type !== "element") return ""

  if (
    node.properties.dataEditorMath !== undefined ||
    node.properties.dataEditorTex !== undefined
  ) {
    const canonical = canonicalDocumentNode(node)

    if (canonical?.type !== "math")
      throw new DocumentError(["Invalid canonical math HTML."])

    return canonical.value.tex
  }

  return node.tagName === "br"
    ? "\n"
    : node.children.map(tocHeadingText).join("")
}

export function documentListType(node: Element) {
  if (node.tagName !== "ul" && node.tagName !== "ol") return undefined

  const tasks = node.children.some(
    (child) =>
      child.type === "element" &&
      child.children.some(
        (item) => item.type === "element" && item.tagName === "input",
      ),
  )

  return tasks ? "check" : node.tagName === "ol" ? "number" : "bullet"
}

export function documentListMarker(node: Element) {
  const type = documentListType(node)
  const attribute = node.properties.dataEditorListMarker
  const style = safeDocumentStyle(String(node.properties.style ?? ""))

  const declaration = style
    .split("; ")
    .find((item) => item.startsWith("list-style-type:"))

  const listStyleType = declaration?.slice("list-style-type:".length).trim()

  const state =
    node.properties.dataEditorState === undefined
      ? documentStateSchema.parse({})
      : documentStateSchema.parse(
          JSON.parse(String(node.properties.dataEditorState)),
        )

  const marker = parseEditorListMarkerHTML({
    marker: attribute === undefined ? null : String(attribute),
    listStyleType: listStyleType ?? "",
  })

  if (
    attribute !== undefined &&
    listStyleType !== undefined &&
    marker !== listStyleType
  )
    throw new DocumentError(["Conflicting list marker metadata."])

  if (
    state.yopemListMarker !== undefined &&
    marker !== undefined &&
    state.yopemListMarker !== marker
  )
    throw new DocumentError(["Conflicting list marker metadata."])

  const resolved = marker ?? state.yopemListMarker

  if (
    resolved !== undefined &&
    (!type || !isEditorListMarkerForType(resolved, type))
  )
    throw new DocumentError(["List marker does not match list type."])

  return resolved
}

function validateDocumentRelations(tree: Root) {
  const elements: { node: Element; parent: Element | null }[] = []
  const parents = new Map<Element, Element | null>()
  const ids = new Map<string, Element>()

  function collect(node: RootContent, parent: Element | null) {
    if (node.type !== "element") return
    elements.push({ node, parent })
    parents.set(node, parent)
    const id = node.properties.id

    if (id !== undefined) {
      const value = String(id)

      if (ids.has(value)) throw new DocumentError(["Duplicate document ID."])
      ids.set(value, node)
    }

    for (const child of node.children) collect(child, node)
  }

  for (const node of tree.children) collect(node, null)

  const headingIds: string[] = []
  const tocTargets = new Set<string>()
  const tocSequences = new Map<Element, string[]>()

  const headingLabels = new Map<
    Element,
    { projected: string; legacy: string }
  >()

  for (const { node, parent } of elements) {
    if (/^h[1-6]$/.test(node.tagName) && node.properties.id !== undefined) {
      const id = String(node.properties.id)
      headingIds.push(id)
    }

    if (node.tagName !== "a") continue
    const href = String(node.properties.href ?? "")

    const referenceLinkMarker =
      node.properties.dataEditorFootnoteReferenceLink === ""

    const backlinkMarker = node.properties.dataEditorFootnoteBacklink === ""

    if (
      (referenceLinkMarker || backlinkMarker) &&
      !/^#[A-Za-z0-9_.:-]{1,128}$/.test(href)
    )
      throw new DocumentError(["Invalid footnote link target."])

    if (!href.startsWith("#")) continue
    const targetId = href.slice(1)
    const target = ids.get(targetId)

    if (!target) throw new DocumentError(["Document link target is missing."])

    const tocList = parent ? parents.get(parent) : null
    const toc = tocList ? parents.get(tocList) : null

    const inToc =
      parent?.tagName === "li" &&
      tocList?.tagName === "ol" &&
      toc?.tagName === "nav" &&
      toc.properties.dataEditorToc !== undefined

    const referenceLink =
      referenceLinkMarker &&
      parent?.tagName === "sup" &&
      parent.properties.dataEditorFootnoteReference !== undefined

    const backlink =
      backlinkMarker &&
      parent?.tagName === "div" &&
      parent.properties.dataEditorFootnoteDefinition !== undefined

    if (inToc && toc) {
      if (!/^h[1-6]$/.test(target.tagName))
        throw new DocumentError(["Table of contents target is invalid."])
      let labels = headingLabels.get(target)

      if (!labels) {
        labels = {
          projected: tocHeadingText(target).replace(/\s+/g, " ").trim(),
          legacy: textOf(target).replace(/\s+/g, " ").trim(),
        }
        headingLabels.set(target, labels)
      }

      const label = textOf(node).replace(/\s+/g, " ").trim()

      if (label !== labels.projected && label !== labels.legacy)
        throw new DocumentError(["Table of contents target is invalid."])

      tocTargets.add(targetId)
      const sequence = tocSequences.get(toc) ?? []
      sequence.push(targetId)
      tocSequences.set(toc, sequence)
    } else if (referenceLink) {
      if (
        target.tagName !== "div" ||
        target.properties.dataEditorFootnoteDefinition !==
          parent?.properties.dataEditorFootnoteReference
      )
        throw new DocumentError(["Footnote reference target is invalid."])
    } else if (backlink) {
      if (
        target.tagName !== "sup" ||
        target.properties.dataEditorFootnoteReference !==
          parent?.properties.dataEditorFootnoteDefinition
      )
        throw new DocumentError(["Footnote backlink target is invalid."])
    } else {
      throw new DocumentError(["Unsupported document fragment link."])
    }
  }

  const tocNodes = elements.flatMap(({ node }) =>
    node.tagName === "nav" && node.properties.dataEditorToc !== undefined
      ? [node]
      : [],
  )

  if (
    tocNodes.length > 0 &&
    elements.some(
      ({ node }) =>
        /^h[1-6]$/.test(node.tagName) && node.properties.id === undefined,
    )
  )
    throw new DocumentError(["Table of contents heading IDs are incomplete."])

  for (const [index, node] of tocNodes.entries()) {
    const label = node.properties.ariaLabel

    if (
      label !== undefined &&
      label !== "Table of contents" &&
      (tocNodes.length < 2 || label !== `Table of contents ${index + 1}`)
    )
      throw new DocumentError(["Table of contents label is not canonical."])

    const list = node.children.find(
      (child) => child.type === "element" && child.tagName === "ol",
    )

    const count =
      list?.type === "element"
        ? list.children.filter(
            (child) => child.type === "element" && child.tagName === "li",
          ).length
        : 0

    if (count !== (tocSequences.get(node)?.length ?? 0))
      throw new DocumentError(["Table of contents entries need heading links."])
  }

  if (headingIds.length > 0 && tocTargets.size !== headingIds.length)
    throw new DocumentError(["Table of contents heading IDs are incomplete."])

  headingIds.forEach((id, index) => {
    if (
      id !== createEditorTocHeadingId("document", String(index + 1)) ||
      !tocTargets.has(id)
    )
      throw new DocumentError([
        "Heading ID is not canonical for this document.",
      ])
  })

  const expectedSequence = headingIds.join("\0")

  for (const node of tocNodes)
    if ((tocSequences.get(node) ?? []).join("\0") !== expectedSequence)
      throw new DocumentError(["Table of contents order is not canonical."])
}

export function validateHTMLTree(tree: Root, generated = false) {
  checkTree(tree)
  let tableSlots = 0
  const slotNames = new Map<Element | null, Set<string>>()

  function visit(
    node: RootContent,
    parent?: string,
    inSizedTable = false,
    owner?: Element,
  ) {
    if (node.type === "text") return

    if (node.type !== "element")
      throw new DocumentError([`Unsupported HTML node: ${node.type}.`])

    const canonicalNode = canonicalDocumentNode(node)

    if (canonicalNode) {
      if (canonicalNode.type === "slot") {
        const names = slotNames.get(owner ?? null) ?? new Set<string>()

        if (names.has(canonicalNode.value))
          throw new DocumentError(["Duplicate document slot name."])
        names.add(canonicalNode.value)
        slotNames.set(owner ?? null, names)
      }

      if (canonicalNode.type === "media-placeholder" && parent !== undefined)
        throw new DocumentError([
          "Media placeholders require the document root.",
        ])

      if (
        canonicalNode.type === "media" &&
        parent !== undefined &&
        !["blockquote", "aside", "div", "li", "td", "th"].includes(parent)
      )
        throw new DocumentError(["Media requires a block container."])

      if (
        [
          "footnote-definition",
          "toc",
          "columns-group",
          "column",
          "slot",
        ].includes(canonicalNode.type)
      )
        for (const child of node.children)
          visit(child, node.tagName, inSizedTable, node)

      if (canonicalNode.type === "media")
        for (const child of node.children)
          if (
            child.type === "element" &&
            child.properties.dataEditorSlot !== undefined
          )
            visit(child, node.tagName, inSizedTable, node)

      if (canonicalNode.type === "diagram")
        for (const child of node.children)
          if (
            child.type === "element" &&
            child.properties.dataEditorSlot !== undefined
          )
            visit(child, node.tagName, inSizedTable, node)

      return
    }

    if (
      (node.tagName === "colgroup" && parent !== "table") ||
      (node.tagName === "col" && parent !== "colgroup")
    )
      throw new DocumentError(["Invalid table column structure."])

    if (
      node.tagName === "col" &&
      (Object.keys(node.properties).some((key) => key !== "style") ||
        (node.properties.style !== undefined &&
          !/^width:\s*(?:\d+(?:\.\d+)?)px;?$/.test(
            String(node.properties.style),
          )) ||
        Number.parseFloat(String(node.properties.style).split(":")[1] ?? "") <
          48 ||
        Number.parseFloat(String(node.properties.style).split(":")[1] ?? "") >
          640)
    )
      throw new DocumentError(["Invalid native column width."])

    if (
      node.tagName === "colgroup" &&
      (Object.keys(node.properties).length ||
        node.children.filter((child) => child.type === "element").length > 50)
    )
      throw new DocumentError(["Invalid table columns."])

    if (!tags.has(node.tagName))
      throw new DocumentError([`Unsupported HTML element: ${node.tagName}.`])

    const parts = node.children.filter(
      (child): child is Element => child.type === "element",
    )

    const owned = new Map(
      Object.entries({
        dataEditorToggleSummary: ["div", "section", "dataEditorToggle", 0],
        dataEditorToggleControl: [
          "summary",
          "details",
          "dataEditorToggleBody",
          0,
        ],
        dataEditorToggleContent: ["div", "details", "dataEditorToggleBody", 1],
      } as const),
    )

    for (const [marker, [tag, parentTag, parentMarker, index]] of owned) {
      if (
        node.properties[marker] !== undefined &&
        (node.tagName !== tag ||
          owner?.tagName !== parentTag ||
          owner.properties[parentMarker] === undefined ||
          owner.children.filter((child) => child.type === "element")[index] !==
            node)
      )
        throw new DocumentError(["Orphan toggle HTML part."])
    }

    const toggle = node.properties.dataEditorToggle !== undefined
    const body = node.properties.dataEditorToggleBody !== undefined
    const canonical = node.tagName === "section"
    const canonicalBody = body && node.tagName === "details"

    if (toggle || canonicalBody) {
      const firstTag = canonical ? "div" : "summary"
      const secondTag = canonical ? "details" : "div"

      const firstMarker = canonical
        ? "dataEditorToggleSummary"
        : canonicalBody
          ? "dataEditorToggleControl"
          : undefined

      const secondMarker = canonicalBody
        ? "dataEditorToggleContent"
        : "dataEditorToggleBody"

      if (
        (!canonical && node.tagName !== "details") ||
        parts.length !== 2 ||
        parts[0]?.tagName !== firstTag ||
        parts[1]?.tagName !== secondTag ||
        (firstMarker && parts[0].properties[firstMarker] === undefined) ||
        parts[1].properties[secondMarker] === undefined ||
        node.children.some(
          (child) => child.type === "text" && child.value.trim(),
        )
      )
        throw new DocumentError(["Invalid toggle HTML structure."])
    }

    if (
      body &&
      (owner?.properties.dataEditorToggle === undefined ||
        owner.children.filter((child) => child.type === "element")[1] !==
          node ||
        node.tagName !== (owner.tagName === "section" ? "details" : "div"))
    )
      throw new DocumentError(["Orphan toggle body HTML."])

    if (
      node.properties.dataEditorToggleControl !== undefined &&
      (node.children.length ||
        node.properties.contentEditable !== "false" ||
        Object.keys(node.properties).some(
          (key) =>
            ![
              "dataEditorToggleControl",
              "contentEditable",
              "ariaLabel",
              "tabIndex",
            ].includes(key),
        ))
    )
      throw new DocumentError(["Invalid toggle disclosure control."])

    if (
      node.properties.dataEditorToggleContent !== undefined &&
      Object.keys(node.properties).some(
        (key) => key !== "dataEditorToggleContent",
      )
    )
      throw new DocumentError(["Unsupported toggle content metadata."])

    if (canonicalBody) {
      const title = owner?.children.find((child) => child.type === "element")

      if (
        !title ||
        parts[0]?.properties.ariaLabel !==
          (textOf(title).trim() || "Toggle content")
      )
        throw new DocumentError(["Invalid toggle disclosure name."])
    }

    if (
      (node.tagName === "aside" &&
        node.properties.dataEditorCallout === undefined) ||
      (node.tagName === "section" && !toggle) ||
      (node.tagName === "details" && !toggle && !body) ||
      (node.tagName === "summary" && parent !== "details") ||
      (node.tagName === "div" &&
        !body &&
        node.properties.dataEditorToggleSummary === undefined &&
        node.properties.dataEditorToggleContent === undefined) ||
      (node.properties.open !== undefined &&
        !((toggle && node.tagName === "details") || canonicalBody))
    )
      throw new DocumentError(["Unsupported block HTML structure."])

    const columns = node.children.find(
      (child) => child.type === "element" && child.tagName === "colgroup",
    )

    const sizedTable =
      node.tagName === "table"
        ? Boolean(
            node.properties.dataEditorColWidths ??
            (columns?.type === "element" &&
              columns.children.some(
                (column) =>
                  column.type === "element" && column.properties.style,
              )),
          )
        : inSizedTable

    if (
      ["td", "th"].includes(node.tagName) &&
      /(?:min-inline-size|overflow-wrap)\s*:/.test(
        String(node.properties.style ?? ""),
      ) &&
      !sizedTable
    )
      throw new DocumentError(["Cell layout CSS requires table column widths."])

    for (const [key, value] of Object.entries(node.properties)) {
      if (key.startsWith("dataEditor") && inlineMetadataTags.has(node.tagName))
        throw new DocumentError(["Inline metadata requires JSON export."])

      if (
        generated &&
        key === "className" &&
        ["ul", "li", "code"].includes(node.tagName)
      )
        continue

      if (
        key === "className" &&
        node.tagName === "code" &&
        Array.isArray(value) &&
        value.every((name) =>
          /^language-[a-zA-Z0-9_-]{1,40}$/.test(String(name)),
        )
      )
        continue

      const owners = new Map(
        Object.entries({
          dataEditorCallout: ["aside"],
          dataAppearance: ["aside"],
          dataIcon: ["aside"],
          dataEditorToggle: ["section", "details"],
          dataEditorToggleBody: ["details", "div"],
          dataEditorToggleSummary: ["div"],
          dataEditorToggleControl: ["summary"],
          dataEditorToggleContent: ["div"],
          contentEditable: ["summary"],
          open: ["details"],
          tabIndex: ["summary"],
          ariaLabel: ["summary"],
          dataEditorListMarker: ["ul", "ol"],
          dataEditorIndent: [
            "aside",
            "section",
            "details",
            "summary",
            "div",
            "p",
            "h1",
            "h2",
            "h3",
            "h4",
            "h5",
            "h6",
            "blockquote",
            "li",
            "ul",
            "ol",
            "table",
            "tr",
            "td",
            "th",
            "a",
          ],
          dataEditorBlockPresentation: [
            "aside",
            "section",
            "details",
            "summary",
            "div",
            "pre",
            "ul",
            "ol",
            "table",
            "tr",
            "td",
            "th",
            "p",
            "h1",
            "h2",
            "h3",
            "h4",
            "h5",
            "h6",
            "blockquote",
            "li",
          ],
          dataEditorBorder: ["td", "th"],
          dataEditorHeaderState: ["td", "th"],
          dataEditorRowHeight: ["tr"],
          dataEditorColWidths: ["table"],
          dataEditorRowStriping: ["table"],
          dataLexicalRowStriping: ["table"],
          dataLexicalFrozenColumn: ["table"],
          dataLexicalFrozenRow: ["table"],
          dataEditorFrozenColumns: ["table"],
          dataEditorFrozenRows: ["table"],
          dataEditorFootnoteReference: ["sup"],
          dataEditorFootnoteDefinition: ["div"],
          dataEditorFootnoteBacklink: ["a"],
          dataEditorFootnoteReferenceLink: ["a"],
          dataEditorToc: ["nav"],
          dataEditorColumns: ["div"],
          dataEditorColumnsLayout: ["div"],
          dataEditorColumn: ["div"],
          dataEditorDate: ["time"],
          dateTime: ["time"],
          dataEditorDrawing: ["figure"],
          dataEditorDrawingScene: ["figure"],
          dataEditorEditableCard: ["figure"],
          dataEditorMediaPlaceholder: ["div"],
          dataEditorDiagram: ["pre"],
          dataEditorDiagramKind: ["pre"],
          dataEditorDiagramView: ["pre"],
          dataEditorSlot: ["div"],
          dataEditorLabel: ["yopem-editor-label"],
          id: ["h1", "h2", "h3", "h4", "h5", "h6", "sup", "div"],
          role: ["sup", "div", "a"],
          align: ["td", "th", "table"],
          href: ["a"],
          title: ["a"],
          rel: ["a"],
          target: ["a"],
          start: ["ol"],
          colSpan: ["td", "th"],
          rowSpan: ["td", "th"],
          type: ["input"],
          checked: ["input"],
          disabled: ["input"],
        }),
      )

      if (owners.get(key) && !owners.get(key)?.includes(node.tagName))
        throw new DocumentError([
          `Unsupported attribute on ${node.tagName}: ${key}.`,
        ])

      if (
        key === "role" &&
        node.tagName === "a" &&
        (value !== "doc-noteref" ||
          node.properties.dataEditorFootnoteReferenceLink !== "")
      )
        throw new DocumentError(["Invalid footnote reference role."])

      if (
        ["thead", "tbody", "tfoot", "br", "input"].includes(node.tagName) &&
        ["style", "dir"].includes(key)
      )
        throw new DocumentError([`Unsupported ${key} on ${node.tagName}.`])

      if (!attributes.has(key))
        throw new DocumentError([`Unsupported HTML attribute: ${key}.`])

      if (key === "tabIndex" && Number(value) !== 0)
        throw new DocumentError(["Unsupported summary tab index."])

      if (
        key === "contentEditable" &&
        node.properties.dataEditorToggleControl === undefined
      )
        throw new DocumentError(["Unsupported editable HTML attribute."])

      if (
        key === "ariaLabel" &&
        node.properties.dataEditorToggleControl === undefined &&
        value !== "Toggle content"
      )
        throw new DocumentError(["Unsupported summary accessible name."])

      if (
        key === "href" &&
        !safeDocumentURL(String(value)) &&
        !/^#[A-Za-z0-9_.:-]{1,128}$/.test(String(value))
      )
        throw new DocumentError(["Unsafe link URL."])

      if (
        [
          "dataEditorFootnoteBacklink",
          "dataEditorFootnoteReferenceLink",
        ].includes(key) &&
        value !== ""
      )
        throw new DocumentError(["Invalid canonical footnote link."])

      if (key === "id" && !/^[A-Za-z0-9_.:-]{1,128}$/.test(String(value)))
        throw new DocumentError(["Invalid document element ID."])

      if (key === "style") {
        safeDocumentStyle(String(value))

        if (
          /border[^:;]*:\s*hidden/.test(String(value)) &&
          !node.properties.dataEditorBorder
        )
          throw new DocumentError(["Hidden table border requires metadata."])
      }

      if (
        key === "dataEditorTextFormat" &&
        !z.coerce.number().int().min(0).max(2047).safeParse(value).success
      )
        throw new DocumentError(["Invalid element text format."])

      if (key === "dataEditorTextStyle") safeDocumentStyle(String(value))

      if (
        [
          "dataLexicalRowStriping",
          "dataLexicalFrozenColumn",
          "dataLexicalFrozenRow",
        ].includes(key) &&
        !["true", "false"].includes(String(value))
      )
        throw new DocumentError(["Invalid native table metadata."])

      if (key === "dataEditorState") {
        try {
          const state: unknown = JSON.parse(String(value))
          checkTree(state)
          documentStateSchema.parse(state)
        } catch {
          throw new DocumentError(["Invalid document NodeState metadata."])
        }
      }

      if (key === "dataEditorBlockPresentation") {
        try {
          documentStateSchema.parse({
            editorBlockPresentation: JSON.parse(String(value)),
          })
        } catch {
          throw new DocumentError(["Invalid block presentation."])
        }
      }

      if (
        key === "dataEditorHeaderState" &&
        !["0", "1", "2", "3"].includes(String(value))
      )
        throw new DocumentError(["Invalid table header state."])

      if (
        key === "dataEditorRowHeight" &&
        parseTableRowHeightHTML(String(value)) === undefined
      )
        throw new DocumentError(["Invalid table row height."])

      if (key === "dataEditorBorder") {
        try {
          parseTableBorderHTML(String(value))
        } catch {
          throw new DocumentError(["Invalid table border."])
        }
      }

      if (key === "dataEditorColWidths") {
        try {
          z.array(z.number().min(48).max(640))
            .max(50)
            .parse(JSON.parse(String(value)))
        } catch {
          throw new DocumentError(["Invalid table column widths."])
        }
      }

      if (
        key === "dataEditorRowStriping" &&
        !["true", "false"].includes(String(value))
      )
        throw new DocumentError(["Invalid table striping."])

      if (
        [
          "dataEditorIndent",
          "dataEditorFrozenColumns",
          "dataEditorFrozenRows",
        ].includes(key) &&
        (!/^\d+$/.test(String(value)) ||
          Number(value) > (key === "dataEditorIndent" ? 64 : 50))
      )
        throw new DocumentError([`Invalid ${key}.`])

      if (
        key === "align" &&
        !["left", "right", "center"].includes(String(value))
      )
        throw new DocumentError(["Invalid table alignment."])

      if (key === "dir" && inlineDirectionTags.has(node.tagName))
        throw new DocumentError(["Inline direction requires JSON export."])

      if (
        ["colSpan", "rowSpan"].includes(key) &&
        (!Number.isInteger(Number(value)) ||
          Number(value) < 1 ||
          Number(value) > 50)
      )
        throw new DocumentError([`Invalid HTML attribute: ${key}.`])

      if (
        key === "start" &&
        parseEditorListStartHTML(String(value)) === undefined
      )
        throw new DocumentError(["Invalid list start."])

      if (key === "dir" && !["ltr", "rtl"].includes(String(value)))
        throw new DocumentError(["Invalid direction."])
    }

    documentListMarker(node)

    if (node.tagName === "a")
      validateDocumentLink(node.properties.target, node.properties.rel)

    if (
      node.tagName === "input" &&
      (node.properties.type !== "checkbox" || !node.properties.disabled)
    )
      throw new DocumentError(["Only disabled task checkboxes are supported."])

    if (
      (node.tagName === "tr" &&
        !["table", "thead", "tbody", "tfoot"].includes(parent ?? "")) ||
      (["td", "th"].includes(node.tagName) && parent !== "tr") ||
      (node.tagName === "table" &&
        parent &&
        !["root", "blockquote", "aside", "div"].includes(parent))
    )
      throw new DocumentError(["Invalid table structure."])

    if (node.tagName === "table") {
      const css = String(node.properties.style ?? "")

      if (/(?:table-layout|inline-size)\s*:/.test(css)) {
        const widths = node.properties.dataEditorColWidths
          ? z
              .array(z.number().min(48).max(640))
              .max(50)
              .parse(JSON.parse(String(node.properties.dataEditorColWidths)))
          : columns?.type === "element"
            ? columns.children
                .filter(
                  (column) =>
                    column.type === "element" && column.tagName === "col",
                )
                .map((column) =>
                  column.type === "element"
                    ? Number.parseFloat(
                        String(column.properties.style).split(":")[1] ?? "",
                      )
                    : NaN,
                )
            : []

        const inline = /(?:^|;)\s*inline-size:\s*([\d.]+)px(?:;|$)/.exec(css)

        if (
          !sizedTable ||
          !widths.length ||
          (inline &&
            Number(inline[1]) !== widths.reduce((sum, width) => sum + width, 0))
        )
          throw new DocumentError([
            "Table layout CSS does not match column widths.",
          ])
      }

      const rows = node.children
        .flatMap((child) =>
          child.type === "element" &&
          ["thead", "tbody", "tfoot"].includes(child.tagName)
            ? child.children
            : [child],
        )
        .filter(
          (child): child is Element =>
            child.type === "element" && child.tagName === "tr",
        )

      tableSlots += checkTableGrid(
        rows.map((row) =>
          row.children
            .filter(
              (cell): cell is Element =>
                cell.type === "element" && ["td", "th"].includes(cell.tagName),
            )
            .map((cell) => ({
              colSpan: Number(cell.properties.colSpan ?? 1),
              rowSpan: Number(cell.properties.rowSpan ?? 1),
            })),
        ),
      )
    }

    if (tableSlots > 2500)
      throw new DocumentError(["Document exceeds 2500 table slots."])

    for (const child of node.children)
      visit(child, node.tagName, sizedTable, node)
  }

  for (const node of tree.children) visit(node)
  validateDocumentRelations(tree)

  return tree
}

export function parseHTMLSyntax(source: string) {
  checkText(source)
  const errors: string[] = []

  const tree = fromHtml(source, {
    fragment: true,
    onerror(error) {
      errors.push(error.reason)
    },
    verbose: true,
  })

  if (errors.length) throw new DocumentError(errors)

  interface SourceAncestor {
    start: number
    end: number
    parent: SourceAncestor | undefined
  }

  const pending: {
    node: RootContent
    slotStart: number | undefined
    ancestor: SourceAncestor | undefined
  }[] = tree.children.map((node) => ({
    node,
    slotStart: undefined,
    ancestor: undefined,
  }))

  const slotStarts = new Set<number>()

  const slotAncestors: {
    offset: number
    ancestor: SourceAncestor | undefined
  }[] = []

  const sourceStarts: number[] = []
  const sourceEnds: number[] = []
  const unclosedInlineEnds = new Set<number>()

  while (pending.length) {
    const entry = pending.pop()

    if (entry?.node.type !== "element") continue

    const node = entry.node
    const offset = node.position?.start.offset
    const opening = node.data?.position?.opening
    const openingStart = opening?.start.offset
    const openingEnd = opening?.end.offset
    const closingStart = node.data?.position?.closing?.start.offset

    const sourceEnd =
      closingStart ??
      (node.tagName === "table" ? source.length : node.position?.end.offset)

    let ancestor = entry.ancestor

    if (openingStart !== undefined && openingEnd !== undefined) {
      const whitespace = (value: string) =>
        value === " " ||
        value === "\t" ||
        value === "\n" ||
        value === "\r" ||
        value === "\f"

      let cursor = openingStart + 1

      while (
        cursor < openingEnd &&
        !whitespace(source[cursor] ?? "") &&
        source[cursor] !== "/" &&
        source[cursor] !== ">"
      )
        cursor += 1

      const positions = Object.entries(node.data?.position?.properties ?? {})
        .map(([name, position]) => ({
          name,
          start: position?.start.offset,
          end: position?.end.offset,
        }))
        .sort((left, right) => (left.start ?? -1) - (right.start ?? -1))

      for (const position of positions) {
        if (
          position.start === undefined ||
          position.end === undefined ||
          position.start < cursor ||
          position.end > openingEnd
        )
          throw new DocumentError(["Ambiguous HTML attributes."])

        while (cursor < position.start && whitespace(source[cursor] ?? ""))
          cursor += 1

        if (cursor !== position.start)
          throw new DocumentError(["Ambiguous HTML attributes."])

        let nameEnd = cursor

        while (
          nameEnd < position.end &&
          !whitespace(source[nameEnd] ?? "") &&
          source[nameEnd] !== "=" &&
          source[nameEnd] !== "/" &&
          source[nameEnd] !== ">"
        )
          nameEnd += 1

        const serialized = toHtml(
          element("div", [], {
            [position.name]: node.properties[position.name],
          }),
        )

        const name = source.slice(cursor, nameEnd).toLowerCase()

        if (
          !serialized.startsWith(`<div ${name}=`) &&
          !serialized.startsWith(`<div ${name}>`) &&
          !serialized.startsWith(`<div ${name} `)
        )
          throw new DocumentError(["Ambiguous HTML attributes."])
        cursor = position.end
      }

      while (cursor < openingEnd && whitespace(source[cursor] ?? ""))
        cursor += 1
      const tail = source.slice(cursor, openingEnd)

      if (tail !== ">" && tail !== "/>")
        throw new DocumentError(["Ambiguous HTML attributes."])
    }

    if (node.properties.dataEditorSlot !== undefined) {
      if (
        offset === undefined ||
        openingStart === undefined ||
        openingEnd === undefined
      )
        throw new DocumentError(["Ambiguous slot source position."])
      slotAncestors.push({ offset, ancestor: entry.ancestor })
    }

    if (
      openingEnd !== undefined &&
      sourceEnd !== undefined &&
      sourceEnd >= openingEnd
    ) {
      sourceStarts.push(openingEnd)
      sourceEnds.push(sourceEnd)
      ancestor = { start: openingEnd, end: sourceEnd, parent: entry.ancestor }
    }

    if (
      entry.slotStart !== undefined &&
      offset !== undefined &&
      offset < entry.slotStart
    )
      throw new DocumentError(["Invalid reconstructed slot content."])

    const slotStart =
      node.properties.dataEditorSlot !== undefined ? offset : entry.slotStart

    if (node.properties.dataEditorSlot !== undefined && offset !== undefined)
      slotStarts.add(offset)

    if (
      (inlineDirectionTags.has(node.tagName) ||
        ["a", "time", "yopem-editor-label"].includes(node.tagName)) &&
      node.data?.position?.closing === undefined &&
      node.position?.end.offset !== undefined
    )
      unclosedInlineEnds.add(node.position.end.offset)

    const startPosition = node.data?.position?.properties?.start

    if (
      node.tagName === "ol" &&
      (startPosition !== undefined || node.properties.start !== undefined)
    ) {
      const startOffset = startPosition?.start?.offset
      const endOffset = startPosition?.end?.offset

      const rawAttribute =
        startOffset === undefined || endOffset === undefined
          ? ""
          : source.slice(startOffset, endOffset)

      const match =
        /^\s*start\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'`=<>]+))\s*$/i.exec(
          rawAttribute,
        )

      const value = match?.[1] ?? match?.[2] ?? match?.[3]

      const decoded = value?.replace(
        /&#(?:([0-9]+)|[xX]([\da-f]+));/gi,
        (
          _match,
          decimal: string | undefined,
          hexadecimal: string | undefined,
        ) => {
          const codePoint = Number.parseInt(
            decimal ?? hexadecimal ?? "",
            decimal ? 10 : 16,
          )

          return Number.isInteger(codePoint) && codePoint <= 0x10ffff
            ? String.fromCodePoint(codePoint)
            : "\uFFFD"
        },
      )

      const parsedStart =
        decoded === undefined ? undefined : parseEditorListStartHTML(decoded)

      if (parsedStart === undefined || parsedStart !== node.properties.start)
        throw new DocumentError(["Invalid list start."])
    }

    if (node.data) {
      Reflect.deleteProperty(node.data, "position")

      if (Object.keys(node.data).length === 0) delete node.data
    }

    pending.push(
      ...node.children.map((child) => ({ node: child, slotStart, ancestor })),
    )
  }

  sourceStarts.sort((left, right) => left - right)
  sourceEnds.sort((left, right) => left - right)
  slotAncestors.sort((left, right) => left.offset - right.offset)
  let started = 0
  let ended = 0

  for (const slot of slotAncestors) {
    while (
      started < sourceStarts.length &&
      (sourceStarts[started] ?? Infinity) <= slot.offset
    )
      started += 1

    while (
      ended < sourceEnds.length &&
      (sourceEnds[ended] ?? Infinity) <= slot.offset
    )
      ended += 1
    let count = 0
    let depth = 0
    let ancestor = slot.ancestor

    while (ancestor) {
      if (++depth > documentLimits.depth)
        throw new DocumentError(["Document exceeds depth limit."])

      if (ancestor.start <= slot.offset && slot.offset < ancestor.end)
        count += 1
      ancestor = ancestor.parent
    }

    if (started - ended !== count)
      throw new DocumentError(["Invalid slot source ancestry."])
  }

  if ([...slotStarts].some((offset) => unclosedInlineEnds.has(offset)))
    throw new DocumentError(["Invalid reconstructed slot content."])

  checkTree(tree)

  return tree
}

export function parseHTML(source: string) {
  return validateHTMLTree(parseHTMLSyntax(source))
}

export function element(
  tagName: string,
  children: Element["children"] = [],
  properties: Element["properties"] = {},
): Element {
  return { type: "element", tagName, properties, children }
}
