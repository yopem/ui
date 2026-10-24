import type {
  BaseSelection,
  DOMConversionMap,
  DOMExportOutput,
  LexicalEditor,
  LexicalNode,
  NodeKey,
  SerializedElementNode,
  Spread,
} from "lexical"

import {
  $applyNodeReplacement,
  $isBlockFullySelected,
  $isRangeSelection,
  $setDirectionFromDOM,
  $setFormatFromDOM,
  setNodeIndentFromDOM,
  isHTMLElement,
  ElementNode,
} from "lexical"

import {
  editorColumnsFromHTMLAttributes,
  editorColumnsHTMLAttributes,
  parseEditorColumnsLayout,
  validateEditorColumnsColumnJSON,
  validateEditorColumnsHTML,
  validateEditorColumnsJSON,
  type EditorColumnsLayout,
} from "./columns-model"

export type SerializedEditorColumnsGroupNode = Spread<
  {
    type: "editor-columns-group"
    version: 1
    layout: EditorColumnsLayout
  },
  SerializedElementNode
>

export type SerializedEditorColumnNode = Spread<
  {
    type: "editor-column"
    version: 1
  },
  SerializedElementNode
>

function importElement<T extends ElementNode>(node: T, element: HTMLElement) {
  setNodeIndentFromDOM(element, node)

  return $setFormatFromDOM($setDirectionFromDOM(node, element), element)
}

export class EditorColumnsGroupNode extends ElementNode {
  __layout: EditorColumnsLayout

  static getType() {
    return "editor-columns-group"
  }

  static clone(node: EditorColumnsGroupNode) {
    return new EditorColumnsGroupNode(node.__layout, node.__key)
  }

  constructor(layout: readonly number[] = [50, 50], key?: NodeKey) {
    super(key)
    this.__layout = parseEditorColumnsLayout(layout)
  }

  getLayout() {
    return [...this.getLatest().__layout]
  }

  setLayout(value: readonly number[]) {
    this.getWritable().__layout = parseEditorColumnsLayout(value)

    return this
  }

  createDOM() {
    const element = document.createElement("div")

    this.applyLayout(element)

    return element
  }

  updateDOM(previous: EditorColumnsGroupNode, element: HTMLElement) {
    if (
      previous.__layout.length !== this.__layout.length ||
      previous.__layout.some((width, index) => width !== this.__layout[index])
    )
      this.applyLayout(element)

    return false
  }

  exportJSON(): SerializedEditorColumnsGroupNode {
    return {
      ...super.exportJSON(),
      type: "editor-columns-group",
      version: 1,
      layout: this.getLayout(),
    }
  }

  static importJSON(value: SerializedEditorColumnsGroupNode) {
    validateEditorColumnsJSON({
      root: { type: "root", children: [value] },
    })

    return $applyNodeReplacement(
      new EditorColumnsGroupNode(value.layout),
    ).updateFromJSON(value)
  }

  exportDOM(editor: LexicalEditor): DOMExportOutput {
    const output = super.exportDOM(editor)

    if (isHTMLElement(output.element)) {
      const layout = this.getLayout()

      this.applyLayout(output.element)
      output.element.style.display = "grid"
      output.element.style.gap = "0.75rem"
      output.element.style.gridTemplateColumns = layout
        .map((width) => `${width}fr`)
        .join(" ")
    }

    return output
  }

  static importDOM(): DOMConversionMap {
    function convert(element: HTMLElement) {
      return element.hasAttribute("data-editor-columns")
        ? {
            priority: 4 as const,
            conversion(dom: HTMLElement) {
              validateEditorColumnsHTML(dom.parentElement ?? dom)

              const layout = editorColumnsFromHTMLAttributes({
                "data-editor-columns": dom.getAttribute("data-editor-columns"),
                "data-editor-columns-layout": dom.getAttribute(
                  "data-editor-columns-layout",
                ),
              })

              return {
                node: importElement($createEditorColumnsGroupNode(layout), dom),
              }
            },
          }
        : null
    }

    return { div: convert }
  }

  extractWithChild(
    _child: LexicalNode,
    selection: BaseSelection | null,
    _destination: "clone" | "html",
  ) {
    return (
      $isRangeSelection(selection) && $isBlockFullySelected(this, selection)
    )
  }

  private applyLayout(element: HTMLElement) {
    const layout = this.getLayout()

    for (const [name, value] of Object.entries(
      editorColumnsHTMLAttributes(layout),
    ))
      element.setAttribute(name, value)

    element.style.setProperty(
      "--editor-columns-template",
      layout.map((width) => `${width}fr`).join(" "),
    )
  }
}

export class EditorColumnNode extends ElementNode {
  static getType() {
    return "editor-column"
  }

  static clone(node: EditorColumnNode) {
    return new EditorColumnNode(node.__key)
  }

  constructor(key?: NodeKey) {
    super(key)
  }

  createDOM() {
    const element = document.createElement("div")
    element.setAttribute("data-editor-column", "1")

    return element
  }

  updateDOM() {
    return false
  }

  extractWithChild(
    _child: LexicalNode,
    selection: BaseSelection | null,
    _destination: "clone" | "html",
  ) {
    const group = this.getParent()

    return (
      group instanceof EditorColumnsGroupNode &&
      $isRangeSelection(selection) &&
      $isBlockFullySelected(group, selection)
    )
  }

  exportJSON(): SerializedEditorColumnNode {
    return {
      ...super.exportJSON(),
      type: "editor-column",
      version: 1,
    }
  }

  static importJSON(value: SerializedEditorColumnNode) {
    validateEditorColumnsColumnJSON(value)

    return $applyNodeReplacement(new EditorColumnNode()).updateFromJSON(value)
  }

  exportDOM(editor: LexicalEditor): DOMExportOutput {
    const output = super.exportDOM(editor)

    if (isHTMLElement(output.element))
      output.element.setAttribute("data-editor-column", "1")

    return output
  }

  static importDOM(): DOMConversionMap {
    function convert(element: HTMLElement) {
      return element.hasAttribute("data-editor-column")
        ? {
            priority: 4 as const,
            conversion(dom: HTMLElement) {
              validateEditorColumnsHTML(dom.parentElement ?? dom)

              return {
                node: importElement(new EditorColumnNode(), dom),
              }
            },
          }
        : null
    }

    return { div: convert }
  }
}

export function $createEditorColumnsGroupNode(
  layout: readonly number[] = [50, 50],
) {
  return $applyNodeReplacement(new EditorColumnsGroupNode(layout))
}

export function $createEditorColumnNode() {
  return $applyNodeReplacement(new EditorColumnNode())
}

export function $isEditorColumnNode(
  node: LexicalNode | null | undefined,
): node is EditorColumnNode {
  return node instanceof EditorColumnNode
}

export function $isEditorColumnsGroupNode(
  node: LexicalNode | null | undefined,
): node is EditorColumnsGroupNode {
  return node instanceof EditorColumnsGroupNode
}
