"use client"

import { Box } from "@registry/components/ui/box"
import { Button } from "@registry/components/ui/button"
import { Fieldset, FieldsetLegend } from "@registry/components/ui/fieldset"
import { HStack } from "@registry/components/ui/hstack"
import { Stack } from "@registry/components/ui/stack"
import { Text } from "@registry/components/ui/text"
import {
  EditorContent,
  EditorHistoryButton,
  EditorRoot,
  EditorToolbar,
  useEditor,
  useEditorState,
} from "@yopem-ui/editor"
import {
  createEditorEditingRulesExtension,
  SET_EDITOR_SINGLE_BLOCK_MODE_COMMAND,
  type EditorSingleBlockMode,
} from "@yopem-ui/editor/editing-rules"
import { EditorTablePresentationExtension } from "@yopem-ui/editor/table-presentation"
import { useState } from "react"

const exitExtensions = [
  createEditorEditingRulesExtension(),
  EditorTablePresentationExtension,
]

const extensions = [
  createEditorEditingRulesExtension({ singleBlockMode: "single-block" }),
]

const initialState = JSON.stringify({
  root: {
    type: "root",
    version: 1,
    format: "",
    indent: 0,
    direction: null,
    children: [
      {
        type: "paragraph",
        version: 1,
        format: "",
        indent: 0,
        direction: null,
        children: [
          {
            type: "text",
            version: 1,
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
            text: "Type text, Enter, and plain-text paste.",
          },
        ],
      },
    ],
  },
})

export function EditingModeControls() {
  const editor = useEditor()
  const { editable } = useEditorState()

  const [mode, setMode] =
    useState<Exclude<EditorSingleBlockMode, "off">>("single-block")

  const [status, setStatus] = useState("Single block mode is active.")

  function selectMode(nextMode: Exclude<EditorSingleBlockMode, "off">) {
    if (
      !editor.dispatchCommand(SET_EDITOR_SINGLE_BLOCK_MODE_COMMAND, nextMode)
    ) {
      setStatus("Keep one top-level paragraph to change mode.")

      return
    }

    setMode(nextMode)
    setStatus(
      nextMode === "single-block"
        ? "Single block mode is active."
        : "Single line mode is active.",
    )
  }

  function selectSingleBlockMode() {
    selectMode("single-block")
  }

  function selectSingleLineMode() {
    selectMode("single-line")
  }

  return (
    <Stack>
      <Fieldset>
        <FieldsetLegend>Single-block editing mode</FieldsetLegend>
        <HStack>
          <Button
            type="button"
            variant="outline"
            aria-pressed={mode === "single-block"}
            disabled={!editable}
            onClick={selectSingleBlockMode}
          >
            Single block
          </Button>
          <Button
            type="button"
            variant="outline"
            aria-pressed={mode === "single-line"}
            disabled={!editable}
            onClick={selectSingleLineMode}
          >
            Single line
          </Button>
        </HStack>
      </Fieldset>
      <Box render={<output aria-live="polite" />}>{status}</Box>
    </Stack>
  )
}

function textNode(text: string) {
  return {
    type: "text",
    version: 1,
    detail: 0,
    format: 0,
    mode: "normal",
    style: "",
    text,
  }
}

const exitState = JSON.stringify({
  root: {
    type: "root",
    version: 1,
    format: "",
    indent: 0,
    direction: null,
    children: [
      {
        type: "quote",
        version: 1,
        format: "",
        indent: 0,
        direction: null,
        children: [textNode("Quoted boundary")],
      },
      {
        type: "code",
        version: 1,
        format: "",
        indent: 0,
        direction: null,
        language: "javascript",
        children: [textNode("Code boundary")],
      },
      {
        type: "table",
        version: 1,
        format: "",
        indent: 0,
        direction: null,
        children: [
          {
            type: "tablerow",
            version: 1,
            format: "",
            indent: 0,
            direction: null,
            children: [
              {
                type: "tablecell",
                version: 1,
                format: "",
                indent: 0,
                direction: null,
                headerState: 0,
                colSpan: 1,
                rowSpan: 1,
                children: [
                  {
                    type: "paragraph",
                    version: 1,
                    format: "",
                    indent: 0,
                    direction: null,
                    children: [textNode("Cell boundary")],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
})

export function PublicEditingRulesExample() {
  const [editable, setEditable] = useState(true)

  function toggleEditable() {
    setEditable((current) => !current)
  }

  return (
    <Stack>
      <Text>
        Use a collapsed selection for Mod+Enter in the exit-break editor. Add
        Shift to insert before the root block. Nested code and table content
        stays intact.
      </Text>
      <Button onClick={toggleEditable} aria-pressed={!editable}>
        {editable ? "Make rule editors read-only" : "Enable rule editors"}
      </Button>
      <Fieldset>
        <FieldsetLegend>Exit break</FieldsetLegend>
        <EditorRoot
          ariaLabel="Exit break editor"
          extensions={exitExtensions}
          initialState={exitState}
          editable={editable}
        >
          <EditorToolbar aria-label="Exit break history">
            <EditorHistoryButton action="undo" />
            <EditorHistoryButton action="redo" />
          </EditorToolbar>
          <EditorContent />
        </EditorRoot>
      </Fieldset>
      <Fieldset>
        <FieldsetLegend>One native paragraph</FieldsetLegend>
        <EditorRoot
          ariaLabel="Single block editor"
          extensions={extensions}
          initialState={initialState}
          editable={editable}
        >
          <EditingModeControls />
          <EditorToolbar aria-label="Single block history">
            <EditorHistoryButton action="undo" />
            <EditorHistoryButton action="redo" />
          </EditorToolbar>
          <EditorContent placeholder="Type or paste plain text…" />
        </EditorRoot>
      </Fieldset>
      <Text>
        Single-block modes require one top-level paragraph. Other shapes keep
        native editing; this extension is not a document validator. Enter and
        modifier shortcuts stay within a valid single paragraph. Single line
        mode removes new pasted line breaks, not existing content. Rich and
        non-text paste is rejected unless an earlier host handler owns it. Empty
        converted text preserves the selection. Input is limited to 1 MiB and
        2501 lines. Tab stays native. Full autoformat, tabbable controls,
        placeholders, and plugin-rules parity are not included. Runtime behavior
        remains unverified.
      </Text>
    </Stack>
  )
}
