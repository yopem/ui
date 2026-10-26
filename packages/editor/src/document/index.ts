import type { BaseSelection, LexicalEditor, LexicalNode } from "lexical"

import {
  $generateNodesFromSerializedNodes,
  ClipboardImportExtension,
  DEFAULT_IMPORT_MIME_TYPE,
} from "@lexical/clipboard"
import { getPeerDependencyFromEditor } from "@lexical/extension"
import { validateEditorBlocksJSON } from "@yopem-ui/editor/blocks-model"
import { validateEditorColumnsJSON } from "@yopem-ui/editor/columns-model"
import {
  editorDateNodeSchema,
  validateEditorDateJSON,
} from "@yopem-ui/editor/date-model"
import {
  parseEditorDiagramMetadata,
  validateEditorDiagramSource,
} from "@yopem-ui/editor/diagram/model"
import { parseEditorDrawingNode } from "@yopem-ui/editor/drawing/model"
import { editorEditableCardNodeSchema } from "@yopem-ui/editor/editable-card/model"
import {
  editorFootnoteIdSchema,
  parseEditorFootnoteDefinitionNode,
  parseEditorFootnoteReferenceNode,
  validateEditorFootnotesJSON,
} from "@yopem-ui/editor/footnote-model"
import {
  editorLabelNodeSchema,
  EDITOR_LABEL_MAX_COUNT,
} from "@yopem-ui/editor/labels/model"
import {
  EDITOR_LIST_START_MAX,
  EDITOR_LIST_START_MIN,
  isEditorListMarkerForType,
} from "@yopem-ui/editor/list-presentation/model"
import { editorMathNodeSchema } from "@yopem-ui/editor/math-model"
import { mentionNodeSchema } from "@yopem-ui/editor/mention-codec"
import {
  tablePresentationDocumentSchema,
  parseTableBorderHTML,
  getTableSpanGeometry,
  getTableEdgeGroups,
} from "@yopem-ui/editor/table-presentation-schema"
import {
  editorTocNodeSchema,
  validateEditorTocJSON,
} from "@yopem-ui/editor/toc-model"
import {
  $getEditor,
  $getRoot,
  $getSelection,
  $hasUpdateTag,
  $isElementNode,
  configExtension,
  defineExtension,
  COMMAND_PRIORITY_LOW,
  HISTORY_PUSH_TAG,
  PASTE_COMMAND,
  PASTE_TAG,
} from "lexical"
import { z } from "zod"

import {
  checkText,
  checkTree,
  DocumentError,
  documentLimits,
  parseHTML,
  parseHTMLSyntax,
  safeDocumentStyle,
  safeDocumentURL,
  validateDocumentLink,
  validateHTMLTree,
} from "./boundary"
import {
  $exportTree,
  $importTree,
  createDocumentEditor,
  documentNodes,
  markdownTree,
  treeHTML,
  treeMarkdown,
  typesetDocumentTree,
} from "./convert"
import { $insertDocumentNodes } from "./insertion"
import { documentMediaSchema } from "./media"
import { documentOptionalNodes } from "./optional-nodes"
import { checkTableGrid, documentStateSchema } from "./state"

export { DocumentError, documentLimits } from "./boundary"

export { documentNodes } from "./convert"

export type DocumentFormat = "markdown" | "html" | "json"

const presentationNodes = new Set([
  "editor-callout",
  "editor-toggle",
  "editor-toggle-summary",
  "editor-toggle-body",
  "editor-footnote-definition",
  "editor-columns-group",
  "editor-column",
  "paragraph",
  "heading",
  "quote",
  "listitem",
  "list",
  "code",
  "table",
  "tablerow",
  "tablecell",
])

const nativeFormatSchema = z.union([
  z.number().int().min(0).max(2047),
  z.enum(["", "left", "right", "center", "justify", "start", "end"]),
])

