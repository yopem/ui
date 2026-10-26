import type { Element, ElementContent, Root, RootContent } from "hast"
import type { ElementNode, LexicalNode, TextFormatType } from "lexical"

import {
  $createCodeNode,
  $isCodeNode,
  CodeNode,
  CodeHighlightNode,
} from "@lexical/code"
import {
  $createHorizontalRuleNode,
  $isHorizontalRuleNode,
  HorizontalRuleNode,
} from "@lexical/extension"
import { createHeadlessEditor } from "@lexical/headless"
import {
  $createLinkNode,
  $isAutoLinkNode,
  $isLinkNode,
  AutoLinkNode,
  LinkNode,
} from "@lexical/link"
import {
  $createListItemNode,
  $createListNode,
  $isListItemNode,
  $isListNode,
  ListItemNode,
  ListNode,
} from "@lexical/list"
import {
  $createHeadingNode,
  $createQuoteNode,
  $isHeadingNode,
  $isQuoteNode,
  HeadingNode,
  QuoteNode,
} from "@lexical/rich-text"
import {
  $createTableCellNode,
  $createTableNode,
  $createTableRowNode,
  $isTableCellNode,
  $isTableNode,
  $isTableRowNode,
  TableCellNode,
  TableNode,
  TableRowNode,
} from "@lexical/table"
import {
  CalloutNode,
  ToggleNode,
  ToggleSummaryNode,
  ToggleBodyNode,
  isEditorCalloutAppearance,
  isEditorCalloutIcon,
} from "@yopem-ui/editor/blocks-model"
import { editorColumnsHTMLAttributes } from "@yopem-ui/editor/columns-model"
import {
  editorDateHTMLAttributes,
  editorDateNodeSchema,
} from "@yopem-ui/editor/date-model"
import {
  parseEditorDiagramMetadata,
  validateEditorDiagramSource,
} from "@yopem-ui/editor/diagram/model"
import {
  editorDrawingHTMLAttributes,
  parseEditorDrawingNode,
  parseEditorDrawingScene,
} from "@yopem-ui/editor/drawing/model"
import {
  editorEditableCardHTMLAttributes,
  editorEditableCardNodeSchema,
} from "@yopem-ui/editor/editable-card/model"
import {
  editorFootnoteDefinitionHTMLAttributes,
  editorFootnoteReferenceHTMLAttributes,
  parseEditorFootnoteDefinitionNode,
  parseEditorFootnoteId,
  parseEditorFootnoteReferenceNode,
} from "@yopem-ui/editor/footnote-model"
import { editorLabelNodeSchema } from "@yopem-ui/editor/labels/model"
import { parseEditorListStartHTML } from "@yopem-ui/editor/list-presentation/model"
import {
  editorMathFromMarkdown,
  editorMathToMarkdown,
  type EditorMathValue,
} from "@yopem-ui/editor/math-model"
import {
  EditorMathNode,
  $createEditorMathNode,
} from "@yopem-ui/editor/math-node"
import { serializeMediaHtml } from "@yopem-ui/editor/media/html"
import { MediaNode, $createMediaNode } from "@yopem-ui/editor/media/model"
import {
  mentionMarkdown,
  parseMentionMarkdown,
} from "@yopem-ui/editor/mention-codec"
import { MentionNode, $createMentionNode } from "@yopem-ui/editor/mention-node"
import {
  parseTableBorderHTML,
  parseTableRowHeightHTML,
} from "@yopem-ui/editor/table-presentation-schema"
import {
  createEditorTocHeadingId,
  editorTocHTMLAttributes,
  editorTocNodeSchema,
} from "@yopem-ui/editor/toc-model"
import { toHtml } from "hast-util-to-html"
import {
  $applyNodeReplacement,
  $createLineBreakNode,
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $getSlot,
  $getSlotNames,
  $setSlot,
  $isElementNode,
  $isLineBreakNode,
  $isParagraphNode,
  $isTextNode,
  DecoratorNode,
} from "lexical"
import rehypeRemark from "rehype-remark"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import remarkParse from "remark-parse"
import remarkRehype from "remark-rehype"
import remarkStringify from "remark-stringify"
import { unified } from "unified"
import { z } from "zod"

import {
  canonicalDocumentNode,
  documentListMarker,
  documentListType,
  documentMathChildren,
  checkText,
  checkTree,
  DocumentError,
  element,
  parseHTMLSyntax,
  safeDocumentStyle,
  safeDocumentURL,
  validateHTMLTree,
  textOf,
} from "./boundary"
import {
  DocumentColumnNode,
  DocumentColumnsGroupNode,
  DocumentDateNode,
  DocumentDrawingNode,
  DocumentEditableCardNode,
  DocumentFootnoteDefinitionNode,
  DocumentFootnoteReferenceNode,
  DocumentLabelNode,
  DocumentTocNode,
  documentOptionalNodes,
} from "./optional-nodes"
import {
  getDocumentState,
  setDocumentState,
  documentStateSchema,
} from "./state"

export const documentNodes = [
  HorizontalRuleNode,
  MediaNode,
  EditorMathNode,
  MentionNode,
  CalloutNode,
  ToggleNode,
  ToggleSummaryNode,
  ToggleBodyNode,
  HeadingNode,
  QuoteNode,
  CodeNode,
  CodeHighlightNode,
  ListNode,
  ListItemNode,
  LinkNode,
  AutoLinkNode,
  TableNode,
  TableRowNode,
  TableCellNode,
]

export function createDocumentEditor() {
  return createHeadlessEditor({
    namespace: "yopem-document",
    nodes: [...documentNodes, ...documentOptionalNodes],
    onError(error) {
      throw error
    },
  })
}

export function markdownTree(source: string): Root {
  checkText(source)

  if (source.includes("\0"))
    throw new DocumentError(["Markdown source contains a NULL character."])
  const parser = unified().use(remarkParse).use(remarkGfm).use(remarkMath)
  const tree = parser.parse(source)
  checkTree(tree)

  const unsupported = new Set(["image", "imageReference"])

  function visit(node: {
    type: string
    children?: readonly { type: string }[]
  }) {
    if (unsupported.has(node.type))
      throw new DocumentError([
        `Unsupported Markdown node: ${node.type}. HTML and MDX are not evaluated.`,
      ])

    for (const child of node.children ?? []) visit(child)
  }

  visit(tree)
  convertMarkdownFeatures(tree, source)

  const hast = unified()
    .use(remarkRehype, {
      allowDangerousHtml: true,
      handlers: {
        footnoteReference(_state, node) {
          const identifier = parseEditorFootnoteId(String(node.identifier))

          return element(
            "sup",
            [{ type: "text", value: `[^${identifier}]` }],
            editorFootnoteReferenceHTMLAttributes(identifier),
          )
        },
        footnoteDefinition(state, node) {
          const identifier = parseEditorFootnoteId(String(node.identifier))

          return element(
            "div",
            state.all(node),
            editorFootnoteDefinitionHTMLAttributes(identifier),
          )
        },
      },
    })
    .runSync(tree)

  function removeTaskDelimiter(node: RootContent) {
    if (node.type !== "element") return

    for (const [index, child] of node.children.entries()) {
      const next = node.children[index + 1]

      if (
        child.type === "element" &&
        child.tagName === "input" &&
        child.properties.type === "checkbox" &&
        next?.type === "text" &&
        next.value.startsWith(" ")
      )
        next.value = next.value.slice(1)
      removeTaskDelimiter(child)
    }
  }

  for (const child of hast.children) removeTaskDelimiter(child)

  const parsed = parseHTMLSyntax(toHtml(hast, { allowDangerousHtml: true }))

  return validateHTMLTree(parsed, true)
}

