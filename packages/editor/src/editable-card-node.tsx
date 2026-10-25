import type { DOMConversionMap, LexicalEditor, NodeKey } from "lexical"
import type { ReactNode } from "react"

import { $applyNodeReplacement, DecoratorNode } from "lexical"

import {
  editorEditableCardFromHTMLAttributes,
  editorEditableCardHTMLAttributes,
  parseEditorEditableCardNode,
  type SerializedEditorEditableCardNode,
} from "./editable-card-model"

export type EditorEditableCardRenderer = (
  node: EditorEditableCardNode,
  editor: LexicalEditor,
) => ReactNode

const renderers = new WeakMap<LexicalEditor, EditorEditableCardRenderer>()

export function registerEditorEditableCardRenderer(
  editor: LexicalEditor,
  renderer: EditorEditableCardRenderer,
) {
  if (renderers.has(editor))
    throw new Error("Editable card renderer already registered.")
  renderers.set(editor, renderer)

  function unregister() {
    if (renderers.get(editor) === renderer) renderers.delete(editor)
  }

  return unregister
}

export class EditorEditableCardNode extends DecoratorNode<ReactNode> {
  static getType() {
    return "editor-editable-card"
  }
  static clone(node: EditorEditableCardNode) {
    return new EditorEditableCardNode(node.__key)
  }
  constructor(key?: NodeKey) {
    super(key)
  }
  static importJSON(value: SerializedEditorEditableCardNode) {
    parseEditorEditableCardNode(value)

    return $createEditorEditableCardNode()
  }
  exportJSON(): SerializedEditorEditableCardNode {
    return {
      ...super.exportJSON(),
      type: "editor-editable-card",
      version: 1,
    }
  }
  static importDOM(): DOMConversionMap {
    function convert(element: HTMLElement) {
      try {
        editorEditableCardFromHTMLAttributes({
          "data-editor-editable-card": element.getAttribute(
            "data-editor-editable-card",
          ),
        })
      } catch {
        return null
      }

      return {
        conversion: () => ({ node: $createEditorEditableCardNode() }),
        priority: 4 as const,
      }
    }

    return { figure: convert }
  }
  getTextContent() {
    return "Editable card"
  }
  isInline() {
    return false
  }
  isKeyboardSelectable() {
    return true
  }
  createDOM() {
    const element = document.createElement("div")
    element.contentEditable = "false"
    element.setAttribute("data-slot", "editor-editable-card-host")

    return element
  }
  updateDOM() {
    return false
  }
  exportDOM() {
    const element = document.createElement("figure")

    for (const [name, value] of Object.entries(
      editorEditableCardHTMLAttributes(),
    ))
      element.setAttribute(name, value)

    return { element }
  }
  decorate(editor: LexicalEditor) {
    return renderers.get(editor)?.(this, editor) ?? null
  }
}

export function $createEditorEditableCardNode() {
  return $applyNodeReplacement(new EditorEditableCardNode())
}
