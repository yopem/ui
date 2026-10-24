import type { Element, ElementContent, Root, RootContent } from "hast"
import type { ElementNode, LexicalNode, TextFormatType } from "lexical"

import {
  $createCodeNode,
  $isCodeNode,
  CodeNode,
  CodeHighlightNode,
} from "@lexical/code"
import { createHeadlessEditor } from "@lexical/headless"
import { $createLinkNode, $isLinkNode, LinkNode } from "@lexical/link"
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
import {
  parseTableBorderHTML,
  parseTableRowHeightHTML,
} from "@yopem-ui/editor/table-presentation-schema"
import { toHtml } from "hast-util-to-html"
import {
  $applyNodeReplacement,
  $createLineBreakNode,
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $isElementNode,
  $isLineBreakNode,
  $isParagraphNode,
  $isTextNode,
} from "lexical"
import rehypeRemark from "rehype-remark"
import remarkGfm from "remark-gfm"
import remarkParse from "remark-parse"
import remarkRehype from "remark-rehype"
import remarkStringify from "remark-stringify"
import { unified } from "unified"

import {
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
  getDocumentState,
  setDocumentState,
  documentStateSchema,
} from "./state"

export const documentNodes = [
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
  TableNode,
  TableRowNode,
  TableCellNode,
]

export function createDocumentEditor() {
  return createHeadlessEditor({
    namespace: "yopem-document",
    nodes: documentNodes,
    onError(error) {
      throw error
    },
  })
}

export function markdownTree(source: string): Root {
  checkText(source)

  if (source.includes("\0"))
    throw new DocumentError(["Markdown source contains a NULL character."])
  const parser = unified().use(remarkParse).use(remarkGfm)
  const tree = parser.parse(source)
  checkTree(tree)

  const unsupported = new Set([
    "image",
    "imageReference",
    "footnoteDefinition",
    "footnoteReference",
    "thematicBreak",
  ])

  function visit(node: {
    type: string
    children?: readonly { type: string }[]
  }) {
    if (unsupported.has(node.type))
      throw new DocumentError([
        `Unsupported Markdown node: ${node.type}. HTML, MDX and footnotes are not evaluated.`,
      ])

    for (const child of node.children ?? []) visit(child)
  }

  visit(tree)

  const hast = unified()
    .use(remarkRehype, { allowDangerousHtml: true })
    .runSync(tree)

  const parsed = parseHTMLSyntax(toHtml(hast, { allowDangerousHtml: true }))

  return validateHTMLTree(parsed, true)
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
      ($isTableCellNode(parent) || parent.getType() === "root") &&
      (!$isElementNode(child) || child.isInline())
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
  function convert(
    node: RootContent,
    formats: readonly TextFormatType[] = [],
    inheritedStyle = "",
  ): LexicalNode[] {
    if (node.type === "text") {
      const text = $createTextNode(node.value).setStyle(inheritedStyle)

      for (const format of new Set(formats)) text.toggleFormat(format)

      const casing =
        /(?:^|;)\s*text-transform:\s*(lowercase|uppercase|capitalize)(?:;|$)/.exec(
          inheritedStyle,
        )?.[1]

      if (
        casing === "lowercase" ||
        casing === "uppercase" ||
        casing === "capitalize"
      )
        text.toggleFormat(casing)
      text.setStyle(
        inheritedStyle
          .replace(/(?:^|;)\s*text-transform:[^;]+/g, "")
          .replace(/^;\s*/, ""),
      )

      return [text]
    }

    if (node.type !== "element")
      throw new DocumentError([`Unsupported node: ${node.type}.`])
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

    if (
      ["input", "colgroup"].includes(tag) ||
      node.properties.dataEditorToggleControl !== undefined
    )
      return []

    if (node.properties.dataEditorToggleContent !== undefined)
      return node.children.flatMap((child) => convert(child, formats, style))

    if (tag === "br") return [$createLineBreakNode()]
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
          node.properties.dataEditorToggleSummary !== undefined
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
        const tasks = node.children.some(
          (child) =>
            child.type === "element" &&
            child.children.some(
              (item) => item.type === "element" && item.tagName === "input",
            ),
        )

        output = $createListNode(
          tasks ? "check" : tag === "ol" ? "number" : "bullet",
          Number(node.properties.start ?? 1),
        )
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
    append(
      output,
      (tag === "pre"
        ? [{ type: "text" as const, value: textOf(node) }]
        : node.children
      )
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

    return [output]
  }

  const root = $getRoot().clear()
  append(
    root,
    tree.children
      .filter((child) => !(child.type === "text" && !child.value.trim()))
      .flatMap((child) => convert(child)),
  )

  if (root.getChildrenSize() === 0) root.append($createParagraphNode())
}

export function $exportTree(markdown = false): Root {
  if (Object.keys(getDocumentState($getRoot())).length)
    throw new DocumentError(["Root NodeState requires JSON export."])

  function convert(node: LexicalNode): ElementContent {
    const state = getDocumentState(node)

    if (state.codeWrap !== undefined || state.codeLineNumbers !== undefined)
      throw new DocumentError([
        "Native code view metadata requires JSON export.",
      ])

    if (!$isElementNode(node) && Object.keys(state).length)
      throw new DocumentError(["Inline NodeState requires JSON export."])

    if ($isLineBreakNode(node)) return element("br")

    if ($isTextNode(node)) {
      if (
        node.getType() !== "text" ||
        node.getMode() !== "normal" ||
        node.getDetail() !== 0
      )
        throw new DocumentError(["Native text metadata requires JSON export."])

      let output: ElementContent = {
        type: "text",
        value: node.getTextContent(),
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

    if (node instanceof CalloutNode) {
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
    else if ($isHeadingNode(node)) tag = node.getTag()
    else if ($isQuoteNode(node)) tag = "blockquote"
    else if ($isCodeNode(node)) tag = "pre"
    else if ($isLinkNode(node)) {
      tag = "a"

      if (!safeDocumentURL(node.getURL()))
        throw new DocumentError(["Unsafe link URL."])
      properties.href = node.getURL()
      const title = node.getTitle()

      if (title) properties.title = title

      if (node.getTarget()) properties.target = node.getTarget() ?? undefined

      if (node.getRel()) properties.rel = node.getRel()?.split(/\s+/)
    } else if ($isListNode(node)) {
      tag = node.getListType() === "number" ? "ol" : "ul"

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
          !["editorBlockPresentation", "yopemTableBorder"].includes(key),
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

    return element(tag, children, properties)
  }

  return { type: "root", children: $getRoot().getChildren().map(convert) }
}

export function treeHTML(tree: Root) {
  const html = toHtml(tree)

  if (html.includes("\r"))
    throw new DocumentError(["Carriage-return text requires JSON export."])
  parseHTMLSyntax(html)

  return html
}

export function treeMarkdown(tree: Root) {
  const html = treeHTML(tree)

  function needsHTML(node: RootContent, preformatted = false): boolean {
    if (node.type === "text")
      return !preformatted && /[\t\n\f]| {2}/.test(node.value)

    if (node.type !== "element") return false
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

  if (tree.children.some((node) => needsHTML(node))) return html + "\n"

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
    .use(rehypeRemark)
    .use(remarkGfm)
    .use(remarkStringify)

  return processor.stringify(processor.runSync(tree))
}