interface MarkdownFeatureNode {
  type: string
  value?: string
  url?: string
  meta?: string | null
  data?: unknown
  children?: MarkdownFeatureNode[]
  position?: { start: { offset?: number }; end: { offset?: number } }
}

function convertMarkdownFeatures(node: MarkdownFeatureNode, source: string) {
  if (["code", "inlineCode", "html"].includes(node.type)) return
  const children = node.children

  if (!children) return

  for (const [index, child] of children.entries()) {
    const previous = children[index - 1]

    if (child.type === "math" || child.type === "inlineMath") {
      if (child.meta)
        throw new DocumentError(["Math fence metadata is unsupported."])

      const value = editorMathFromMarkdown(
        editorMathToMarkdown({
          kind: child.type === "math" ? "block" : "inline",
          tex: child.value ?? "",
        }),
      )

      child.type = "html"
      child.value = toHtml(
        element(
          value.kind === "inline" ? "span" : "div",
          [{ type: "text", value: value.tex }],
          {
            dataEditorMath: value.kind,
            dataEditorTex: value.tex,
          },
        ),
      )
      delete child.children
      delete child.data
      continue
    }

    if (child.type === "link" && child.url?.startsWith("mention:")) {
      const end = child.position?.end.offset
      const start = child.position?.start.offset

      const identity =
        previous?.type === "text" &&
        previous.value?.endsWith("@") &&
        start !== undefined &&
        end !== undefined
          ? parseMentionMarkdown(source.slice(start - 1, end))
          : null

      if (!identity || !previous)
        throw new DocumentError(["Invalid canonical mention Markdown."])
      previous.value = previous.value?.slice(0, -1)

      if (previous.position?.end.offset !== undefined)
        previous.position.end.offset -= 1
      child.type = "html"
      child.value = toHtml(
        element("span", [{ type: "text", value: `@${identity.label}` }], {
          dataMentionId: identity.id,
          dataMentionLabel: identity.label,
        }),
      )
      delete child.children
      continue
    }

    convertMarkdownFeatures(child, source)
  }
}

const textFormats = new Map<string, TextFormatType>(
  Object.entries({
    strong: "bold",
    b: "bold",
    em: "italic",
    i: "italic",
    u: "underline",
    s: "strikethrough",
    del: "strikethrough",
    code: "code",
    sub: "subscript",
    sup: "superscript",
    mark: "highlight",
  }),
)

function append(parent: ElementNode, children: LexicalNode[]) {
  for (const child of children) {
    if (
      ["editor-toc", "editor-drawing", "editor-editable-card"].includes(
        child.getType(),
      )
    ) {
      parent.append(child)
    } else if (
      ($isTableCellNode(parent) || parent.getType() === "root") &&
      !(child instanceof MediaNode) &&
      ((!$isElementNode(child) && !(child instanceof DecoratorNode)) ||
        child.isInline())
    ) {
      const last = parent.getLastChild()

      if ($isParagraphNode(last)) last.append(child)
      else parent.append($createParagraphNode().append(child))
    } else parent.append(child)
  }

  if (parent.getChildrenSize() === 0 && $isTableCellNode(parent))
    parent.append($createParagraphNode())
}

