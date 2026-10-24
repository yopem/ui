import {
  $applyNodeReplacement,
  DecoratorNode,
  type NodeKey,
  type SerializedLexicalNode,
  type DOMConversionMap,
} from "lexical"

import {
  editorMathNodeSchema,
  parseEditorMath,
  editorMathHTMLAttributes,
  editorMathFromHTMLAttributes,
  type EditorMathValue,
} from "./math-model"
import { renderEditorMath } from "./math-render"

export type SerializedEditorMathNode = SerializedLexicalNode & EditorMathValue

export class EditorMathNode extends DecoratorNode<null> {
  __math: EditorMathValue

  static getType() {
    return "editor-math"
  }
  static clone(node: EditorMathNode) {
    return new EditorMathNode(node.__math, node.__key)
  }
  constructor(
    value: EditorMathValue = { kind: "inline", tex: "x" },
    key?: NodeKey,
  ) {
    super(key)
    this.__math = parseEditorMath(value)
  }
  static importJSON(value: SerializedEditorMathNode) {
    const parsed = editorMathNodeSchema.parse(value)

    return $createEditorMathNode({ kind: parsed.kind, tex: parsed.tex })
  }
  exportJSON(): SerializedEditorMathNode {
    return {
      ...super.exportJSON(),
      ...this.getValue(),
      type: "editor-math",
      version: 1,
    }
  }
  static importDOM(): DOMConversionMap {
    function convert(element: HTMLElement) {
      if (!element.hasAttribute("data-editor-math")) return null

      const value = editorMathFromHTMLAttributes({
        "data-editor-math": element.getAttribute("data-editor-math"),
        "data-editor-tex": element.getAttribute("data-editor-tex"),
      })

      if (element.tagName !== (value.kind === "inline" ? "SPAN" : "DIV"))
        throw new Error("Invalid math element")

      return {
        conversion: () => ({ node: $createEditorMathNode(value) }),
        priority: 4 as const,
      }
    }

    return { span: convert, div: convert }
  }
  getValue() {
    return { ...this.getLatest().__math }
  }
  setValue(value: EditorMathValue) {
    this.getWritable().__math = parseEditorMath(value)
  }
  isInline() {
    return this.getValue().kind === "inline"
  }
  isKeyboardSelectable() {
    return true
  }
  getTextContent() {
    return this.getValue().tex
  }
  createDOM() {
    const value = this.getValue()

    const element = document.createElement(
      value.kind === "inline" ? "span" : "div",
    )

    for (const [key, text] of Object.entries(editorMathHTMLAttributes(value)))
      element.setAttribute(key, text)
    element.contentEditable = "false"
    element.tabIndex = 0
    element.setAttribute("role", "math")
    element.setAttribute("aria-label", value.tex)
    const result = renderEditorMath(value)

    if (result.ok) element.innerHTML = result.html
    else {
      element.textContent = result.error
      element.setAttribute("aria-label", result.error)
      element.setAttribute("aria-invalid", "true")
    }

    return element
  }
  updateDOM(previous: EditorMathNode) {
    return previous.__math !== this.__math
  }
  exportDOM() {
    const value = this.getValue()

    const element = document.createElement(
      value.kind === "inline" ? "span" : "div",
    )

    for (const [key, text] of Object.entries(editorMathHTMLAttributes(value)))
      element.setAttribute(key, text)
    element.textContent = value.tex

    return { element }
  }
  decorate() {
    return null
  }
}

export function $createEditorMathNode(value: EditorMathValue) {
  return $applyNodeReplacement(new EditorMathNode(value))
}
