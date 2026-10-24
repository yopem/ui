"use client"

import type { LexicalEditor } from "lexical"
import type { ReactNode } from "react"

import { Button } from "@registry/components/ui/button"
import { HStack } from "@registry/components/ui/hstack"
import { $getSelection, $isNodeSelection } from "lexical"
import { useSyncExternalStore } from "react"

import { useEditor, useEditorState } from "./root"
import {
  INSERT_EDITOR_TOC_COMMAND,
  REMOVE_EDITOR_TOC_COMMAND,
} from "./toc-extension"
import { EditorTocNode } from "./toc-node"

export function editorTocSlashCommand() {
  return {
    id: "toc",
    label: "Table of contents",
    description: "Insert a live table of contents",
    available(editor: LexicalEditor) {
      return editor.hasNodes([EditorTocNode])
    },
    run(editor: LexicalEditor) {
      editor.dispatchCommand(INSERT_EDITOR_TOC_COMMAND, undefined)
    },
  }
}

export function EditorTocInsertControl() {
  const editor = useEditor()
  const state = useEditorState()

  return (
    <Button
      variant="ghost"
      size="sm"
      data-slot="editor-toc-insert-control"
      disabled={!state.editable}
      onMouseDown={(event) => event.preventDefault()}
      onClick={() =>
        editor.dispatchCommand(INSERT_EDITOR_TOC_COMMAND, undefined)
      }
    >
      Insert table of contents
    </Button>
  )
}

export function EditorTocRemoveControl() {
  const editor = useEditor()

  const editorState = useSyncExternalStore(
    (listener) => editor.registerUpdateListener(listener),
    () => editor.getEditorState(),
    () => editor.getEditorState(),
  )

  const state = useEditorState()

  const selected = editorState.read(() => {
    const selection = $getSelection()

    return (
      $isNodeSelection(selection) &&
      selection.getNodes().some((node) => node instanceof EditorTocNode)
    )
  })

  return (
    <Button
      variant="ghost"
      size="sm"
      data-slot="editor-toc-remove-control"
      disabled={!state.editable || !selected}
      onMouseDown={(event) => event.preventDefault()}
      onClick={() =>
        editor.dispatchCommand(REMOVE_EDITOR_TOC_COMMAND, undefined)
      }
    >
      Remove table of contents
    </Button>
  )
}

export interface EditorTocControlsProps {
  readonly children?: ReactNode
}

export function EditorTocControls({ children }: EditorTocControlsProps) {
  return (
    <HStack data-slot="editor-toc-controls">
      <EditorTocInsertControl />
      <EditorTocRemoveControl />
      {children}
    </HStack>
  )
}