export function $importTree(tree: Root) {
  function isSlotWrapper(node: RootContent): node is Element {
    return (
      node.type === "element" && canonicalDocumentNode(node)?.type === "slot"
    )
  }

  function setSlots(output: LexicalNode, slots: readonly Element[]) {
    for (const wrapper of slots) {
      const slot = canonicalDocumentNode(wrapper)

      if (slot?.type !== "slot")
        throw new DocumentError(["Invalid canonical document slot."])

      const child = wrapper.children.find((value) => value.type === "element")

      if (child?.type !== "element")
        throw new DocumentError(["Document slot needs one block node."])

      const values = convert(child)
      const value = values[0]

      if (
        values.length !== 1 ||
        !value ||
        ($isElementNode(value) && value.isInline()) ||
        (!$isElementNode(value) && !(value instanceof DecoratorNode))
      )
        throw new DocumentError(["Document slot needs one block node."])

      if ($isElementNode(output) || output instanceof DecoratorNode)
        $setSlot(output, slot.value, value)
      else throw new DocumentError(["Document slot host is invalid."])
    }
  }

  function getSlotWrappers(node: RootContent) {
    return node.type === "element" ? node.children.filter(isSlotWrapper) : []
  }

  function convert(
    node: RootContent,
    formats: readonly TextFormatType[] = [],
    inheritedStyle = "",
  ): LexicalNode[] {
    const canonical =
      node.type === "element" ? canonicalDocumentNode(node) : null

    if (canonical?.type === "media") {
      if (formats.length || inheritedStyle)
        throw new DocumentError(["Media text presentation cannot be retained."])

      const output = $createMediaNode(canonical.value)
      setSlots(output, getSlotWrappers(node))

      return [output]
    }

    if (canonical?.type === "math") {
      if (formats.length || inheritedStyle)
        throw new DocumentError(["Math text presentation cannot be retained."])

      return [$createEditorMathNode(canonical.value)]
    }

    if (
      canonical?.type === "footnote-reference" ||
      canonical?.type === "toc" ||
      canonical?.type === "date" ||
      canonical?.type === "drawing" ||
      canonical?.type === "editable-card"
    ) {
      if (formats.length || inheritedStyle)
        throw new DocumentError(["Decorator presentation cannot be retained."])

      const output =
        canonical.type === "footnote-reference"
          ? $applyNodeReplacement(
              new DocumentFootnoteReferenceNode(canonical.value),
            )
          : canonical.type === "toc"
            ? $applyNodeReplacement(new DocumentTocNode())
            : canonical.type === "date"
              ? $applyNodeReplacement(new DocumentDateNode(canonical.value))
              : canonical.type === "drawing"
                ? $applyNodeReplacement(
                    new DocumentDrawingNode(canonical.value),
                  )
                : $applyNodeReplacement(new DocumentEditableCardNode())

      setDocumentState(
        output,
        documentStateSchema.parse(
          node.type === "element" && node.properties.dataEditorState
            ? JSON.parse(String(node.properties.dataEditorState))
            : {},
        ),
      )
      setSlots(output, getSlotWrappers(node))

      return [output]
    }

    if (
      node.type === "text" ||
      canonical?.type === "mention" ||
      canonical?.type === "label"
    ) {
      const textStyle = safeDocumentStyle(
        [inheritedStyle, node.type === "element" ? node.properties.style : ""]
          .filter(Boolean)
          .join("; "),
      )

      const text = (
        canonical?.type === "mention"
          ? $createMentionNode(canonical.value)
          : canonical?.type === "label"
            ? $applyNodeReplacement(new DocumentLabelNode(canonical.value))
            : $createTextNode(node.type === "text" ? node.value : "")
      ).setStyle(textStyle)

      for (const format of new Set(formats)) text.toggleFormat(format)

      const casing =
        /(?:^|;)\s*text-transform:\s*(lowercase|uppercase|capitalize)(?:;|$)/.exec(
          textStyle,
        )?.[1]

      if (
        casing === "lowercase" ||
        casing === "uppercase" ||
        casing === "capitalize"
      )
        text.toggleFormat(casing)
      text.setStyle(
        textStyle
          .replace(/(?:^|;)\s*text-transform:[^;]+/g, "")
          .replace(/^;\s*/, ""),
      )

      return [text]
    }

    if (node.type !== "element")
      throw new DocumentError([`Unsupported node: ${node.type}.`])

    if (canonical?.type === "slot")
      throw new DocumentError(["Document slot must attach to its host."])

    const tag = node.tagName

    const style = safeDocumentStyle(
      [inheritedStyle, node.properties.style ?? ""].filter(Boolean).join("; "),
    )

    const format = textFormats.get(tag)

    if (
      [
        "span",
        "b",
        "strong",
        "em",
        "i",
        "u",
        "s",
        "del",
        "code",
        "sub",
        "sup",
        "mark",
      ].includes(tag)
    )
      return node.children.flatMap((child) =>
        convert(child, format ? [...formats, format] : formats, style),
      )

    if (["thead", "tbody", "tfoot"].includes(tag))
      return node.children
        .filter((child) => !(child.type === "text" && !child.value.trim()))
        .flatMap((child) => convert(child, formats, style))

    if (node.properties.dataEditorFootnoteBacklink !== undefined) return []

    if (
      ["input", "colgroup"].includes(tag) ||
      node.properties.dataEditorToggleControl !== undefined
    )
      return []

    if (node.properties.dataEditorToggleContent !== undefined)
      return node.children.flatMap((child) => convert(child, formats, style))

    if (tag === "br") return [$createLineBreakNode()]

    if (tag === "hr") {
      if (
        node.children.length ||
        Object.keys(node.properties).length ||
        formats.length ||
        style
      ) {
        throw new DocumentError([
          "Horizontal rule presentation requires JSON or is unsupported.",
        ])
      }

      return [$createHorizontalRuleNode()]
    }

    let output: ElementNode

    switch (tag) {
      case "aside": {
        const appearance = String(node.properties.dataAppearance ?? "")
        const icon = String(node.properties.dataIcon ?? "")

        if (
          !isEditorCalloutAppearance(appearance) ||
          !isEditorCalloutIcon(icon)
        )
          throw new DocumentError(["Invalid callout metadata."])
        output = $applyNodeReplacement(new CalloutNode(appearance, icon))
        break
      }

      case "section":
      case "details": {
        const body = node.children.find(
          (child) =>
            child.type === "element" &&
            child.properties.dataEditorToggleBody !== undefined,
        )

        output =
          node.properties.dataEditorToggleBody !== undefined
            ? $applyNodeReplacement(new ToggleBodyNode())
            : $applyNodeReplacement(
                new ToggleNode(
                  Boolean(
                    tag === "section" && body?.type === "element"
                      ? body.properties.open
                      : node.properties.open,
                  ),
                ),
              )
        break
      }

      case "summary":
        if (node.properties.ariaLabel && textOf(node).trim())
          throw new DocumentError([
            "Custom summary accessible names are unsupported.",
          ])

        output = $applyNodeReplacement(new ToggleSummaryNode())
        break
      case "div":
        output =
          canonical?.type === "footnote-definition"
            ? $applyNodeReplacement(
                new DocumentFootnoteDefinitionNode(canonical.value),
              )
            : canonical?.type === "columns-group"
              ? $applyNodeReplacement(
                  new DocumentColumnsGroupNode(canonical.value),
                )
              : canonical?.type === "column"
                ? $applyNodeReplacement(new DocumentColumnNode())
                : node.properties.dataEditorToggleSummary !== undefined
                  ? $applyNodeReplacement(new ToggleSummaryNode())
                  : $applyNodeReplacement(new ToggleBodyNode())
        break
      case "p":
        output = $createParagraphNode()
        break
      case "h1":
      case "h2":
      case "h3":
      case "h4":
      case "h5":
      case "h6":
        output = $createHeadingNode(tag)
        break
      case "blockquote":
        output = $createQuoteNode()
        break
      case "pre": {
        const code = node.children.find(
          (child) => child.type === "element" && child.tagName === "code",
        )

        const classes =
          code?.type === "element" ? code.properties.className : undefined

        const language = Array.isArray(classes)
          ? String(classes[0] ?? "").replace(/^language-/, "")
          : undefined

        output = $createCodeNode(language)
        break
      }

      case "a": {
        const url = String(node.properties.href ?? "")

        if (!safeDocumentURL(url)) throw new DocumentError(["Unsafe link URL."])

        const rel = Array.isArray(node.properties.rel)
          ? node.properties.rel.join(" ")
          : String(node.properties.rel ?? "")

        output = $createLinkNode(url, {
          title: node.properties.title ? String(node.properties.title) : null,
          target: node.properties.target
            ? String(node.properties.target)
            : null,
          rel:
            node.properties.target === "_blank"
              ? [
                  ...new Set([
                    ...rel.split(/[\t\n\f\r ]+/).filter(Boolean),
                    "noreferrer",
                    "noopener",
                  ]),
                ].join(" ")
              : rel || null,
        })
        break
      }

      case "ul":
      case "ol": {
        const listType = documentListType(node)

        const start =
          node.properties.start === undefined
            ? 1
            : parseEditorListStartHTML(String(node.properties.start))

        if (!listType || start === undefined)
          throw new DocumentError(["Invalid list metadata."])

        output = $createListNode(listType, start)
        break
      }

      case "li": {
        const task = node.children.find(
          (child) => child.type === "element" && child.tagName === "input",
        )

        output = $createListItemNode(
          task?.type === "element"
            ? Boolean(task.properties.checked)
            : undefined,
        )
        break
      }

      case "table":
        output = $createTableNode()
        break
      case "tr":
        output = $createTableRowNode()
        break
      case "td":
      case "th":
        output = $createTableCellNode(
          tag === "th" ? 1 : 0,
          Number(node.properties.colSpan ?? 1),
        ).setRowSpan(Number(node.properties.rowSpan ?? 1))
        break
      default:
        throw new DocumentError([`Unsupported HTML element: ${tag}.`])
    }

    const blockCSS = new Map(
      style
        .split(";")
        .filter(Boolean)
        .map((part) => {
          const colon = part.indexOf(":")

          return [part.slice(0, colon).trim(), part.slice(colon + 1).trim()]
        }),
    )

    const blockPresentation =
      blockCSS.has("line-height") || blockCSS.has("text-indent")
        ? {
            lineHeight: blockCSS.get("line-height") ?? "",
            textIndent: blockCSS.get("text-indent") ?? "",
          }
        : undefined

    const stateInput = documentStateSchema.parse(
      node.properties.dataEditorState
        ? JSON.parse(String(node.properties.dataEditorState))
        : {},
    )

    if (canonical?.type === "diagram") {
      if (stateInput.editorDiagram !== undefined)
        throw new DocumentError(["Conflicting editor diagram metadata."])
      stateInput.editorDiagram = canonical.value
    }

    const listMarker = documentListMarker(node)

    if (listMarker !== undefined) stateInput.yopemListMarker = listMarker

    if (blockPresentation)
      stateInput.editorBlockPresentation = blockPresentation

    if (node.properties.dataEditorBlockPresentation)
      stateInput.editorBlockPresentation =
        documentStateSchema.shape.editorBlockPresentation.parse(
          JSON.parse(String(node.properties.dataEditorBlockPresentation)),
        )

    if (node.properties.dataEditorBorder)
      stateInput.yopemTableBorder = parseTableBorderHTML(
        String(node.properties.dataEditorBorder),
      )
    const state = documentStateSchema.parse(stateInput)
    setDocumentState(output, state)

    if (node.properties.dataEditorTextFormat !== undefined)
      output.setTextFormat(Number(node.properties.dataEditorTextFormat))

    if (node.properties.dataEditorTextStyle !== undefined)
      output.setTextStyle(String(node.properties.dataEditorTextStyle))

    if (node.properties.dataEditorIndent !== undefined)
      output.setIndent(Number(node.properties.dataEditorIndent))

    if ($isTableNode(output)) {
      const columns = node.children.find(
        (child) => child.type === "element" && child.tagName === "colgroup",
      )

      if (
        columns?.type === "element" &&
        columns.children.some(
          (column) => column.type === "element" && column.properties.style,
        )
      ) {
        const widths = columns.children
          .filter(
            (child) => child.type === "element" && child.tagName === "col",
          )
          .map((child) =>
            child.type === "element"
              ? Number.parseFloat(
                  String(child.properties.style).split(":")[1] ?? "",
                )
              : 0,
          )

        if (
          node.properties.dataEditorColWidths &&
          JSON.stringify(widths) !== String(node.properties.dataEditorColWidths)
        )
          throw new DocumentError(["Conflicting column widths."])
        output.setColWidths(widths)
      }

      if (node.properties.dataEditorColWidths)
        output.setColWidths(
          JSON.parse(String(node.properties.dataEditorColWidths)),
        )
      output.setRowStriping(
        (node.properties.dataEditorRowStriping ??
          node.properties.dataLexicalRowStriping) === "true",
      )
      output.setFrozenColumns(
        Number(
          node.properties.dataEditorFrozenColumns ??
            (node.properties.dataLexicalFrozenColumn === "true" ? 1 : 0),
        ),
      )
      output.setFrozenRows(
        Number(
          node.properties.dataEditorFrozenRows ??
            (node.properties.dataLexicalFrozenRow === "true" ? 1 : 0),
        ),
      )
    }

    const storedStyle = style
      .split(";")
      .filter(
        (part) =>
          !/^\s*(?:line-height|text-indent|padding-inline-start|text-align):/.test(
            part,
          ) &&
          !(
            (tag === "ul" || tag === "ol") &&
            /^\s*list-style-type:/.test(part)
          ) &&
          !(tag === "tr" && /^\s*height:/.test(part)) &&
          !(
            tag === "table" && /^\s*(?:table-layout|inline-size):/.test(part)
          ) &&
          !(
            ["td", "th"].includes(tag) &&
            /^\s*(?:width|background-color|vertical-align|min-inline-size|overflow-wrap|border(?:-[a-z-]+)?):/.test(
              part,
            )
          ),
      )
      .join(";")

    if (storedStyle.trim())
      throw new DocumentError([
        "Unpersisted native element style cannot be imported.",
      ])

    const declarations = new Map(
      style
        .split(";")
        .filter(Boolean)
        .map((declaration) => {
          const separator = declaration.indexOf(":")

          return [
            declaration.slice(0, separator).trim(),
            declaration.slice(separator + 1).trim(),
          ]
        }),
    )

    if ($isTableCellNode(output)) {
      if (node.properties.dataEditorHeaderState !== undefined)
        output.setHeaderStyles(Number(node.properties.dataEditorHeaderState))
      const width = declarations.get("width")
      const background = declarations.get("background-color")

      if (width) output.setWidth(Number.parseFloat(width))
      const vertical = declarations.get("vertical-align")

      if (vertical === "middle" || vertical === "bottom")
        output.setVerticalAlign(vertical)

      if (background) output.setBackgroundColor(background)
    }

    if ($isTableRowNode(output)) {
      const height = declarations.get("height")

      const metadata = node.properties.dataEditorRowHeight

      const parsed = parseTableRowHeightHTML(
        metadata === undefined
          ? (height?.slice(0, -2) ?? null)
          : String(metadata),
      )

      if (parsed !== undefined) output.setHeight(parsed)
    }

    const textAlignment = blockCSS.get("text-align")

    if (
      textAlignment === "left" ||
      textAlignment === "right" ||
      textAlignment === "center" ||
      textAlignment === "justify" ||
      textAlignment === "start" ||
      textAlignment === "end"
    )
      output.setFormat(textAlignment)

    if (
      node.properties.align === "left" ||
      node.properties.align === "right" ||
      node.properties.align === "center"
    )
      output.setFormat(node.properties.align)

    if (node.properties.dir === "ltr" || node.properties.dir === "rtl")
      output.setDirection(node.properties.dir)

    const codeElement =
      tag === "pre"
        ? node.children.find(
            (child) => child.type === "element" && child.tagName === "code",
          )
        : undefined

    const childContent =
      tag === "pre"
        ? [
            {
              type: "text" as const,
              value:
                codeElement?.type === "element"
                  ? textOf(codeElement)
                  : textOf(node),
            },
          ]
        : node.children

    const slots = node.children.filter(isSlotWrapper)

    append(
      output,
      childContent
        .filter((child) => !isSlotWrapper(child))
        .filter(
          (child) =>
            !(
              child.type === "text" &&
              !child.value.trim() &&
              ((child.value.includes("\n") &&
                ["ul", "ol", "li", "blockquote", "table", "tr"].includes(
                  tag,
                )) ||
                ["section", "details"].includes(tag))
            ),
        )
        .flatMap((child) => convert(child, formats, "")),
    )
    setSlots(output, slots)

    return [output]
  }

  const root = $getRoot().clear()
  const rootSlots = tree.children.filter(isSlotWrapper)
  append(
    root,
    tree.children
      .filter((child) => !isSlotWrapper(child))
      .filter((child) => !(child.type === "text" && !child.value.trim()))
      .flatMap((child) => convert(child)),
  )
  setSlots(root, rootSlots)

  if (root.getChildrenSize() === 0) root.append($createParagraphNode())
}

