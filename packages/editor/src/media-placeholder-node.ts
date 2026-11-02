import type {
  DOMConversionMap,
  EditorConfig,
  LexicalEditor,
  NodeKey,
} from "lexical"
import type { ReactNode } from "react"

import { $applyNodeReplacement, DecoratorNode } from "lexical"

import {
  mediaPlaceholderKindSchema,
  mediaPlaceholderNodeSchema,
  type MediaPlaceholderKind,
  type SerializedMediaPlaceholder,
} from "./media-placeholder-model"

const renderers = new WeakMap<
  LexicalEditor,
  (node: MediaPlaceholderNode) => ReactNode
>()

export function registerMediaPlaceholderRenderer(
  editor: LexicalEditor,
  renderer: (node: MediaPlaceholderNode) => ReactNode,
) {
  if (renderers.has(editor))
    throw new Error("Media placeholder renderer already registered.")
  renderers.set(editor, renderer)

  return () => {
    if (renderers.get(editor) === renderer) renderers.delete(editor)
  }
}

export class MediaPlaceholderNode extends DecoratorNode<ReactNode> {
  __uploadKind: MediaPlaceholderKind
  static getType() {
    return "editor-media-placeholder"
  }
  static clone(node: MediaPlaceholderNode) {
    return new MediaPlaceholderNode(node.__uploadKind, node.__key)
  }
  constructor(uploadKind: MediaPlaceholderKind = "file", key?: NodeKey) {
    super(key)
    this.__uploadKind = mediaPlaceholderKindSchema.parse(uploadKind)
  }
  static importJSON(value: SerializedMediaPlaceholder) {
    return $createMediaPlaceholderNode(
      mediaPlaceholderNodeSchema.parse(value).uploadKind,
    )
  }
  exportJSON(): SerializedMediaPlaceholder {
    return {
      type: "editor-media-placeholder",
      version: 1,
      uploadKind: this.getUploadKind(),
    }
  }
  static importDOM(): DOMConversionMap {
    return {
      div: (element) =>
        element.hasAttribute("data-editor-media-placeholder")
          ? {
              priority: 3,
              conversion: (dom) => {
                const parsed = mediaPlaceholderKindSchema.safeParse(
                  dom.getAttribute("data-editor-media-placeholder"),
                )

                const canonical =
                  dom.attributes.length === 1 &&
                  dom.textContent === "Upload unavailable. Select a file." &&
                  Array.from(dom.childNodes).every(
                    (child) => child.nodeType === 3,
                  )

                return parsed.success && canonical
                  ? {
                      node: $createMediaPlaceholderNode(parsed.data),
                      after: () => [],
                    }
                  : { node: null }
              },
            }
          : null,
    }
  }
  exportDOM(editor: LexicalEditor) {
    const element = this.createDOM(editor._config, editor)
    element.setAttribute("data-editor-media-placeholder", this.getUploadKind())
    element.textContent = "Upload unavailable. Select a file."

    return { element }
  }
  createDOM(_config: EditorConfig, editor: LexicalEditor) {
    return (
      editor.getRootElement()?.ownerDocument ?? globalThis.document
    ).createElement("div")
  }
  updateDOM() {
    return false
  }
  isInline() {
    return false
  }
  isKeyboardSelectable() {
    return true
  }
  getUploadKind() {
    return this.getLatest().__uploadKind
  }
  getTextContent() {
    return "Upload unavailable. Select a file."
  }
  decorate(editor: LexicalEditor) {
    return renderers.get(editor)?.(this) ?? null
  }
}

export function $createMediaPlaceholderNode(kind: MediaPlaceholderKind) {
  return $applyNodeReplacement(new MediaPlaceholderNode(kind))
}