const nodeSchema = z.strictObject({
  type: z.enum([
    "yopem-media",
    "editor-math",
    "mention",
    "editor-callout",
    "editor-toggle",
    "editor-toggle-summary",
    "editor-toggle-body",
    "root",
    "paragraph",
    "text",
    "linebreak",
    "horizontalrule",
    "tab",
    "heading",
    "quote",
    "code",
    "code-highlight",
    "link",
    "autolink",
    "list",
    "listitem",
    "table",
    "tablerow",
    "tablecell",
    "editor-footnote-reference",
    "editor-footnote-definition",
    "editor-toc",
    "editor-columns-group",
    "editor-column",
    "editor-date",
    "editor-label",
    "editor-drawing",
    "editor-editable-card",
  ]),
  kind: z.enum(["inline", "block"]).optional(),
  tex: z.string().optional(),
  identity: z.unknown().optional(),
  media: z.unknown().optional(),
  identifier: editorFootnoteIdSchema.optional(),
  layout: z.array(z.number().int().min(12).max(76)).min(2).max(4).optional(),
  label: z.string().optional(),
  date: z.string().optional(),
  elements: z.array(z.unknown()).max(2000).optional(),
  appearance: z.unknown().optional(),
  icon: z.unknown().optional(),
  open: z.unknown().optional(),
  version: z.literal(1),
  $: documentStateSchema.optional(),
  $slots: z.record(z.string(), z.unknown()).optional(),
  children: z.array(z.unknown()).optional(),
  direction: z.enum(["ltr", "rtl"]).nullable().optional(),
  format: z
    .union([nativeFormatSchema, z.number().int().min(0).max(65535)])
    .optional(),
  indent: z.number().int().min(0).max(64).optional(),
  text: z.string().optional(),
  detail: z.number().int().min(0).max(3).optional(),
  mode: z.enum(["normal", "token", "segmented"]).optional(),
  style: z.string().optional(),
  textStyle: z.string().optional(),
  textFormat: z.number().int().min(0).max(2047).optional(),
  tag: z.enum(["h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol"]).optional(),
  language: z.string().optional(),
  highlightType: z.string().nullable().optional(),
  url: z.string().optional(),
  title: z.string().nullable().optional(),
  target: z.string().nullable().optional(),
  rel: z.string().nullable().optional(),
  isUnlinked: z.boolean().optional(),
  listType: z.enum(["number", "bullet", "check"]).optional(),
  start: z
    .number()
    .int()
    .min(EDITOR_LIST_START_MIN)
    .max(EDITOR_LIST_START_MAX)
    .optional(),
  value: z
    .number()
    .int()
    .min(EDITOR_LIST_START_MIN)
    .max(EDITOR_LIST_START_MAX)
    .optional(),
  checked: z.boolean().optional(),
  colSpan: z.number().int().min(1).max(50).optional(),
  rowSpan: z.number().int().min(1).max(50).optional(),
  headerState: z.number().int().min(0).max(3).optional(),
  width: z.number().min(48).max(640).optional(),
  height: z.number().optional(),
  verticalAlign: z.enum(["middle", "bottom"]).optional(),
  backgroundColor: z.string().nullable().optional(),
  colWidths: z.array(z.number().min(48).max(640)).max(50).optional(),
  rowStriping: z.boolean().optional(),
  frozenColumnCount: z.number().int().min(0).max(50).optional(),
  frozenRowCount: z.number().int().min(0).max(50).optional(),
})

type SerializedDocumentNode = z.infer<typeof nodeSchema>

const leafTypes = new Set<SerializedDocumentNode["type"]>([
  "yopem-media",
  "text",
  "tab",
  "code-highlight",
  "linebreak",
  "horizontalrule",
  "mention",
  "editor-math",
  "editor-footnote-reference",
  "editor-toc",
  "editor-date",
  "editor-label",
  "editor-drawing",
  "editor-editable-card",
])

const slotlessTypes = new Set<SerializedDocumentNode["type"]>([
  "text",
  "tab",
  "code-highlight",
  "linebreak",
  "horizontalrule",
  "mention",
  "editor-label",
  "editor-footnote-reference",
  "editor-toc",
  "link",
  "autolink",
  "editor-date",
  "editor-math",
  "editor-drawing",
  "editor-editable-card",
])

const elementFields = [
  "children",
  "direction",
  "format",
  "indent",
  "style",
  "textFormat",
  "textStyle",
]

const textFields = ["text", "format", "detail", "mode", "style"]

const nodeFields = new Map(
  Object.entries({
    "editor-callout": [...elementFields, "appearance", "icon"],
    "editor-toggle": [...elementFields, "open"],
    "editor-toggle-summary": elementFields,
    "editor-toggle-body": elementFields,
    root: elementFields,
    paragraph: elementFields,
    quote: elementFields,
    heading: [...elementFields, "tag"],
    code: [...elementFields, "language"],
    "editor-math": ["kind", "tex"],
    "yopem-media": ["media"],
    "editor-footnote-reference": ["identifier"],
    "editor-footnote-definition": [...elementFields, "identifier"],
    "editor-toc": [],
    "editor-columns-group": [...elementFields, "layout"],
    "editor-column": elementFields,
    "editor-date": ["date"],
    "editor-label": [...textFields, "label"],
    "editor-drawing": ["elements"],
    "editor-editable-card": [],
    mention: [...textFields, "identity"],
    text: textFields,
    tab: textFields,
    "code-highlight": [...textFields, "highlightType"],
    linebreak: [],
    horizontalrule: [],
    link: [...elementFields, "url", "title", "target", "rel"],
    autolink: [...elementFields, "url", "title", "target", "rel", "isUnlinked"],
    list: [...elementFields, "listType", "start", "tag"],
    listitem: [...elementFields, "value", "checked"],
    table: [
      ...elementFields,
      "colWidths",
      "rowStriping",
      "frozenColumnCount",
      "frozenRowCount",
    ],
    tablerow: [...elementFields, "height"],
    tablecell: [
      ...elementFields,
      "colSpan",
      "rowSpan",
      "headerState",
      "width",
      "backgroundColor",
      "verticalAlign",
    ],
  }),
)

function serializedText(node: SerializedDocumentNode): string {
  if (node.text !== undefined) return node.text

  return (node.children ?? [])
    .map((child) => serializedText(nodeSchema.parse(child)))
    .join("")
}