const unlinkedAutoLinks = new WeakSet<Element>()

export function $exportTree(markdown = false): Root {
  const root = $getRoot()

  if (Object.keys(getDocumentState(root)).length)
    throw new DocumentError(["Root NodeState requires JSON export."])

  const footnoteReferences: {
    key: string
    identifier: string
    number: number
    id: string
  }[] = []

  const footnoteDefinitions = new Map<string, string[]>()
  const definitionKeys = new Map<string, string>()
  let footnoteReferenceNumber = 0
  let footnoteDefinitionNumber = 0
  let headingNumber = 0
  const headingIds = new Map<string, string>()
  const headings: { id: string; text: string }[] = []
  let tocPresent = false

  function collect(node: LexicalNode) {
    const slots = $getSlotNames(node)

    if (
      slots.length > 0 &&
      ((!$isElementNode(node) && !(node instanceof MediaNode)) ||
        ($isElementNode(node) && node.isInline()))
    )
      throw new DocumentError(["Document slots need a supported block host."])

    if (node.getType() === "editor-footnote-reference") {
      footnoteReferenceNumber += 1

      const identifier = parseEditorFootnoteReferenceNode(
        node.exportJSON(),
      ).identifier

      footnoteReferences.push({
        key: node.getKey(),
        identifier,
        number: footnoteReferenceNumber,
        id: `yopem-footnote-reference-${identifier}-${footnoteReferenceNumber}`,
      })
    }

    if (node.getType() === "editor-footnote-definition") {
      footnoteDefinitionNumber += 1

      const identifier = parseEditorFootnoteDefinitionNode(
        node.exportJSON(),
      ).identifier

      const id = `yopem-footnote-definition-${identifier}-${footnoteDefinitionNumber}`
      const ids = footnoteDefinitions.get(identifier) ?? []
      ids.push(id)
      footnoteDefinitions.set(identifier, ids)
      definitionKeys.set(node.getKey(), id)
    }

    if (node.getType() === "editor-toc") {
      editorTocNodeSchema.parse(node.exportJSON())
      tocPresent = true
    }

    if ($isElementNode(node))
      for (const child of node.getChildren()) collect(child)

    for (const name of slots) {
      const value = $getSlot(node, name)

      if (!value)
        throw new DocumentError(["Document slot needs one block node."])
      collect(value)
    }
  }

  collect(root)

  function collectHeadings(node: LexicalNode) {
    if ($isElementNode(node)) {
      if ($isHeadingNode(node)) {
        headingNumber += 1
        const id = createEditorTocHeadingId("document", String(headingNumber))
        headingIds.set(node.getKey(), id)
        headings.push({ id, text: node.getTextContent() })
      }

      for (const child of node.getChildren()) collectHeadings(child)
    }

    for (const name of $getSlotNames(node)) {
      const value = $getSlot(node, name)

      if (!value)
        throw new DocumentError(["Document slot needs one block node."])
      collectHeadings(value)
    }
  }

  if (tocPresent) collectHeadings(root)

  interface FootnoteReferenceOutput {
    id: string
    number: number
    definitionId?: string
  }

  const referenceOutput = new Map<string, FootnoteReferenceOutput>()

  const referencesByIdentifier = new Map<
    string,
    { id: string; number: number }[]
  >()

  for (const reference of footnoteReferences) {
    const definitionId = footnoteDefinitions.get(reference.identifier)?.[0]

    const info: FootnoteReferenceOutput = {
      id: reference.id,
      number: reference.number,
    }

    if (definitionId) info.definitionId = definitionId
    referenceOutput.set(reference.key, info)
    const references = referencesByIdentifier.get(reference.identifier) ?? []
    references.push({ id: reference.id, number: reference.number })
    referencesByIdentifier.set(reference.identifier, references)
  }

  function slotElements(node: LexicalNode) {
    return $getSlotNames(node).map((name) => {
      const value = $getSlot(node, name)

      if (
        !value ||
        (!$isElementNode(value) && !(value instanceof DecoratorNode)) ||
        ($isElementNode(value) && value.isInline()) ||
        (value instanceof DecoratorNode && value.isInline())
      )
        throw new DocumentError(["Document slot needs one block node."])

      return element("div", [convert(value)], { dataEditorSlot: name })
    })
  }

  function convert(node: LexicalNode): ElementContent {
    const state = getDocumentState(node)

    if (state.codeWrap !== undefined || state.codeLineNumbers !== undefined)
      throw new DocumentError([
        "Native code view metadata requires JSON export.",
      ])

    if (!$isElementNode(node) && Object.keys(state).length)
      throw new DocumentError(["Inline NodeState requires JSON export."])

    if (node instanceof MediaNode) {
      const figure = parseHTMLSyntax(serializeMediaHtml(node.getMedia()))
        .children[0]

      if (figure?.type !== "element")
        throw new DocumentError(["Invalid generated media HTML."])

      return {
        ...figure,
        children: [...figure.children, ...slotElements(node)],
      }
    }

    if (node instanceof EditorMathNode) {
      const value = node.getValue()

      return element(
        value.kind === "inline" ? "span" : "div",
        [{ type: "text", value: value.tex }],
        {
          dataEditorMath: value.kind,
          dataEditorTex: value.tex,
        },
      )
    }

    if (node.getType() === "editor-footnote-reference") {
      const identifier = parseEditorFootnoteReferenceNode(
        node.exportJSON(),
      ).identifier

      const reference = referenceOutput.get(node.getKey())

      if (!reference)
        throw new DocumentError(["Footnote reference metadata is missing."])

      const content: ElementContent = reference.definitionId
        ? element("a", [{ type: "text", value: String(reference.number) }], {
            dataEditorFootnoteReferenceLink: "",
            href: `#${reference.definitionId}`,
            role: "doc-noteref",
          })
        : { type: "text", value: String(reference.number) }

      return element("sup", [content], {
        dataEditorFootnoteReference:
          editorFootnoteReferenceHTMLAttributes(identifier)[
            "data-editor-footnote-reference"
          ],
        id: reference.id,
      })
    }

    if (node.getType() === "editor-toc") {
      editorTocNodeSchema.parse(node.exportJSON())

      return element(
        "nav",
        [
          element(
            "ol",
            headings.map(({ id, text }) =>
              element("li", [
                element("a", [{ type: "text", value: text }], {
                  href: `#${id}`,
                }),
              ]),
            ),
          ),
        ],
        {
          dataEditorToc: editorTocHTMLAttributes()["data-editor-toc"],
          ariaLabel: "Table of contents",
        },
      )
    }

    if (node.getType() === "editor-date") {
      const date = editorDateNodeSchema.parse(node.exportJSON()).date
      const attributes = editorDateHTMLAttributes(date)

      return element("time", [{ type: "text", value: date }], {
        dataEditorDate: attributes["data-editor-date"],
        dateTime: attributes.datetime,
      })
    }

    if (node.getType() === "editor-drawing") {
      const serialized = parseEditorDrawingNode(node.exportJSON())

      const scene = parseEditorDrawingScene({
        elements: serialized.elements,
      })

      const attributes = editorDrawingHTMLAttributes(scene)

      return element(
        "figure",
        [{ type: "text", value: node.getTextContent() }],
        {
          dataEditorDrawing: attributes["data-editor-drawing"],
          dataEditorDrawingScene: attributes["data-editor-drawing-scene"],
          ariaLabel: `Drawing with ${scene.elements.length} elements`,
          role: "group",
        },
      )
    }

    if (node.getType() === "editor-editable-card") {
      editorEditableCardNodeSchema.parse(node.exportJSON())

      return element("figure", [{ type: "text", value: "Editable card" }], {
        dataEditorEditableCard:
          editorEditableCardHTMLAttributes()["data-editor-editable-card"],
        ariaLabel: "Editable card",
      })
    }

    if ($isLineBreakNode(node)) return element("br")

    if ($isHorizontalRuleNode(node)) return element("hr")

    if ($isTextNode(node)) {
      const label =
        node.getType() === "editor-label"
          ? editorLabelNodeSchema.parse(node.exportJSON()).label
          : undefined

      const isLabel = label !== undefined

      if (
        (node.getType() !== "text" &&
          !(node instanceof MentionNode) &&
          !isLabel) ||
        node.getMode() !==
          (node instanceof MentionNode || isLabel ? "token" : "normal") ||
        node.getDetail() !== 0 ||
        node.getFormat() > 2047
      )
        throw new DocumentError(["Native text metadata requires JSON export."])

      let output: ElementContent = {
        type: "text",
        value: node.getTextContent(),
      }

      if (node instanceof MentionNode) {
        const identity = node.getIdentity()
        output = element("span", [output], {
          dataMentionId: identity.id,
          dataMentionLabel: identity.label,
        })
      } else if (label !== undefined) {
        output = element("yopem-editor-label", [output], {
          dataEditorLabel: label,
        })
      }

      const tags: [TextFormatType, string][] = [
        ["bold", "strong"],
        ["italic", "em"],
        ["strikethrough", "del"],
        ["code", "code"],
        ["underline", "u"],
        ["subscript", "sub"],
        ["superscript", "sup"],
        ["highlight", "mark"],
      ]

      for (const [format, tag] of tags)
        if (node.hasFormat(format)) {
          output = element(tag, [output])
        }

      const casing = (
        ["lowercase", "uppercase", "capitalize"] satisfies TextFormatType[]
      ).find((format) => node.hasFormat(format))

      const style = safeDocumentStyle(
        [node.getStyle(), casing ? `text-transform: ${casing}` : ""]
          .filter(Boolean)
          .join("; "),
      )

      return style ? element("span", [output], { style }) : output
    }

    if (!$isElementNode(node))
      throw new DocumentError([`Unsupported custom node: ${node.getType()}.`])
    const properties: Element["properties"] = {}

    if (node.getStyle())
      throw new DocumentError([
        "Unpersisted native element style cannot be exported.",
      ])
    const firstText = node.getFirstDescendant()

    if (
      node.getTextFormat() !==
      ($isTextNode(firstText) ? firstText.getFormat() : 0)
    )
      properties.dataEditorTextFormat = node.getTextFormat()

    if (
      node.getTextStyle() !==
      ($isTextNode(firstText) ? firstText.getStyle() : "")
    )
      properties.dataEditorTextStyle = safeDocumentStyle(node.getTextStyle())

    if (
      $isCodeNode(node) &&
      node
        .getChildren()
        .some(
          (child) =>
            !$isTextNode(child) ||
            child.getType() !== "text" ||
            child.getFormat() !== 0 ||
            child.getStyle() ||
            Object.keys(getDocumentState(child)).length,
        )
    )
      throw new DocumentError([
        "Native code token metadata requires JSON export.",
      ])
    let tag: string

    if (node.getType() === "editor-footnote-definition") {
      const id = definitionKeys.get(node.getKey())

      const identifier = parseEditorFootnoteDefinitionNode(
        node.exportJSON(),
      ).identifier

      if (!id)
        throw new DocumentError(["Footnote definition metadata is missing."])

      tag = "div"
      properties.dataEditorFootnoteDefinition =
        editorFootnoteDefinitionHTMLAttributes(identifier)[
          "data-editor-footnote-definition"
        ]
      properties.id = id
      properties.role = "doc-footnote"
    } else if (node.getType() === "editor-columns-group") {
      const group = z
        .object({ layout: z.array(z.number()) })
        .parse(node.exportJSON())

      const attributes = editorColumnsHTMLAttributes(group.layout)
      tag = "div"
      properties.dataEditorColumns = attributes["data-editor-columns"]
      properties.dataEditorColumnsLayout =
        attributes["data-editor-columns-layout"]
    } else if (node.getType() === "editor-column") {
      tag = "div"
      properties.dataEditorColumn = "1"
    } else if (node instanceof CalloutNode) {
      tag = "aside"
      properties.dataEditorCallout = ""
      properties.dataAppearance = node.getAppearance()
      properties.dataIcon = node.getIcon()
    } else if (node instanceof ToggleNode) {
      tag = "section"
      properties.dataEditorToggle = ""
    } else if (node instanceof ToggleSummaryNode) {
      tag = "div"
      properties.dataEditorToggleSummary = ""
    } else if (node instanceof ToggleBodyNode) {
      tag = "details"
      properties.dataEditorToggleBody = ""
      const toggle = node.getParent()

      if (!(toggle instanceof ToggleNode))
        throw new DocumentError(["Orphan toggle body."])
      properties.open = toggle.getOpen()
    } else if ($isParagraphNode(node)) tag = "p"
    else if ($isHeadingNode(node)) {
      tag = node.getTag()
      const id = headingIds.get(node.getKey())

      if (id) properties.id = id
    } else if ($isQuoteNode(node)) tag = "blockquote"
    else if ($isCodeNode(node)) tag = "pre"
    else if ($isLinkNode(node)) {
      if ($isAutoLinkNode(node) && node.getIsUnlinked()) {
        tag = "span"
      } else {
        tag = "a"

        if (!safeDocumentURL(node.getURL()))
          throw new DocumentError(["Unsafe link URL."])
        properties.href = node.getURL()
        const title = node.getTitle()

        if (title) properties.title = title

        if (node.getTarget()) properties.target = node.getTarget() ?? undefined

        if (node.getRel()) properties.rel = node.getRel()?.split(/\s+/)
      }
    } else if ($isListNode(node)) {
      tag = node.getListType() === "number" ? "ol" : "ul"

      if (state.yopemListMarker !== undefined)
        properties.dataEditorListMarker = state.yopemListMarker

      if (tag === "ol" && node.getStart() !== 1)
        properties.start = node.getStart()
    } else if ($isListItemNode(node)) tag = "li"
    else if ($isTableNode(node)) {
      const widths = node.getColWidths()

      if (widths?.length) {
        properties.dataEditorColWidths = JSON.stringify(widths)
        properties.style = `table-layout: fixed; inline-size: ${widths.reduce((sum, width) => sum + width, 0)}px`
      }

      if (node.getRowStriping()) properties.dataEditorRowStriping = "true"

      if (node.getSerializedFrozenColumnCount())
        properties.dataEditorFrozenColumns =
          node.getSerializedFrozenColumnCount()

      if (node.getSerializedFrozenRowCount())
        properties.dataEditorFrozenRows = node.getSerializedFrozenRowCount()
      tag = "table"
    } else if ($isTableRowNode(node)) {
      tag = "tr"
      const height = node.getHeight()

      if (height !== undefined) properties.dataEditorRowHeight = String(height)
    } else if ($isTableCellNode(node)) {
      tag = node.getHeaderStyles() ? "th" : "td"

      if (node.getHeaderStyles() > 1)
        properties.dataEditorHeaderState = node.getHeaderStyles()

      if (node.getColSpan() !== 1) properties.colSpan = node.getColSpan()

      if (node.getRowSpan() !== 1) properties.rowSpan = node.getRowSpan()

      const cellStyles: string[] = []

      if (node.getParents().find($isTableNode)?.getColWidths()?.length)
        cellStyles.push("min-inline-size: 0; overflow-wrap: anywhere")

      if (node.getSerializedVerticalAlign())
        cellStyles.push(`vertical-align: ${node.getSerializedVerticalAlign()}`)

      if (node.getWidth() !== undefined)
        cellStyles.push(`width: ${node.getWidth()}px`)

      if (node.getBackgroundColor())
        cellStyles.push(`background-color: ${node.getBackgroundColor()}`)

      if (cellStyles.length)
        properties.style = safeDocumentStyle(cellStyles.join("; "))
    } else
      throw new DocumentError([`Unsupported custom node: ${node.getType()}.`])

    const extraState = Object.fromEntries(
      Object.entries(state).filter(
        ([key]) =>
          ![
            "editorBlockPresentation",
            "yopemTableBorder",
            "yopemListMarker",
            "editorDiagram",
          ].includes(key),
      ),
    )

    if (Object.keys(extraState).length)
      properties.dataEditorState = JSON.stringify(extraState).replace(
        /[\u007f-\u009f]|\p{Noncharacter_Code_Point}/gu,
        (character) =>
          character
            .split("")
            .map(
              (unit) =>
                `\\u${unit.charCodeAt(0).toString(16).padStart(4, "0")}`,
            )
            .join(""),
      )

    if (
      $isCodeNode(node) &&
      state.editorDiagram !== undefined &&
      state.editorDiagram !== null
    ) {
      const diagram = parseEditorDiagramMetadata(state.editorDiagram)

      const language = diagram
        ? {
            mermaid: "mermaid",
            plantuml: "plant-uml",
            graphviz: "dot",
            flowchart: "text",
          }[diagram.kind]
        : undefined

      if (!diagram || node.getLanguage() !== language)
        throw new DocumentError(["Invalid editor diagram metadata."])
      validateEditorDiagramSource(node.getTextContent())
      properties.dataEditorDiagram = "1"
      properties.dataEditorDiagramKind = diagram.kind
      properties.dataEditorDiagramView = diagram.viewMode
    }

    const presentation = state.editorBlockPresentation

    if (presentation)
      properties.dataEditorBlockPresentation = JSON.stringify(presentation)

    if (state.yopemTableBorder)
      properties.dataEditorBorder =
        state.yopemTableBorder === "solid" ||
        state.yopemTableBorder === "hidden"
          ? state.yopemTableBorder
          : JSON.stringify(state.yopemTableBorder)

    const indent =
      $isListItemNode(node) &&
      node.getIndent() === node.getParents().filter($isListNode).length - 1
        ? 0
        : node.getIndent()

    if (indent) properties.dataEditorIndent = indent

    const style = safeDocumentStyle(
      [
        node.getStyle(),
        presentation?.lineHeight
          ? `line-height: ${presentation.lineHeight}`
          : "",
        presentation?.textIndent
          ? `text-indent: ${presentation.textIndent}`
          : "",
        state.yopemListMarker
          ? `list-style-type: ${state.yopemListMarker}`
          : "",
        indent ? `padding-inline-start: ${indent * 2}em` : "",
      ]
        .filter(Boolean)
        .join("; "),
    )

    const rowStyle =
      $isTableRowNode(node) && node.getHeight() !== undefined
        ? `height: ${node.getHeight()}px`
        : ""

    const combinedStyle = [properties.style, style, rowStyle]
      .filter(Boolean)
      .join("; ")

    if (combinedStyle) properties.style = safeDocumentStyle(combinedStyle)
    const direction = node.getDirection()

    if (direction) properties.dir = direction
    const alignment = node.getFormatType()

    if (alignment && $isTableNode(node)) {
      if (!["left", "center", "right"].includes(alignment))
        throw new DocumentError([
          "Unsupported table alignment requires JSON export.",
        ])
      properties.align = alignment
    }

    if (alignment && !$isTableNode(node))
      properties.style = safeDocumentStyle(
        `${combinedStyle}; text-align: ${alignment}`,
      )

    if (markdown && $isTableCellNode(node) && !combinedStyle && alignment) {
      properties.align = alignment
      delete properties.style
    }

    const children = $isCodeNode(node)
      ? [
          element(
            "code",
            [{ type: "text", value: node.getTextContent() }],
            node.getLanguage()
              ? { className: [`language-${node.getLanguage()}`] }
              : {},
          ),
        ]
      : node.getChildren().map(convert)

    if (node.getType() === "editor-footnote-definition") {
      const identifier = parseEditorFootnoteDefinitionNode(
        node.exportJSON(),
      ).identifier

      const references = referencesByIdentifier.get(identifier) ?? []

      for (const reference of references)
        children.push(
          element("a", [{ type: "text", value: `↩ ${reference.number}` }], {
            dataEditorFootnoteBacklink: "",
            href: `#${reference.id}`,
          }),
        )
    }

    children.push(...slotElements(node))

    if ($isTableNode(node) && node.getColWidths()?.length)
      children.unshift(
        element(
          "colgroup",
          node
            .getColWidths()
            ?.map((width) =>
              element("col", [], { style: `width: ${width}px` }),
            ) ?? [],
        ),
      )

    if ($isListItemNode(node) && node.getChecked() !== undefined)
      children.unshift(
        element("input", [], {
          type: "checkbox",
          disabled: true,
          checked: node.getChecked(),
        }),
      )

    if (node instanceof ToggleBodyNode) {
      const toggle = node.getParent()

      if (!(toggle instanceof ToggleNode))
        throw new DocumentError(["Orphan toggle body."])

      return element(
        tag,
        [
          element("summary", [], {
            dataEditorToggleControl: "",
            contentEditable: "false",
            ariaLabel:
              toggle.getSummary().getTextContent().trim() || "Toggle content",
          }),
          element("div", children, { dataEditorToggleContent: "" }),
        ],
        properties,
      )
    }

    const output = element(tag, children, properties)

    if (markdown && $isAutoLinkNode(node) && node.getIsUnlinked())
      unlinkedAutoLinks.add(output)

    return output
  }

  return {
    type: "root",
    children: [...root.getChildren().map(convert), ...slotElements(root)],
  }
}

