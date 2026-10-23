"use client"

import type { KeyboardEvent } from "react"

import { Button } from "@registry/components/ui/button"
import { Stack } from "@registry/components/ui/stack"
import { ToolbarButton } from "@registry/components/ui/toolbar"
import {
  EditorContent,
  EditorLinkControl,
  EditorRoot,
  EditorToolbar,
  useEditor,
  useEditorState,
} from "@yopem-ui/editor"
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $insertNodes,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
  defineExtension,
} from "lexical"

const insertNoteCommand = createCommand<void>()

const noteExtension = defineExtension({
  name: "yopem-docs/editor-note",
  register(editor) {
    return editor.registerCommand(
      insertNoteCommand,
      () => {
        if (!editor.isEditable()) return false
        $insertNodes([$createTextNode("Extension note")])

        return true
      },
      COMMAND_PRIORITY_EDITOR,
    )
  },
})

const extensions = [noteExtension]

export function InsertNoteButton() {
  const editor = useEditor()

  return (
    <ToolbarButton
      render={<Button variant="ghost" size="sm" />}
      onMouseDown={(event) => event.preventDefault()}
      onClick={() => {
        editor.dispatchCommand(insertNoteCommand, undefined)
        editor.focus()
      }}
    >
      Insert note
    </ToolbarButton>
  )
}

export function EditorExtensionContent() {
  const editor = useEditor()
  const { editable } = useEditorState()

  function replaceDocument() {
    if (!editor.isEditable()) return

    const replacement = editor.parseEditorState(
      editor.getEditorState().toJSON(),
      () => {
        $getRoot()
          .clear()
          .append(
            $createParagraphNode().append(
              $createTextNode("Replacement content"),
            ),
          )
      },
    )

    editor.setEditorState(replacement)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.altKey && event.shiftKey && event.code === "KeyR") {
      event.preventDefault()
      replaceDocument()
    }
  }

  return (
    <Stack onKeyDownCapture={handleKeyDown}>
      <EditorToolbar aria-label="Extension commands">
        <InsertNoteButton />
        <ToolbarButton
          render={<Button variant="ghost" size="sm" />}
          disabled={!editable}
          onMouseDown={(event) => event.preventDefault()}
          onClick={replaceDocument}
        >
          Replace document
        </ToolbarButton>
        <EditorLinkControl />
      </EditorToolbar>
      <EditorContent placeholder="Use the custom command." />
    </Stack>
  )
}

export function EditorExtensionExamples() {
  return (
    <EditorRoot ariaLabel="Extended editor" extensions={extensions}>
      <EditorExtensionContent />
    </EditorRoot>
  )
}
