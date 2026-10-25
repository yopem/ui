import type {
  DOMConversionMap,
  EditorConfig,
  SerializedLexicalNode,
  LexicalEditor,
  LexicalNode,
  NodeKey,
} from "lexical"
import type { ReactNode } from "react"

import {
  $applyNodeReplacement,
  $nodesOfType,
  DecoratorNode,
  SKIP_DOM_SELECTION_TAG,
} from "lexical"

import {
  editorDrawingFromHTMLAttributes,
  editorDrawingHTMLAttributes,
  parseEditorDrawingNode,
  parseEditorDrawingScene,
  type EditorDrawingElement,
  type EditorDrawingScene,
  type SerializedEditorDrawingNode,
} from "./drawing-model"

export type EditorDrawingRenderer = (
  node: EditorDrawingNode,
  editor: LexicalEditor,
) => ReactNode

const renderers = new WeakMap<LexicalEditor, EditorDrawingRenderer>()

export function registerEditorDrawingRenderer(
  editor: LexicalEditor,
  renderer: EditorDrawingRenderer,
) {
  if (renderers.has(editor))
    throw new Error("Editor drawing renderer already registered")
  renderers.set(editor, renderer)
  let registered = true

  function refreshDrawingNodes() {
    editor.update(
      () => {
        for (const node of $nodesOfType(EditorDrawingNode)) node.markDirty()
      },
      { discrete: true, tag: SKIP_DOM_SELECTION_TAG },
    )
  }

  try {
    refreshDrawingNodes()
  } catch (error) {
    renderers.delete(editor)
    throw error
  }

  function unregister() {
    if (!registered) return
    registered = false

    if (renderers.get(editor) !== renderer) return

    renderers.delete(editor)
    refreshDrawingNodes()
  }

  return unregister
}

export class EditorDrawingNode extends DecoratorNode<ReactNode> {
  __elements: EditorDrawingElement[]

  static getType() {
    return "editor-drawing"
  }

  static clone(node: EditorDrawingNode) {
    return new EditorDrawingNode({ elements: node.__elements }, node.__key)
  }

  constructor(scene: EditorDrawingScene, key?: NodeKey) {
    super(key)
    this.__elements = parseEditorDrawingScene(scene).elements
  }

  static importJSON(value: SerializedLexicalNode) {
    return $createEditorDrawingNode({
      elements: parseEditorDrawingNode(value).elements,
    })
  }

  exportJSON(): SerializedEditorDrawingNode {
    return {
      ...super.exportJSON(),
      type: "editor-drawing",
      version: 1,
      elements: this.getScene().elements,
    }
  }

  static importDOM(): DOMConversionMap {
    function convert(element: HTMLElement) {
      try {
        editorDrawingFromHTMLAttributes({
          "data-editor-drawing": element.getAttribute("data-editor-drawing"),
          "data-editor-drawing-scene": element.getAttribute(
            "data-editor-drawing-scene",
          ),
        })
      } catch {
        return null
      }

      return {
        conversion(dom: HTMLElement) {
          if (dom.tagName !== "FIGURE") return null

          const scene = editorDrawingFromHTMLAttributes({
            "data-editor-drawing": dom.getAttribute("data-editor-drawing"),
            "data-editor-drawing-scene": dom.getAttribute(
              "data-editor-drawing-scene",
            ),
          })

          return { node: $createEditorDrawingNode(scene) }
        },
        priority: 4 as const,
      }
    }

    return { figure: convert }
  }

  getScene() {
    return parseEditorDrawingScene({ elements: this.getLatest().__elements })
  }

  setScene(scene: EditorDrawingScene) {
    this.getWritable().__elements = parseEditorDrawingScene(scene).elements

    return this
  }

  getTextContent() {
    return `Drawing with ${this.getScene().elements.length} elements`
  }

  isInline() {
    return false
  }

  isKeyboardSelectable() {
    return true
  }

  createDOM(_config: EditorConfig, editor: LexicalEditor) {
    const element = editor
      .getRootElement()
      ?.ownerDocument.createElement("figure")

    if (!element) throw new Error("Editor drawing needs an attached document")
    element.contentEditable = "false"

    for (const [name, value] of Object.entries(
      editorDrawingHTMLAttributes(this.getScene()),
    ))
      element.setAttribute(name, value)

    return element
  }

  updateDOM(previous: EditorDrawingNode) {
    return (
      JSON.stringify(previous.__elements) !== JSON.stringify(this.__elements)
    )
  }

  exportDOM(editor: LexicalEditor) {
    const element = editor
      .getRootElement()
      ?.ownerDocument.createElement("figure")

    if (!element) throw new Error("Editor drawing needs an attached document")

    for (const [name, value] of Object.entries(
      editorDrawingHTMLAttributes(this.getScene()),
    ))
      element.setAttribute(name, value)

    element.textContent = this.getTextContent()

    return { element }
  }

  decorate(editor: LexicalEditor) {
    return renderers.get(editor)?.(this, editor) ?? this.getTextContent()
  }
}

export function $createEditorDrawingNode(scene: EditorDrawingScene) {
  return $applyNodeReplacement(new EditorDrawingNode(scene))
}

export function $isEditorDrawingNode(
  node: LexicalNode | null | undefined,
): node is EditorDrawingNode {
  return node instanceof EditorDrawingNode
}
