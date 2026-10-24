"use client"

import type { LexicalEditor, NodeKey } from "lexical"
import type { ReactNode } from "react"

import { Button } from "@registry/components/ui/button"
import { HStack } from "@registry/components/ui/hstack"
import {
  Popover,
  PopoverPopup,
  PopoverTitle,
  PopoverTrigger,
} from "@registry/components/ui/popover"
import { Stack } from "@registry/components/ui/stack"
import { Text } from "@registry/components/ui/text"
import { $createNodeSelection, $getNodeByKey, $setSelection } from "lexical"
import { useState, useSyncExternalStore } from "react"

import {
  INSERT_EDITOR_FOOTNOTE_COMMAND,
  REMOVE_EDITOR_FOOTNOTE_COMMAND,
  RENUMBER_EDITOR_FOOTNOTE_DEFINITION_COMMAND,
} from "./footnote-commands"
import { EditorFootnoteReferenceNode } from "./footnote-node"
import {
  $getEditorFootnoteSnapshot,
  $getSelectedEditorFootnote,
} from "./footnote-state"
import { useEditor, useEditorState } from "./root"

function useFootnoteSnapshot(editor: LexicalEditor) {
  const state = useSyncExternalStore(
    (listener) => editor.registerUpdateListener(listener),
    () => editor.getEditorState(),
    () => editor.getEditorState(),
  )

  return {
    snapshot: state.read($getEditorFootnoteSnapshot),
    selected: state.read($getSelectedEditorFootnote),
  }
}

function focusReference(editor: LexicalEditor, key: NodeKey) {
  const element = editor.getElementByKey(key)

  if (!editor.isEditable()) {
    element?.focus()
    element?.scrollIntoView({ block: "nearest" })

    return
  }

  editor.update(() => {
    const node = $getNodeByKey(key)

    if (!(node instanceof EditorFootnoteReferenceNode)) return
    const selection = $createNodeSelection()
    selection.add(node.getKey())
    $setSelection(selection)
  })
  element?.scrollIntoView({ block: "nearest" })
  editor.focus()
}

export function EditorFootnoteBacklinks() {
  const editor = useEditor()
  const { snapshot } = useFootnoteSnapshot(editor)
  const [open, setOpen] = useState(false)

  const references = snapshot.references.filter((reference) =>
    snapshot.definitions.some(
      (definition) =>
        definition.key === reference.definitionKey &&
        definition.identifier === reference.identifier,
    ),
  )

  return (
    <Popover modal={false} open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            data-slot="editor-footnote-backlinks"
          />
        }
        aria-expanded={open}
        onMouseDown={(event) => event.preventDefault()}
      >
        Footnote backlinks
      </PopoverTrigger>
      <PopoverPopup
        aria-label="Footnote backlinks"
        initialFocus={false}
        finalFocus={false}
      >
        <Stack>
          <PopoverTitle>Footnote backlinks</PopoverTitle>
          {references.length > 0 ? (
            references.map((reference) => (
              <Button
                key={reference.key}
                variant="ghost"
                size="sm"
                aria-label={`Back to reference ${reference.referenceIndex}`}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  focusReference(editor, reference.key)
                  setOpen(false)
                }}
              >
                <Text>{`Back to reference ${reference.referenceIndex}`}</Text>
              </Button>
            ))
          ) : (
            <Text>No footnote references</Text>
          )}
        </Stack>
      </PopoverPopup>
    </Popover>
  )
}

export function EditorFootnoteInsertControl() {
  const editor = useEditor()
  const state = useEditorState()

  return (
    <Button
      variant="ghost"
      size="sm"
      data-slot="editor-footnote-insert-control"
      disabled={!state.editable}
      onMouseDown={(event) => event.preventDefault()}
      onClick={() =>
        editor.dispatchCommand(INSERT_EDITOR_FOOTNOTE_COMMAND, undefined)
      }
    >
      Insert footnote
    </Button>
  )
}

export function EditorFootnoteRenumberControl() {
  const editor = useEditor()
  const state = useEditorState()
  const { snapshot, selected } = useFootnoteSnapshot(editor)

  const duplicate =
    selected?.kind === "definition" &&
    snapshot.definitions.some(
      (definition) => definition.key === selected.key && definition.duplicate,
    )

  return (
    <Button
      variant="ghost"
      size="sm"
      data-slot="editor-footnote-renumber-control"
      disabled={!state.editable || !duplicate || !selected}
      onMouseDown={(event) => event.preventDefault()}
      onClick={() =>
        selected &&
        editor.dispatchCommand(RENUMBER_EDITOR_FOOTNOTE_DEFINITION_COMMAND, {
          key: selected.key,
        })
      }
    >
      Renumber duplicate definition
    </Button>
  )
}

export function EditorFootnoteRemoveControl() {
  const editor = useEditor()
  const state = useEditorState()
  const { selected } = useFootnoteSnapshot(editor)

  return (
    <Button
      variant="ghost"
      size="sm"
      data-slot="editor-footnote-remove-control"
      disabled={!state.editable || !selected}
      onMouseDown={(event) => event.preventDefault()}
      onClick={() =>
        editor.dispatchCommand(REMOVE_EDITOR_FOOTNOTE_COMMAND, undefined)
      }
    >
      Remove selected footnote part
    </Button>
  )
}

export interface EditorFootnoteControlsProps {
  readonly children?: ReactNode
}

export function EditorFootnoteControls({
  children,
}: EditorFootnoteControlsProps) {
  return (
    <HStack data-slot="editor-footnote-controls">
      <EditorFootnoteInsertControl />
      <EditorFootnoteRemoveControl />
      <EditorFootnoteRenumberControl />
      <EditorFootnoteBacklinks />
      {children}
    </HStack>
  )
}