function validateJSON(source: string) {
  checkText(source)
  let parsed: unknown

  try {
    parsed = JSON.parse(source)
  } catch {
    throw new DocumentError(["Invalid document JSON."])
  }

  checkTree(parsed)

  try {
    validateEditorBlocksJSON(z.object({ root: z.unknown() }).parse(parsed))
  } catch (error) {
    throw new DocumentError([
      error instanceof Error ? error.message : "Invalid editor blocks.",
    ])
  }

  const tableValidation = tablePresentationDocumentSchema.safeParse(parsed)

  if (!tableValidation.success)
    throw new DocumentError([tableValidation.error.message])
  const document = z.strictObject({ root: z.unknown() }).safeParse(parsed)

  if (!document.success) throw new DocumentError(["Invalid document root."])

  let tableSlots = 0
  let labelCount = 0
  const labels = new Set<string>()
  const optionalTypes = new Set<string>()

  const pendingNodes = [document.data.root]

  while (pendingNodes.length) {
    const result = nodeSchema.safeParse(pendingNodes.pop())

    if (!result.success)
      throw new DocumentError([
        `Invalid or unsupported document data: ${result.error.message}`,
      ])

    const node = result.data
    optionalTypes.add(node.type)

    const allowed = new Set([
      "type",
      "version",
      "$",
      "$slots",
      ...(nodeFields.get(node.type) ?? []),
    ])

    if (Object.keys(node).some((key) => !allowed.has(key)))
      throw new DocumentError([`Unsupported data on ${node.type}.`])

    if (node.type === "autolink" && node.isUnlinked === undefined)
      throw new DocumentError(["AutoLinkNode requires isUnlinked."])

    if (
      node.$?.yopemReview !== undefined ||
      node.$?.yopemSuggestion !== undefined ||
      node.$?.yopemReviewStructural !== undefined
    )
      throw new DocumentError(["Review metadata requires trusted review IO."])

    if (node.$?.yopemTableBorder !== undefined && node.type !== "tablecell")
      throw new DocumentError(["Table border state requires tablecell."])

    if (
      node.$?.yopemListMarker !== undefined &&
      (node.type !== "list" ||
        node.listType === undefined ||
        !isEditorListMarkerForType(node.$.yopemListMarker, node.listType))
    )
      throw new DocumentError(["List marker does not match list type."])

    if (
      node.type === "list" &&
      node.start !== undefined &&
      node.start !== 1 &&
      node.listType !== "number"
    )
      throw new DocumentError(["Ordered list start requires a numbered list."])

    if (node.$?.editorBlockPresentation && !presentationNodes.has(node.type))
      throw new DocumentError(["Block presentation requires a text block."])

    if (
      (node.$?.codeWrap !== undefined ||
        node.$?.codeLineNumbers !== undefined) &&
      node.type !== "code"
    )
      throw new DocumentError(["Native code view state requires code."])

    if (node.type === "table") {
      const rows = (node.children ?? []).map((row) => nodeSchema.parse(row))

      if (rows.some((row) => row.type !== "tablerow"))
        throw new DocumentError(["Invalid table rows."])
      tableSlots += checkTableGrid(
        rows.map((row) =>
          (row.children ?? []).map((cell) => {
            const parsed = nodeSchema.parse(cell)

            if (parsed.type !== "tablecell")
              throw new DocumentError(["Invalid table cell."])

            return {
              colSpan: parsed.colSpan ?? 1,
              rowSpan: parsed.rowSpan ?? 1,
            }
          }),
        ),
      )
    }

    if (tableSlots > 2500)
      throw new DocumentError(["Document exceeds 2500 table slots."])

    if (
      node.type !== "mention" &&
      node.format !== undefined &&
      !nativeFormatSchema.safeParse(node.format).success
    )
      throw new DocumentError(["Invalid native text format."])

    if (node.type === "editor-math") editorMathNodeSchema.parse(node)

    if (node.type === "mention") mentionNodeSchema.parse(node)

    if (node.type === "yopem-media") documentMediaSchema.parse(node.media)

    if (node.type === "editor-footnote-reference")
      parseEditorFootnoteReferenceNode(node)

    if (node.type === "editor-footnote-definition")
      parseEditorFootnoteDefinitionNode(node)

    if (node.type === "editor-toc") editorTocNodeSchema.parse(node)

    if (node.type === "editor-date") editorDateNodeSchema.parse(node)

    if (node.type === "editor-label") {
      const label = editorLabelNodeSchema.safeParse(node)

      if (!label.success) throw new DocumentError([label.error.message])

      if (label.data.style) safeDocumentStyle(label.data.style)
      labelCount += 1

      if (labelCount > EDITOR_LABEL_MAX_COUNT || labels.has(label.data.label))
        throw new DocumentError(["Invalid document label order or count."])

      labels.add(label.data.label)
    }

    if (node.type === "editor-drawing") {
      const drawing = z
        .strictObject({
          type: z.literal("editor-drawing"),
          version: z.literal(1),
          elements: z.array(z.unknown()).max(2000),
        })
        .parse(node)

      parseEditorDrawingNode(drawing)
    }

    if (node.type === "editor-editable-card")
      editorEditableCardNodeSchema.parse(node)

    if (node.type === "code" && node.$?.editorDiagram !== undefined) {
      const metadata = node.$.editorDiagram

      if (metadata !== null) {
        const parsedMetadata = parseEditorDiagramMetadata(metadata)

        if (!parsedMetadata)
          throw new DocumentError(["Invalid editor diagram metadata."])
        validateEditorDiagramSource(serializedText(node))
      }
    } else if (node.$?.editorDiagram !== undefined) {
      throw new DocumentError(["Diagram metadata requires code."])
    }

    const leaf = leafTypes.has(node.type)

    if (!leaf && !node.children)
      throw new DocumentError([`Missing children on ${node.type}.`])

    if (
      ["text", "tab", "code-highlight"].includes(node.type) &&
      !z.string().safeParse(node.text).success
    )
      throw new DocumentError(["Missing text."])

    if (
      node.format !== undefined &&
      !(leaf ? z.number() : z.string()).safeParse(node.format).success
    )
      throw new DocumentError(["Invalid format value."])

    if (node.style) {
      const style = safeDocumentStyle(node.style)

      if (
        style.split("; ").some((value) => value.startsWith("list-style-type:"))
      )
        throw new DocumentError(["List marker requires list NodeState."])
    }

    if (node.textStyle) {
      const style = safeDocumentStyle(node.textStyle)

      if (
        style.split("; ").some((value) => value.startsWith("list-style-type:"))
      )
        throw new DocumentError(["List marker requires list NodeState."])
    }

    if (node.url && !safeDocumentURL(node.url))
      throw new DocumentError(["Unsafe link URL."])

    if (node.type === "link" || node.type === "autolink")
      validateDocumentLink(node.target, node.rel)

    if (node.backgroundColor)
      safeDocumentStyle(`background-color: ${node.backgroundColor}`)

    const slotValues = Object.values(node.$slots ?? {})

    if (slotValues.length > 0 && slotlessTypes.has(node.type))
      throw new DocumentError(["This document node cannot own slots."])

    for (const child of node.children ?? []) {
      const parsedChild = nodeSchema.parse(child)

      if (
        ["yopem-media", "horizontalrule"].includes(parsedChild.type) &&
        ![
          "root",
          "quote",
          "editor-callout",
          "editor-toggle-body",
          "listitem",
          "tablecell",
          "editor-footnote-definition",
          "editor-column",
        ].includes(node.type)
      )
        throw new DocumentError(["Media and rules require a block container."])
      pendingNodes.push(child)
    }

    for (const slot of slotValues) pendingNodes.push(slot)
  }

  if (nodeSchema.parse(document.data.root).type !== "root")
    throw new DocumentError(["Document root must have type root."])

  if (optionalTypes.has("editor-footnote-definition")) {
    const rootNode = nodeSchema.parse(document.data.root)
    const pendingSlots = Object.values(rootNode.$slots ?? {})

    while (pendingSlots.length) {
      const slotNode = nodeSchema.parse(pendingSlots.pop())

      if (slotNode.type === "editor-footnote-definition")
        throw new DocumentError([
          "Footnote definitions must be document blocks.",
        ])

      pendingSlots.push(
        ...(slotNode.children ?? []),
        ...Object.values(slotNode.$slots ?? {}),
      )
    }
  }

  const optionalDocument = { root: document.data.root }

  try {
    if (
      optionalTypes.has("editor-footnote-reference") ||
      optionalTypes.has("editor-footnote-definition")
    )
      validateEditorFootnotesJSON(optionalDocument)

    if (optionalTypes.has("editor-toc")) validateEditorTocJSON(optionalDocument)

    if (
      optionalTypes.has("editor-columns-group") ||
      optionalTypes.has("editor-column")
    )
      validateEditorColumnsJSON(optionalDocument)

    if (optionalTypes.has("editor-date"))
      validateEditorDateJSON(optionalDocument)
  } catch (error) {
    throw new DocumentError([
      error instanceof Error
        ? error.message
        : "Invalid optional document node.",
    ])
  }

  return source
}

