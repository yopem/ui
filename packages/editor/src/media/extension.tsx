"use client"

import type { LexicalEditor } from "lexical"

import { $insertNodeToNearestRoot } from "@lexical/utils"
import {
  $addUpdateTag,
  $createNodeSelection,
  $createParagraphNode,
  $getEditor,
  $getNearestNodeFromDOMNode,
  $getSelection,
  $isNodeSelection,
  $isRangeSelection,
  $isSelectionCapturedInDecoratorInput,
  $setSelection,
  COMMAND_PRIORITY_HIGH,
  COMMAND_PRIORITY_LOW,
  HISTORY_PUSH_TAG,
  isDOMNode,
  isHTMLElement,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
  KEY_DOWN_COMMAND,
  defineExtension,
  mergeRegister,
} from "lexical"

import type { MediaEmbedPolicyInput, MediaInput } from "./schema"

import { $createMediaNode, MediaNode, registerMediaRenderer } from "./model"
import { createMediaEmbedPolicy } from "./schema"
import { MediaView } from "./view"

export function createMediaStore(editor: LexicalEditor) {
  let snapshot = {
    state: editor.getEditorState(),
    editable: editor.isEditable(),
  }

  const listeners = new Set<() => void>()

  function publish() {
    snapshot = { state: editor.getEditorState(), editable: editor.isEditable() }

    for (const listener of listeners) listener()
  }

  return {
    getSnapshot(this: void) {
      return snapshot
    },
    subscribe(this: void, listener: () => void) {
      listeners.add(listener)

      return () => {
        listeners.delete(listener)
      }
    },
    register() {
      return mergeRegister(
        editor.registerUpdateListener(publish),
        editor.registerEditableListener(publish),
      )
    },
  }
}

export function $insertMedia(value: MediaInput) {
  const editor = $getEditor()

  if (!editor.isEditable()) return false
  const selection = $getSelection()

  if (!$isRangeSelection(selection)) return false
  const node = $createMediaNode(value)

  $insertNodeToNearestRoot(node)
  node.insertAfter($createParagraphNode())
  const selected = $createNodeSelection()
  selected.add(node.getKey())
  $setSelection(selected)

  return true
}

export type MediaExtensionOptions = Readonly<{
  embedPolicy?: MediaEmbedPolicyInput
}>

export function createMediaExtension(options: MediaExtensionOptions = {}) {
  const embedPolicy = options.embedPolicy
    ? createMediaEmbedPolicy(options.embedPolicy)
    : undefined

  return defineExtension({
    name: "@yopem-ui/editor/media",
    nodes: [MediaNode],
    register(editor) {
      const store = createMediaStore(editor)

      function select(event: Event) {
        const target = event.target

        if (!isHTMLElement(target) || event.defaultPrevented) return
        const element = target.closest('[data-slot="editor-media"]')

        const interactive = target.closest(
          "button, input, textarea, select, a[href], video, audio, summary, iframe",
        )

        if (
          !element ||
          target.closest('[data-slot="media-preview-trigger"]') ||
          (event.type === "click" && interactive)
        )
          return
        editor.update(() => {
          const node = $getNearestNodeFromDOMNode(element)

          if (!(node instanceof MediaNode)) return
          const selection = $createNodeSelection()
          selection.add(node.getKey())
          $setSelection(selection)
        })
      }

      function remove(event: KeyboardEvent | null) {
        if (event?.defaultPrevented || !editor.isEditable()) return false
        const selection = $getSelection()

        if (!$isNodeSelection(selection)) return false

        const nodes = selection.getNodes()

        if (!nodes.length || !nodes.every((node) => node instanceof MediaNode))
          return false
        event?.preventDefault()
        $addUpdateTag(HISTORY_PUSH_TAG)

        for (const node of nodes) node.remove()

        return true
      }

      return mergeRegister(
        store.register(),
        registerMediaRenderer(editor, (node) => (
          <MediaView
            editor={editor}
            nodeKey={node.getKey()}
            store={store}
            embedPolicy={embedPolicy}
          />
        )),
        editor.registerRootListener((root, previous) => {
          previous?.removeEventListener("click", select)
          previous?.removeEventListener("focusin", select)
          root?.addEventListener("click", select)
          root?.addEventListener("focusin", select)
        }),
        editor.registerCommand(
          KEY_DOWN_COMMAND,
          (event) => {
            const target = event.target

            if (
              isHTMLElement(target) &&
              target.closest('[data-slot="editor-media"]') &&
              target.closest(
                "input, textarea, select, button, a[href], video, audio, summary, iframe",
              )
            )
              return true

            return (
              isDOMNode(target) && $isSelectionCapturedInDecoratorInput(target)
            )
          },
          COMMAND_PRIORITY_HIGH,
        ),
        editor.registerCommand(
          KEY_DELETE_COMMAND,
          remove,
          COMMAND_PRIORITY_LOW,
        ),
        editor.registerCommand(
          KEY_BACKSPACE_COMMAND,
          remove,
          COMMAND_PRIORITY_LOW,
        ),
      )
    },
  })
}

export const MediaExtension = createMediaExtension()
