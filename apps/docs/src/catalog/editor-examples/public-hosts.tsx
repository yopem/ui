"use client"

import { useStableCallback } from "@base-ui/utils/useStableCallback"
import { Box } from "@registry/components/ui/box"
import { Button } from "@registry/components/ui/button"
import { Stack } from "@registry/components/ui/stack"
import { Text } from "@registry/components/ui/text"
import { ToolbarButton } from "@registry/components/ui/toolbar"
import {
  Editor,
  EditorContent,
  EditorFormatButton,
  EditorHistoryButton,
  EditorRoot,
  EditorToolbar,
  useEditor,
} from "@yopem-ui/editor"
import { $getRoot, HISTORY_PUSH_TAG } from "lexical"
import { Suspense, use, useState, type ComponentProps } from "react"

function paragraphState(text: string) {
  return JSON.stringify({
    root: {
      type: "root",
      version: 1,
      direction: null,
      format: "",
      indent: 0,
      children: [
        {
          type: "paragraph",
          version: 1,
          direction: null,
          format: "",
          indent: 0,
          textFormat: 0,
          textStyle: "",
          children: [
            {
              type: "text",
              version: 1,
              detail: 0,
              format: 0,
              mode: "normal",
              style: "",
              text,
            },
          ],
        },
      ],
    },
  })
}

const initialState = paragraphState("Initial document")

const firstState = paragraphState("First document")

const secondState = paragraphState("Second document")

const loadedState = Promise.resolve(paragraphState("Loaded document"))

export function ControlledDocumentActions() {
  const editor = useEditor()

  function replace(text: string, defaultSelection: "rootStart" | "rootEnd") {
    editor.setEditorState(editor.parseEditorState(paragraphState(text)), {
      tag: HISTORY_PUSH_TAG,
    })
    editor.focus(undefined, { defaultSelection })
  }

  const handleReplaceValue = useStableCallback(function handleReplaceValue() {
    replace("Replacement document", "rootEnd")
  })

  const handleResetEditor = useStableCallback(function handleResetEditor() {
    replace("", "rootStart")
  })

  return (
    <>
      <ToolbarButton onClick={handleReplaceValue}>Replace value</ToolbarButton>
      <ToolbarButton onClick={handleResetEditor}>Reset editor</ToolbarButton>
    </>
  )
}

export function AsyncInitializedEditor() {
  const state = use(loadedState)

  return <Editor ariaLabel="Async initialized editor" initialState={state} />
}

export function ControlledEditorExample() {
  return (
    <Stack>
      <Text>
        Replace the native document or reset it. The actions return focus to the
        editor.
      </Text>
      <EditorRoot ariaLabel="Controlled editor" initialState={initialState}>
        <EditorToolbar aria-label="Controlled document actions">
          <ControlledDocumentActions />
          <EditorFormatButton format="bold">Bold</EditorFormatButton>
          <EditorHistoryButton action="undo">Undo</EditorHistoryButton>
          <EditorHistoryButton action="redo">Redo</EditorHistoryButton>
        </EditorToolbar>
        <EditorContent />
      </EditorRoot>
      <Text>
        The next editor waits for a fixed local Promise. It does not fetch or
        save documents.
      </Text>
      <Suspense fallback={<Box render={<output />}>Loading document</Box>}>
        <AsyncInitializedEditor />
      </Suspense>
    </Stack>
  )
}

export function MultipleEditorsExample() {
  const [readOnly, setReadOnly] = useState(false)
  const [firstText, setFirstText] = useState("First document")
  const [secondText, setSecondText] = useState("Second document")

  const handleFirstChange = useStableCallback(function handleFirstChange(
    _state: Parameters<
      NonNullable<ComponentProps<typeof Editor>["onChange"]>
    >[0],
    editor: Parameters<
      NonNullable<ComponentProps<typeof Editor>["onChange"]>
    >[1],
  ) {
    setFirstText(
      editor.getEditorState().read(() => $getRoot().getTextContent()),
    )
  })

  const handleToggleReadOnly = useStableCallback(
    function handleToggleReadOnly() {
      setReadOnly((current) => !current)
    },
  )

  const handleSecondChange = useStableCallback(function handleSecondChange(
    _state: Parameters<
      NonNullable<ComponentProps<typeof Editor>["onChange"]>
    >[0],
    editor: Parameters<
      NonNullable<ComponentProps<typeof Editor>["onChange"]>
    >[1],
  ) {
    setSecondText(
      editor.getEditorState().read(() => $getRoot().getTextContent()),
    )
  })

  return (
    <Stack>
      <Text>Each root owns its content, selection, and local history.</Text>
      <Editor
        ariaLabel="First independent editor"
        initialState={firstState}
        onChange={handleFirstChange}
      />
      <Box render={<output />} aria-label="First document text">
        {firstText}
      </Box>
      <Button onClick={handleToggleReadOnly} aria-pressed={readOnly}>
        Toggle second read only
      </Button>
      <Editor
        ariaLabel="Second independent editor"
        initialState={secondState}
        editable={!readOnly}
        onChange={handleSecondChange}
      />
      <Box render={<output />} aria-label="Second document text">
        {secondText}
      </Box>
    </Stack>
  )
}