function checkRetainedJSON(
  expected: z.infer<typeof nodeSchema>,
  actual: z.infer<typeof nodeSchema>,
) {
  const output = new Map(Object.entries(actual))

  for (const [key, value] of Object.entries(expected)) {
    if (
      key !== "children" &&
      JSON.stringify(value) !== JSON.stringify(output.get(key))
    )
      throw new DocumentError([
        `Native JSON field cannot be retained: ${expected.type}.${key}.`,
      ])
  }

  if (expected.children?.length !== actual.children?.length)
    throw new DocumentError(["Native JSON children cannot be retained."])

  for (const [index, child] of (expected.children ?? []).entries())
    checkRetainedJSON(
      nodeSchema.parse(child),
      nodeSchema.parse(actual.children?.[index]),
    )
}

export function parseDocument(source: string, format: DocumentFormat) {
  checkText(source)
  const staging = createDocumentEditor()

  try {
    if (format === "json")
      staging.setEditorState(staging.parseEditorState(validateJSON(source)))
    else {
      const tree = format === "html" ? parseHTML(source) : markdownTree(source)
      staging.update(
        () => {
          $importTree(tree)
        },
        { discrete: true },
      )
    }

    if (format !== "json")
      staging.getEditorState().read(
        () => {
          $exportTree()
        },
        { editor: staging },
      )

    const result = staging.getEditorState().toJSON()

    if (format === "json") {
      const input = z.object({ root: nodeSchema }).parse(JSON.parse(source))
      const serializedResult = JSON.stringify(result)

      const serialized = z
        .object({ root: nodeSchema })
        .parse(JSON.parse(serializedResult))

      checkRetainedJSON(input.root, serialized.root)
    }

    validateJSON(JSON.stringify(result))

    return result
  } catch (error) {
    if (error instanceof DocumentError) throw error
    throw new DocumentError([
      error instanceof Error ? error.message : "Document conversion failed.",
    ])
  }
}

