import type {
  DOMConversionMap,
  DOMExportOutput,
  EditorConfig,
  LexicalEditor,
  NodeKey,
  SerializedTextNode,
  Spread,
} from "lexical"

import { $applyNodeReplacement, $getDocument, TextNode } from "lexical"

import {
  decodeEditorLabelNode,
  editorLabelSchema,
  type SerializedEditorLabelData,
} from "./labels-model"

export type SerializedEditorLabelNode = Spread<
  { type: "editor-label"; version: 1; label: string },
  SerializedTextNode
>

const serializedEditorLabelNodeKeys = new Set([
  "type",
  "version",
  "label",
  "text",
  "format",
  "detail",
  "mode",
  "style",
])

function hasSupportedSerializedKeys(value: SerializedEditorLabelNode) {
  let count = 0

  for (const key in value) {
    if (!Object.hasOwn(value, key)) continue

    if (
      !serializedEditorLabelNodeKeys.has(key) ||
      ++count > serializedEditorLabelNodeKeys.size
    )
      return false
  }

  return count === serializedEditorLabelNodeKeys.size
}

export class EditorLabelNode extends TextNode {
  static getType() {
    return "editor-label"
  }

  static clone(node: EditorLabelNode) {
    return new EditorLabelNode(node.getLabel(), node.__key)
  }

  constructor(label: string, key?: NodeKey) {
    super(editorLabelSchema.parse(label), key)
  }

  static importJSON(value: SerializedEditorLabelNode): TextNode {
    const parsed = hasSupportedSerializedKeys(value)
      ? decodeEditorLabelNode({
          type: value.type,
          version: value.version,
          label: value.label,
          text: value.text,
          format: value.format,
          detail: value.detail,
          mode: value.mode,
          style: value.style,
        })
      : null

    if (!parsed) throw new TypeError("Invalid editor label metadata")

    return $createEditorLabelNode(parsed.label)
      .updateFromJSON(value)
      .setMode("token")
  }

  exportJSON(): SerializedEditorLabelNode {
    return {
      ...super.exportJSON(),
      type: "editor-label",
      version: 1,
      label: this.getLabel(),
    }
  }

  static importDOM(): DOMConversionMap {
    return {
      "yopem-editor-label": (element) => {
        const label = editorLabelSchema.safeParse(
          element.getAttribute("data-editor-label"),
        )

        if (!label.success || element.textContent !== label.data) return null

        return {
          conversion: () => ({ node: $createEditorLabelNode(label.data) }),
          priority: 4 as const,
        }
      },
    }
  }

  getLabel() {
    return this.getLatest().getTextContent()
  }

  createDOM(config: EditorConfig, editor?: LexicalEditor) {
    const element = super.createDOM(config, editor)
    const className = config.theme.text?.editorLabel

    element.setAttribute("data-slot", "editor-label")
    element.setAttribute("data-editor-label", this.getLabel())
    element.setAttribute("dir", "auto")

    if (className)
      element.classList.add(...className.split(" ").filter(Boolean))

    return element
  }

  updateDOM(previous: this, element: HTMLElement, config: EditorConfig) {
    const replace = super.updateDOM(previous, element, config)

    if (replace) return true

    element.setAttribute("data-editor-label", this.getLabel())

    return false
  }

  exportDOM(_editor: LexicalEditor): DOMExportOutput {
    const element = $getDocument().createElement("yopem-editor-label")
    const label = this.getLabel()

    element.setAttribute("data-editor-label", label)
    element.textContent = label

    return { element }
  }

  isTextEntity() {
    return true
  }

  canInsertTextBefore() {
    return false
  }

  canInsertTextAfter() {
    return false
  }
}

export function $createEditorLabelNode(label: string) {
  return $applyNodeReplacement(new EditorLabelNode(label)).setMode("token")
}

export function $isEditorLabelNode(node: unknown): node is EditorLabelNode {
  return node instanceof EditorLabelNode
}

export type EditorLabelValue = SerializedEditorLabelData["label"]
