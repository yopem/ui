"use client"

import type { LexicalEditor } from "lexical"

import { Box } from "@registry/components/ui/box"
import { Button } from "@registry/components/ui/button"
import { Stack } from "@registry/components/ui/stack"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import {
  EditorContent,
  EditorHistoryButton,
  EditorRoot,
  EditorToolbar,
  useEditor,
} from "@yopem-ui/editor"
import {
  EditorEditableCardExtension,
  EditorEditableCardInsertButton,
} from "@yopem-ui/editor/editable-card"
import { $getRoot, $getSelection } from "lexical"
import { Redo2Icon, Undo2Icon } from "lucide-react"
import { useReducer, useState, useSyncExternalStore } from "react"

const extensions = [EditorEditableCardExtension]

const styles = stylex.create({
  root: { gap: `calc(${tokens["--spacing"]} * 4)` },
  section: { minInlineSize: 0 },
})

function createOuterStateStore(editor: LexicalEditor) {
  return {
    subscribe: (listener: () => void) =>
      editor.registerUpdateListener(listener),
    getSnapshot: () =>
      editor.getEditorState().read(() =>
        JSON.stringify({
          text: $getRoot().getTextContent(),
          selection: $getSelection()?.getTextContent() ?? "",
        }),
      ),
  }
}

function EditableCardOuterState() {
  const editor = useEditor()
  const [store] = useState(() => createOuterStateStore(editor))

  const state = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot,
  )

  return (
    <Box
      render={<output aria-label="Outer editor state" />}
      data-testid="editable-card-outer-state"
    >
      {state}
    </Box>
  )
}

export function PublicEditableVoidsExample() {
  const [editable, toggleEditable] = useReducer(
    (current: boolean) => !current,
    true,
  )

  return (
    <Stack xstyle={styles.root}>
      <Button onClick={toggleEditable}>
        {editable ? "Make editor read-only" : "Make editor editable"}
      </Button>
      <Box render={<section aria-label="Editable void workflow" />}>
        <Stack xstyle={styles.section}>
          <EditorRoot
            ariaLabel="Public editable voids editor"
            editable={editable}
            extensions={extensions}
          >
            <EditorToolbar aria-label="Editable card tools">
              <EditorEditableCardInsertButton />
              <EditorHistoryButton
                action="undo"
                aria-label="Undo"
                title="Undo"
                render={<Button variant="ghost" size="icon-sm" />}
              >
                <Undo2Icon aria-hidden="true" size={16} />
              </EditorHistoryButton>
              <EditorHistoryButton
                action="redo"
                aria-label="Redo"
                title="Redo"
                render={<Button variant="ghost" size="icon-sm" />}
              >
                <Redo2Icon aria-hidden="true" size={16} />
              </EditorHistoryButton>
            </EditorToolbar>
            <EditorContent placeholder="Write outer document text…" />
            <EditableCardOuterState />
          </EditorRoot>
        </Stack>
      </Box>
    </Stack>
  )
}
