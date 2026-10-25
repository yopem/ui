"use client"

import {
  COMMAND_PRIORITY_HIGH,
  KEY_DOWN_COMMAND,
  defineExtension,
  mergeRegister,
} from "lexical"

import {
  EditorEditableCardNode,
  registerEditorEditableCardRenderer,
} from "./editable-card-node"
import { EditorEditableCardView } from "./editable-card-view"

interface EditorEditableCardElementTarget {
  closest(selector: string): object | null
}

export function isEditorEditableCardInteractiveTarget(
  target: EditorEditableCardElementTarget | null,
) {
  return (
    target !== null &&
    target.closest(
      '[data-slot="editor-editable-card"] input, [data-slot="editor-editable-card"] textarea, [data-slot="editor-editable-card"] select, [data-slot="editor-editable-card"] button, [data-slot="editor-editable-card"] a[href], [data-slot="editor-editable-card"] summary, [data-slot="editor-editable-card"] iframe, [data-slot="editor-editable-card"] [contenteditable="true"]',
    ) !== null
  )
}

export const EditorEditableCardExtension = defineExtension({
  name: "@yopem-ui/editor/editable-card",
  nodes: [EditorEditableCardNode],
  register(editor) {
    return mergeRegister(
      registerEditorEditableCardRenderer(editor, (_node, parent) => (
        <EditorEditableCardView editor={parent} />
      )),
      editor.registerCommand(
        KEY_DOWN_COMMAND,
        () =>
          isEditorEditableCardInteractiveTarget(
            editor.getRootElement()?.ownerDocument.activeElement ?? null,
          ),
        COMMAND_PRIORITY_HIGH,
      ),
    )
  },
})