export function typesetDocumentTree(tree: Root): Root {
  function display(node: RootContent): ElementContent {
    if (node.type === "text" || node.type === "comment") return node

    if (node.type !== "element")
      throw new DocumentError(["Unsupported document markup."])
    const canonical = canonicalDocumentNode(node)

    return {
      ...node,
      children:
        canonical?.type === "math"
          ? documentMathChildren(canonical.value)
          : node.children.map(display),
    }
  }

  return { ...tree, children: tree.children.map(display) }
}

export function treeHTML(tree: Root, typeset = true) {
  const html = toHtml(typeset ? typesetDocumentTree(tree) : tree)

  if (html.includes("\r"))
    throw new DocumentError(["Carriage-return text requires JSON export."])
  parseHTMLSyntax(html)

  return html
}

function markdownInertAutoLink(node: Element) {
  return toHtml(node)
    .replaceAll(":", "&#58;")
    .replaceAll("@", "&#64;")
    .replaceAll(".", "&#46;")
}

function markdownFallback(tree: Root, source: string) {
  let output = source

  function visit(node: RootContent) {
    if (node.type !== "element") return

    if (unlinkedAutoLinks.has(node)) {
      output = output.replaceAll(toHtml(node), markdownInertAutoLink(node))

      return
    }

    for (const child of node.children) visit(child)
  }

  for (const node of tree.children) visit(node)

  return `${output.replaceAll("\n", "&#10;")}\n`
}