export function importDocument(
  editor: LexicalEditor,
  source: string,
  format: DocumentFormat,
) {
  if (!editor.isEditable()) throw new DocumentError(["Document is readonly."])
  const document = parseDocument(source, format)
  validatePasteTarget(editor, document)
  const serialized = JSON.stringify(document)
  let state: ReturnType<LexicalEditor["parseEditorState"]>

  try {
    state = editor.parseEditorState(serialized)
  } catch (error) {
    throw new DocumentError([
      error instanceof Error ? error.message : "Unsupported target editor.",
    ])
  }

  const targetJSON = validateJSON(JSON.stringify(state.toJSON()))
  checkRetainedJSON(
    z.strictObject({ root: nodeSchema }).parse(JSON.parse(serialized)).root,
    z.strictObject({ root: nodeSchema }).parse(JSON.parse(targetJSON)).root,
  )
  editor.setEditorState(state, { tag: HISTORY_PUSH_TAG })
}

export function exportDocument(editor: LexicalEditor, format: DocumentFormat) {
  return editor.read(() => {
    const pending: LexicalNode[] = [$getRoot()]

    while (pending.length) {
      const node = pending.pop()

      if (!$isElementNode(node)) continue

      if (node.getStyle())
        throw new DocumentError([
          "Unpersisted native element style cannot be exported.",
        ])
      pending.push(...node.getChildren())
    }

    const json = validateJSON(JSON.stringify(editor.getEditorState().toJSON()))

    if (format === "json") return json

    const tree = validateHTMLTree($exportTree(format === "markdown"))

    const output = format === "html" ? treeHTML(tree) : treeMarkdown(tree)
    checkText(output)

    return output
  })
}

function documentColors(editor: LexicalEditor) {
  let root: HTMLElement | null = null

  try {
    root = editor.getRootElement()
  } catch {
    root = null
  }

  const view = root?.ownerDocument.defaultView
  let foreground = "#000"
  let background = "#fff"

  if (root?.isConnected && view) {
    foreground = view.getComputedStyle(root).color
    let ancestor: HTMLElement | null = root

    while (ancestor) {
      const value = view.getComputedStyle(ancestor).backgroundColor

      if (
        value !== "transparent" &&
        !/^(?:rgba\([^)]*,\s*0\)|.*\/\s*0\))$/.test(value)
      ) {
        if (value.startsWith("rgba(") || value.includes("/"))
          throw new DocumentError([
            "Standalone export requires an opaque background.",
          ])
        background = value
        break
      }

      ancestor = ancestor.parentElement
    }

    if (!ancestor)
      throw new DocumentError([
        "Standalone export requires an opaque background.",
      ])
  }

  safeDocumentStyle(`color: ${foreground}; background-color: ${background}`)

  function resolveColor(value: string) {
    const match = /^var\((--[a-zA-Z_][a-zA-Z0-9_-]{0,100})\)$/.exec(value)

    if (!match) return value

    if (!root?.isConnected || !view)
      throw new DocumentError([
        "Standalone color variables require a mounted editor with theme context.",
      ])

    const resolved = view
      .getComputedStyle(root)
      .getPropertyValue(match[1] ?? "")
      .trim()

    if (
      !resolved ||
      /\b(?:currentcolor|inherit|initial|unset|revert(?:-layer)?)\b/i.test(
        resolved,
      ) ||
      !view.CSS.supports("color", resolved)
    )
      throw new DocumentError([`Unresolved standalone color: ${match[1]}.`])
    const probe = root.ownerDocument.createElement("span")
    const context = view.getComputedStyle(root)
    probe.style.color = context.color
    probe.style.colorScheme = context.colorScheme
    probe.style.backgroundColor = resolved
    root.ownerDocument.body.append(probe)

    try {
      const color = view.getComputedStyle(probe).backgroundColor
      safeDocumentStyle(`color: ${color}`)

      return color
    } finally {
      probe.remove()
    }
  }

  return { foreground, background, resolveColor }
}

