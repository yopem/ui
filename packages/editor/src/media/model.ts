import type {
  DOMConversionMap,
  LexicalEditor,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from "lexical"
import type { ReactNode } from "react"

import { $applyNodeReplacement, DecoratorNode } from "lexical"

import type { MediaData, MediaInput } from "./schema"

import { serializeMediaHtml } from "./html"
import { parseMedia } from "./schema"

export type SerializedMediaNode = Spread<
  { type: "yopem-media"; version: 1; media: MediaData },
  SerializedLexicalNode
>

export type MediaRenderer = (
  node: MediaNode,
  editor: LexicalEditor,
) => ReactNode

const renderers = new WeakMap<LexicalEditor, MediaRenderer>()

export function registerMediaRenderer(
  editor: LexicalEditor,
  renderer: MediaRenderer,
) {
  if (renderers.has(editor))
    throw new Error("Media renderer already registered.")
  renderers.set(editor, renderer)

  return () => {
    if (renderers.get(editor) === renderer) renderers.delete(editor)
  }
}

export class MediaNode extends DecoratorNode<ReactNode> {
  __media: MediaData

  static getType() {
    return "yopem-media"
  }
  static clone(node: MediaNode) {
    return new MediaNode(node.__media, node.__key)
  }
  constructor(media: MediaData, key?: NodeKey) {
    super(key)
    this.__media = parseMedia(media)
  }
  static importJSON(value: SerializedMediaNode) {
    if (value.version !== 1) throw new Error("Unsupported media version.")

    return $createMediaNode(value.media)
  }
  exportJSON(): SerializedMediaNode {
    return {
      ...super.exportJSON(),
      type: "yopem-media",
      version: 1,
      media: this.getMedia(),
    }
  }
  static importDOM(): DOMConversionMap {
    return {
      figure: (element) =>
        element.hasAttribute("data-yopem-media")
          ? {
              priority: 2,
              conversion: (dom) => {
                try {
                  return {
                    after: () => [],
                    node: $createMediaNode(
                      JSON.parse(
                        dom.getAttribute("data-yopem-media") ?? "null",
                      ),
                    ),
                  }
                } catch {
                  return { node: null }
                }
              },
            }
          : null,
    }
  }
  exportDOM() {
    const template = document.createElement("template")
    template.innerHTML = serializeMediaHtml(this.getMedia())

    return { element: template.content.querySelector("figure") }
  }
  createDOM() {
    return document.createElement("div")
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
  getMedia() {
    return this.getLatest().__media
  }
  setMedia(patch: Partial<MediaData>) {
    this.getWritable().__media = parseMedia({ ...this.getMedia(), ...patch })

    return this
  }
  getTextContent() {
    const data = this.getMedia()
    const label = data.kind === "file" ? data.name : data.alt

    return data.caption ? `${label}\n${data.caption}` : label
  }
  decorate(editor: LexicalEditor) {
    return renderers.get(editor)?.(this, editor) ?? null
  }
}

export function $createMediaNode(value: MediaInput) {
  return $applyNodeReplacement(new MediaNode(parseMedia(value)))
}
