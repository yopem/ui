import type {
  DOMConversionMap,
  DOMExportOutput,
  EditorConfig,
  LexicalEditor,
  NodeKey,
  SerializedTextNode,
  Spread,
} from "lexical"

import { $isLinkNode } from "@lexical/link"
import { $applyNodeReplacement, $getEditor, TextNode } from "lexical"

import type { MentionIdentity } from "./mention-codec"

import {
  decodeMention,
  encodeMention,
  mentionPlainText,
  mentionNodeSchema,
  safeMentionProfileURL,
} from "./mention-codec"

const profileResolvers = new WeakMap<
  LexicalEditor,
  (id: string) => string | null
>()

export function registerMentionProfileResolver(
  editor: LexicalEditor,
  resolve: (id: string) => string | null,
) {
  profileResolvers.set(editor, resolve)

  return () => {
    profileResolvers.delete(editor)
  }
}

export type SerializedMentionNode = Spread<
  { type: "mention"; version: 1; identity: MentionIdentity },
  SerializedTextNode
>

export class MentionNode extends TextNode {
  __identity: MentionIdentity

  static getType() {
    return "mention"
  }
  static clone(node: MentionNode) {
    return new MentionNode(node.__identity, node.__key)
  }
  constructor(identity: MentionIdentity, key?: NodeKey) {
    const valid = encodeMention(identity)
    super(mentionPlainText(valid), key)
    this.__identity = valid
  }
  static importJSON(value: SerializedMentionNode) {
    const parsed = mentionNodeSchema.parse(value)

    return $createMentionNode(parsed.identity)
      .updateFromJSON(value)
      .setMode("token")
  }
  exportJSON(): SerializedMentionNode {
    return {
      ...super.exportJSON(),
      type: "mention",
      version: 1,
      identity: { ...this.getLatest().__identity },
    }
  }
  static importDOM(): DOMConversionMap {
    return {
      span: (element) =>
        element.hasAttribute("data-mention-id")
          ? {
              priority: 2,
              conversion(element) {
                const identity = decodeMention({
                  id: element.getAttribute("data-mention-id"),
                  label: element.getAttribute("data-mention-label"),
                })

                return identity &&
                  element.textContent === mentionPlainText(identity)
                  ? { node: $createMentionNode(identity) }
                  : null
              },
            }
          : null,
    }
  }
  exportDOM(_editor: LexicalEditor): DOMExportOutput {
    const element = document.createElement("span")
    const identity = this.getIdentity()
    element.setAttribute("dir", "auto")
    element.setAttribute("data-mention-id", identity.id)
    element.setAttribute("data-mention-label", identity.label)
    element.textContent = mentionPlainText(identity)

    return { element }
  }
  private resolveProfile(editor?: LexicalEditor) {
    if (this.getParents().some($isLinkNode)) return null

    return safeMentionProfileURL(
      editor ? profileResolvers.get(editor)?.(this.getIdentity().id) : null,
    )
  }
  createDOM(config: EditorConfig, editor?: LexicalEditor) {
    const profileURL = this.resolveProfile(editor)

    const content = super.createDOM(config, editor)
    content.setAttribute("dir", "auto")

    if (!profileURL) {
      content.setAttribute("data-slot", "editor-mention")

      return content
    }

    const element = document.createElement("a")
    element.setAttribute("dir", "auto")
    element.setAttribute("href", profileURL)

    if (config.theme.link) element.className = config.theme.link
    element.setAttribute("data-slot", "editor-mention")
    element.append(content)

    return element
  }
  updateDOM(previous: this, element: HTMLElement, config: EditorConfig) {
    const profileURL = this.resolveProfile($getEditor())

    if ((element.tagName === "A") !== Boolean(profileURL)) return true

    if (profileURL) element.setAttribute("href", profileURL)

    if (element.tagName !== "A")
      return super.updateDOM(previous, element, config)
    const content = element.firstElementChild

    return content instanceof HTMLElement
      ? super.updateDOM(previous, content, config)
      : true
  }
  getIdentity() {
    return { ...this.getLatest().__identity }
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

export function $createMentionNode(identity: MentionIdentity) {
  return $applyNodeReplacement(new MentionNode(identity)).setMode("token")
}

export function $isMentionNode(node: unknown): node is MentionNode {
  return node instanceof MentionNode
}