export function treeMarkdown(tree: Root) {
  const html = treeHTML(tree, false)
  let hasMath = false

  function needsHTML(node: RootContent, preformatted = false): boolean {
    if (node.type === "text")
      return !preformatted && /[\t\n\f$]| {2}/.test(node.value)

    if (node.type !== "element") return false

    if (unlinkedAutoLinks.has(node)) return true

    const canonical = canonicalDocumentNode(node)

    if (canonical?.type === "math") {
      hasMath = true

      return mathMarkdown(canonical.value) === null
    }

    if (canonical?.type === "media") return true

    if (canonical && !["math", "media", "mention"].includes(canonical.type))
      return true

    if (canonical?.type === "mention") return Boolean(node.properties.style)
    const literalWhitespace = preformatted || node.tagName === "pre"
    const first = node.children[0]
    const last = node.children.at(-1)

    if (
      !literalWhitespace &&
      ((first?.type === "text" && /^\s/.test(first.value)) ||
        (last?.type === "text" && /\s$/.test(last.value)))
    )
      return true

    if (["u", "sub", "sup", "mark"].includes(node.tagName)) return true

    if (node.tagName === "table" && node.properties.align) return true

    if (
      node.tagName === "code" &&
      node.children.some((child) => child.type === "element")
    )
      return true

    if (
      Object.keys(node.properties).some(
        (key) =>
          ![
            "href",
            "title",
            "className",
            "type",
            "disabled",
            "checked",
            "align",
          ].includes(key),
      )
    )
      return true

    if (
      ["td", "th"].includes(node.tagName) &&
      (node.children.length !== 1 ||
        node.children[0]?.type !== "element" ||
        node.children[0].tagName !== "p")
    )
      return true

    return node.children.some((child, index) => {
      const next = node.children[index + 1]

      if (
        node.tagName === "li" &&
        child.type === "text" &&
        child.value.endsWith("\n") &&
        next?.type === "element" &&
        (next.tagName === "ul" || next.tagName === "ol")
      )
        return needsHTML(
          { ...child, value: child.value.slice(0, -1) },
          literalWhitespace,
        )

      return needsHTML(child, literalWhitespace)
    })
  }

  if (tree.children.some((node) => needsHTML(node)))
    return markdownFallback(tree, html)

  function flatten(node: RootContent) {
    if (node.type !== "element") return

    if (["td", "th"].includes(node.tagName))
      node.children = node.children.flatMap((child) =>
        child.type === "element" && child.tagName === "p"
          ? child.children
          : [child],
      )

    for (const child of node.children) flatten(child)
  }

  for (const node of tree.children) flatten(node)

  const processor = unified()
    .use(rehypeRemark, {
      handlers: {
        div(state, node) {
          const canonical = canonicalDocumentNode(node)

          if (canonical?.type === "math")
            return {
              type: "html",
              value: mathMarkdown(canonical.value) ?? toHtml(node),
            }

          return state.all(node)
        },
        span(state, node) {
          const canonical = canonicalDocumentNode(node)

          if (unlinkedAutoLinks.has(node))
            return { type: "html", value: markdownInertAutoLink(node) }

          if (canonical?.type === "math")
            return {
              type: "html",
              value: mathMarkdown(canonical.value) ?? toHtml(node),
            }

          if (canonical?.type === "mention")
            return { type: "html", value: mentionMarkdown(canonical.value) }

          return state.all(node)
        },
      },
    })
    .use(remarkGfm)
    .use(remarkStringify)

  const output = processor.stringify(processor.runSync(tree))

  if (hasMath) {
    function snapshot(input: Root) {
      const editor = createDocumentEditor()
      editor.update(() => $importTree(input), { discrete: true })

      return JSON.stringify(editor.getEditorState().toJSON())
    }

    try {
      if (snapshot(tree) !== snapshot(markdownTree(output)))
        return markdownFallback(tree, html)
    } catch {
      return markdownFallback(tree, html)
    }
  }

  return output
}

function mathMarkdown(value: EditorMathValue) {
  try {
    if (
      value.tex.includes("|") ||
      value.tex.includes("\r") ||
      (value.kind === "inline" && value.tex.includes("\n"))
    )
      return null
    const fragment = editorMathToMarkdown(value)
    const tree = unified().use(remarkParse).use(remarkMath).parse(fragment)
    const children: MarkdownFeatureNode[] = tree.children
    const first = children[0]
    const math = first?.type === "paragraph" ? first.children?.[0] : first

    if (
      children.length !== 1 ||
      (first?.type === "paragraph" && first.children?.length !== 1) ||
      math?.type !== (value.kind === "inline" ? "inlineMath" : "math") ||
      !("value" in math) ||
      math.value !== value.tex ||
      (math.type === "math" && math.meta)
    )
      return null

    return fragment
  } catch {
    return null
  }
}