export function htmlDocument(editor: LexicalEditor, title = "Document") {
  checkText(title)

  const tree = typesetDocumentTree(
    editor.read(() => {
      validateJSON(JSON.stringify(editor.getEditorState().toJSON()))

      return validateHTMLTree($exportTree())
    }),
  )

  const colors = documentColors(editor)

  const defaults = new Map(
    Object.entries({
      p: "margin: 0 0 1em",
      summary: "min-block-size: 44px; box-sizing: border-box; cursor: pointer",
      strong: "font-weight: 700",
      em: "font-style: italic",
      del: "text-decoration: line-through",
      table: "border-collapse: collapse",
      td: "border: 1px solid GrayText; padding: 6px",
      th: "border: 1px solid GrayText; padding: 6px; font-weight: 700",
      pre: "white-space: pre-wrap; font-family: 'IBM Plex Mono', monospace",
      code: "font-family: 'IBM Plex Mono', monospace",
      blockquote:
        "margin: 0 0 1em; padding-left: 1em; border-left: 3px solid GrayText",
    }),
  )

  function inline(node: (typeof tree.children)[number]) {
    if (node.type !== "element") return
    const baseline = defaults.get(node.tagName)

    if (node.properties.style)
      node.properties.style = safeDocumentStyle(
        String(node.properties.style),
      ).replace(
        /((?:^|; )(?:(?:background-)?color): )([^;]+)/g,
        (_match, prefix: string, value: string) =>
          `${prefix}${colors.resolveColor(value)}`,
      )

    if (baseline)
      node.properties.style = [baseline, node.properties.style]
        .filter(Boolean)
        .join("; ")

    if (node.properties.dataEditorToggleContent !== undefined)
      node.properties.style = "min-inline-size: 0; overflow-x: auto"

    if (node.tagName === "table") {
      const rows = node.children.filter(
        (child) => child.type === "element" && child.tagName === "tr",
      )

      const cells = rows.flatMap((row) =>
        row.type === "element"
          ? row.children.filter(
              (cell) =>
                cell.type === "element" && ["td", "th"].includes(cell.tagName),
            )
          : [],
      )

      const geometry = getTableSpanGeometry(
        rows.map((row) =>
          row.type === "element"
            ? row.children
                .filter(
                  (cell) =>
                    cell.type === "element" &&
                    ["td", "th"].includes(cell.tagName),
                )
                .map((cell) =>
                  cell.type === "element"
                    ? {
                        colSpan: Number(cell.properties.colSpan ?? 1),
                        rowSpan: Number(cell.properties.rowSpan ?? 1),
                      }
                    : {},
                )
            : [],
        ),
      )

      for (const group of getTableEdgeGroups(geometry.placements)) {
        const values = group.map(({ index, edge }) => {
          const cell = cells[index]

          const border = parseTableBorderHTML(
            cell?.type === "element" && cell.properties.dataEditorBorder
              ? String(cell.properties.dataEditorBorder)
              : null,
          )

          return border === "solid" || border === "hidden" || border === null
            ? border
            : border[edge]
        })

        const value = values.includes("solid")
          ? "solid"
          : values.includes("hidden")
            ? "hidden"
            : null

        if (!value) continue

        for (const { index, edge } of group) {
          const cell = cells[index]

          const side =
            edge === "start" || edge === "end" ? `inline-${edge}` : edge

          if (cell?.type === "element")
            cell.properties.style = `${cell.properties.style ?? ""}; border-${side}-style: ${value}`
        }
      }
    }

    for (const child of node.children) inline(child)
  }

  for (const node of tree.children) inline(node)

  const safeTitle = title
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")

  const output = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${safeTitle}</title></head><body style="font-family: Inter, sans-serif; font-size: 16px; line-height: 1.5; color: ${colors.foreground}; background-color: ${colors.background}">${treeHTML(tree, false)}</body></html>`
  checkText(output)

  return output
}

export function downloadDocument(
  editor: LexicalEditor,
  format: "html" | "markdown",
  ownerDocument: Document,
) {
  const content =
    format === "html"
      ? htmlDocument(editor)
      : exportDocument(editor, "markdown")

  const url = URL.createObjectURL(
    new Blob([content], {
      type:
        format === "html"
          ? "text/html;charset=utf-8"
          : "text/markdown;charset=utf-8",
    }),
  )

  const link = ownerDocument.createElement("a")
  link.href = url
  link.download = format === "html" ? "document.html" : "document.md"
  link.click()
  setTimeout(() => {
    URL.revokeObjectURL(url)
  }, 1000)
}

const pasteRegistrations = new WeakMap<
  LexicalEditor,
  {
    onError: (error: DocumentError) => void
    rejected: WeakSet<DataTransfer>
    markdown: boolean
  }
>()

function validatePasteTarget(
  editor: LexicalEditor,
  document: ReturnType<typeof parseDocument>,
) {
  const serialized = JSON.stringify(document)
  const expected = z.object({ root: nodeSchema }).parse(JSON.parse(serialized))
  const pending = [expected.root]

  while (pending.length) {
    const node = pending.pop()

    if (!node) continue

    const klass =
      documentNodes.find((candidate) => candidate.getType() === node.type) ??
      documentOptionalNodes.find(
        (candidate) => candidate.getType() === node.type,
      )

    if (klass && !editor.hasNode(klass))
      throw new DocumentError([`Unsupported target node: ${node.type}.`])

    for (const child of node.children ?? [])
      pending.push(nodeSchema.parse(child))
  }

  const state = editor.parseEditorState(serialized)
  const serializedState = JSON.stringify(state.toJSON())

  const actual = z
    .object({ root: nodeSchema })
    .parse(JSON.parse(serializedState))

  checkRetainedJSON(expected.root, actual.root)
}

function rejectUntrustedReviewState(
  document: ReturnType<typeof parseDocument>,
) {
  const root = z.object({ root: nodeSchema }).parse(document).root
  const pending = [root]

  while (pending.length) {
    const node = pending.pop()

    if (!node) continue

    if (
      node.$?.yopemReview !== undefined ||
      node.$?.yopemSuggestion !== undefined ||
      node.$?.yopemReviewStructural !== undefined
    )
      throw new DocumentError([
        "Untrusted fragments cannot contain review state.",
      ])

    for (const child of node.children ?? [])
      pending.push(nodeSchema.parse(child))
  }
}

export function $insertDocumentFragment(
  source: string,
  selection: BaseSelection | null = $getSelection(),
) {
  const editor = $getEditor()

  if (!editor.isEditable()) throw new DocumentError(["Document is readonly."])

  if (!selection)
    throw new DocumentError(["Document fragment requires a selection."])
  const document = parseDocument(source, "markdown")
  const fragment = document.root.children
  const first = fragment[0] ? nodeSchema.parse(fragment[0]) : undefined

  if (
    !source.trim() ||
    !fragment.length ||
    (fragment.length === 1 &&
      first?.type === "paragraph" &&
      !first.children?.length)
  )
    throw new DocumentError(["Markdown fragment is empty."])

  rejectUntrustedReviewState(document)
  validatePasteTarget(editor, document)
  const nodes = $generateNodesFromSerializedNodes(fragment)

  if (!nodes.length) throw new DocumentError(["Markdown fragment is empty."])

  $insertDocumentNodes(editor, nodes, selection)
}

function $importDocumentJSON(
  data: string,
  _selection: BaseSelection,
  next: () => boolean,
  dataTransfer: DataTransfer,
) {
  const editor = $getEditor()
  const registration = pasteRegistrations.get(editor)

  if (!registration || !$hasUpdateTag(PASTE_TAG)) return next()

  if (!editor.isEditable()) return true

  try {
    checkText(data)
    const input: unknown = JSON.parse(data)
    checkTree(input)

    const payload = z
      .strictObject({
        namespace: z.string(),
        nodes: z.array(z.unknown()),
      })
      .parse(input)

    if (payload.namespace !== editor._config.namespace) {
      registration.rejected.add(dataTransfer)

      return false
    }

    const children: z.infer<typeof nodeSchema>[] = []
    let inline: unknown[] | undefined

    for (const value of payload.nodes) {
      const node = nodeSchema.parse(value)

      if (
        [
          "text",
          "tab",
          "linebreak",
          "code-highlight",
          "link",
          "autolink",
          "mention",
        ].includes(node.type) ||
        (node.type === "editor-math" && node.kind === "inline")
      ) {
        if (!inline) {
          inline = []
          children.push({
            type: "paragraph",
            version: 1,
            children: inline,
            direction: null,
            format: "",
            indent: 0,
          })
        }

        inline.push(node)
      } else {
        inline = undefined
        children.push(node)
      }
    }

    const document = parseDocument(
      JSON.stringify({
        root: {
          type: "root",
          version: 1,
          children,
          direction: null,
          format: "",
          indent: 0,
        },
      }),
      "json",
    )

    validatePasteTarget(editor, document)
  } catch (error) {
    registration.rejected.add(dataTransfer)
    registration.onError(
      error instanceof DocumentError
        ? error
        : new DocumentError(["Invalid clipboard JSON."]),
    )

    return false
  }

  return next()
}

function $importDocumentHTML(
  data: string,
  _selection: BaseSelection,
  next: () => boolean,
) {
  const editor = $getEditor()
  const onError = pasteRegistrations.get(editor)?.onError

  if (!onError || !$hasUpdateTag(PASTE_TAG)) return next()

  if (!editor.isEditable()) return true

  try {
    const tree = parseHTMLSyntax(data)
    const pending = [...tree.children]

    while (pending.length) {
      const node = pending.pop()

      if (node?.type !== "element") continue

      if (
        node.tagName === "pre" &&
        ["true", "false"].includes(String(node.properties.spellCheck))
      )
        delete node.properties.spellCheck

      const language = z.string().safeParse(node.properties.dataLanguage)

      if (node.tagName === "pre" && language.success)
        delete node.properties.dataLanguage

      if (
        node.tagName === "li" &&
        /^-?\d+$/.test(String(node.properties.value)) &&
        Number(node.properties.value) >= -2147483647 &&
        Number(node.properties.value) <= 2147483647
      )
        delete node.properties.value
      pending.push(...node.children)
    }

    validatePasteTarget(editor, parseDocument(treeHTML(tree), "html"))
  } catch (error) {
    onError(
      error instanceof DocumentError
        ? error
        : new DocumentError(["Invalid clipboard HTML."]),
    )

    return true
  }

  return next()
}

function $importDocumentMarkdown(
  data: string,
  selection: BaseSelection,
  next: () => boolean,
) {
  const editor = $getEditor()
  const registration = pasteRegistrations.get(editor)

  if (!registration?.markdown || !$hasUpdateTag(PASTE_TAG)) return next()

  if (!editor.isEditable()) return true

  try {
    $insertDocumentFragment(data, selection)
  } catch (error) {
    registration.onError(
      error instanceof DocumentError
        ? error
        : new DocumentError(["Invalid clipboard Markdown."]),
    )
  }

  return true
}

function $importDocumentText(
  data: string,
  selection: BaseSelection,
  next: () => boolean,
  dataTransfer: DataTransfer,
  allowMarkdown = true,
) {
  const registration = pasteRegistrations.get($getEditor())

  if ($hasUpdateTag(PASTE_TAG) && registration?.rejected.has(dataTransfer))
    return true

  if (allowMarkdown && registration?.markdown && $hasUpdateTag(PASTE_TAG))
    return $importDocumentMarkdown(data, selection, next)

  return next()
}

function $importDocumentURI(
  data: string,
  selection: BaseSelection,
  next: () => boolean,
  dataTransfer: DataTransfer,
) {
  return $importDocumentText(data, selection, next, dataTransfer, false)
}

export const EditorDocumentClipboardExtension = defineExtension({
  name: "@yopem-ui/editor/document-clipboard",
  register(editor) {
    const output = getPeerDependencyFromEditor<typeof ClipboardImportExtension>(
      editor,
      ClipboardImportExtension.name,
    )?.output

    for (const [mime, handler] of Object.entries({
      "application/x-lexical-editor": $importDocumentJSON,
      "text/html": $importDocumentHTML,
      "text/plain": $importDocumentText,
      "text/uri-list": $importDocumentURI,
    })) {
      const stack = output?.$importMimeType[mime]
      const index = stack?.indexOf(handler) ?? -1

      if (
        !stack ||
        index < 1 ||
        stack[0] !== DEFAULT_IMPORT_MIME_TYPE[mime]?.[0]
      )
        throw new DocumentError([
          "Native clipboard import middleware is unavailable.",
        ])
      stack.splice(index, 1)
      stack.splice(1, 0, handler)
    }

    const markdownStack = output?.$importMimeType["text/markdown"]
    const markdownIndex = markdownStack?.indexOf($importDocumentMarkdown) ?? -1

    if (!markdownStack || markdownIndex < 0)
      throw new DocumentError([
        "Markdown clipboard import middleware is unavailable.",
      ])

    markdownStack.splice(markdownIndex, 1)
    markdownStack.unshift($importDocumentMarkdown)

    return () => {
      pasteRegistrations.delete(editor)
    }
  },
  dependencies: [
    configExtension(ClipboardImportExtension, {
      $importMimeType: {
        "application/x-lexical-editor": [$importDocumentJSON],
        "text/html": [$importDocumentHTML],
        "text/markdown": [$importDocumentMarkdown],
        "text/plain": [$importDocumentText],
        "text/uri-list": [$importDocumentURI],
      },
      priority: { "text/markdown": 15 },
    }),
  ],
})

export function registerDocumentPaste(
  editor: LexicalEditor,
  onError: (error: DocumentError) => void,
  options: { markdown?: boolean } = {},
) {
  if (
    !getPeerDependencyFromEditor<typeof EditorDocumentClipboardExtension>(
      editor,
      EditorDocumentClipboardExtension.name,
    )
  )
    throw new DocumentError([
      "Register EditorDocumentClipboardExtension when you create the editor.",
    ])

  if (pasteRegistrations.has(editor))
    throw new DocumentError(["Document paste is already registered."])

  const registration = {
    onError,
    rejected: new WeakSet<DataTransfer>(),
    markdown: options.markdown === true,
  }

  pasteRegistrations.set(editor, registration)

  const unregister = editor.registerCommand(
    PASTE_COMMAND,
    (event) => {
      registration.rejected = new WeakSet<DataTransfer>()

      return !editor.isEditable() || Boolean(event?.defaultPrevented)
    },
    COMMAND_PRIORITY_LOW,
  )

  let active = true

  return () => {
    if (!active) return
    active = false
    unregister()
    pasteRegistrations.delete(editor)
  }
}

export async function streamMarkdown(
  editor: LexicalEditor,
  chunks: AsyncIterable<string>,
  options: { signal?: AbortSignal; onProgress?: (source: string) => void } = {},
) {
  if (!editor.isEditable()) throw new DocumentError(["Document is readonly."])
  const original = editor.getEditorState()
  let source = ""
  let bytes = 0
  let trailingHighSurrogate = false
  let fragments = 0
  let finished = false
  const iterator = chunks[Symbol.asyncIterator]()
  let aborted: (() => void) | undefined

  const cancellation = new Promise<never>((_, reject) => {
    aborted = () => {
      reject(new DocumentError(["Stream cancelled."]))
    }

    options.signal?.addEventListener("abort", aborted, { once: true })
  })

  try {
    while (true) {
      if (options.signal?.aborted)
        throw new DocumentError(["Stream cancelled."])
      const result = await Promise.race([iterator.next(), cancellation])

      if (result.done) {
        finished = true
        break
      }

      const value = result.value
      const fragmentBytes = checkText(value)
      const first = value.charCodeAt(0)

      const joinedPair =
        trailingHighSurrogate && first >= 0xdc00 && first <= 0xdfff

      bytes += fragmentBytes - (joinedPair ? 2 : 0)

      if (bytes > documentLimits.bytes)
        throw new DocumentError(["Document exceeds 1 MiB."])

      if (value.length) {
        const last = value.charCodeAt(value.length - 1)
        trailingHighSurrogate = last >= 0xd800 && last <= 0xdbff
        source += value
        options.onProgress?.(source)
      }

      fragments += 1

      if (fragments % 256 === 0)
        await new Promise<void>((resolve) => setTimeout(resolve, 0))
    }

    if (options.signal?.aborted) throw new DocumentError(["Stream cancelled."])

    if (editor.getEditorState() !== original)
      throw new DocumentError([
        "Document changed during import. Stream was not applied.",
      ])
    importDocument(editor, source, "markdown")

    return source
  } finally {
    if (aborted) options.signal?.removeEventListener("abort", aborted)

    if (!finished)
      void Promise.resolve()
        .then(() => iterator.return?.())
        .catch(() => undefined)
  }
}
