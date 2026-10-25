import type { Element, Properties, Root, RootContent } from "hast"

import {
  isEditorLineHeight,
  isEditorStyleLength,
} from "@yopem-ui/editor/block-presentation"
import {
  editorMathFromHTMLAttributes,
  type EditorMathValue,
} from "@yopem-ui/editor/math-model"
import { renderEditorMath } from "@yopem-ui/editor/math-render"
import { serializeMediaHtml } from "@yopem-ui/editor/media/html"
import { decodeMention, mentionPlainText } from "@yopem-ui/editor/mention-codec"
import {
  parseTableBorderHTML,
  parseTableRowHeightHTML,
} from "@yopem-ui/editor/table-presentation-schema"
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
      /^(?:Arial|Helvetica|Georgia|Inter|monospace|serif|sans-serif|"IBM Plex Mono"|'IBM Plex Mono'|IBM Plex Mono)$/i,
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
])

export function textOf(node: RootContent): string {
  if (node.type === "text") return node.value

  if (node.type !== "element") return ""

  return node.tagName === "br" ? "\n" : node.children.map(textOf).join("")
}

export function documentMathChildren(value: EditorMathValue) {
  const result = renderEditorMath(value)

  if (!result.ok) return [{ type: "text" as const, value: value.tex }]

  const tree = parseHTMLSyntax(result.html)
  checkTree(tree)

  return tree.children.map((node) => {
    if (node.type === "doctype")
      throw new DocumentError(["Invalid generated math HTML."])

    return node
  })
}

export function canonicalDocumentNode(node: Element) {
  const properties = node.properties

  const math =
    properties.dataEditorMath !== undefined ||
    properties.dataEditorTex !== undefined

  const mention =
    properties.dataMentionId !== undefined ||
    properties.dataMentionLabel !== undefined

  const media = properties.dataYopemMedia !== undefined

  if (!math && !mention && !media) return null

  if (Number(math) + Number(mention) + Number(media) > 1)
    throw new DocumentError(["Conflicting canonical metadata."])

  if (media) {
    const value = documentMediaSchema.parse(
      JSON.parse(z.string().parse(properties.dataYopemMedia)),
    )

    const expected = parseHTMLSyntax(serializeMediaHtml(value))

    if (node.tagName !== "figure" || toHtml(node) !== toHtml(expected))
      throw new DocumentError(["Invalid canonical media HTML."])

    return { type: "media" as const, value }
  }

  if (math) {
    const value = editorMathFromHTMLAttributes({
      "data-editor-math": z.string().parse(properties.dataEditorMath),
      "data-editor-tex": z.string().parse(properties.dataEditorTex),
    })

    if (
      node.tagName !== (value.kind === "inline" ? "span" : "div") ||
      Object.keys(properties).some(
        (key) => !["dataEditorMath", "dataEditorTex"].includes(key),
      ) ||
      !(
        (node.children.every((child) => child.type === "text") &&
          textOf(node) === value.tex) ||
        toHtml({ type: "root", children: node.children }) ===
          toHtml({ type: "root", children: documentMathChildren(value) })
      )
    )
      throw new DocumentError(["Invalid canonical math HTML."])

    return { type: "math" as const, value }
  }

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

export function validateHTMLTree(tree: Root, generated = false) {
  checkTree(tree)
  let tableSlots = 0

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
      if (
        canonicalNode.type === "media" &&
        parent !== undefined &&
        !["blockquote", "aside", "div", "li", "td", "th"].includes(parent)
      )
        throw new DocumentError(["Media requires a block container."])

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

      if (key === "href" && !safeDocumentURL(String(value)))
        throw new DocumentError(["Unsafe link URL."])

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
        (!Number.isSafeInteger(Number(value)) ||
          Math.abs(Number(value)) > 2147483647)
      )
        throw new DocumentError(["Invalid list start."])

      if (key === "dir" && !["ltr", "rtl"].includes(String(value)))
        throw new DocumentError(["Invalid direction."])
    }

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
  })

  if (errors.length) throw new DocumentError(errors)

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
