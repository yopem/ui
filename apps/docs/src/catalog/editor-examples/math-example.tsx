"use client"

import { useStableCallback } from "@base-ui/utils/useStableCallback"
import { Button } from "@registry/components/ui/button"
import { Stack } from "@registry/components/ui/stack"
import {
  EditorBlockButton,
  EditorHistoryButton,
  EditorRoot,
  EditorTableButton,
  EditorToolbar,
} from "@yopem-ui/editor"
import {
  $insertEditorMath,
  EditorMathControl,
  EditorMathExtension,
} from "@yopem-ui/editor/math"
import {
  createEditorTypeahead,
  EditorTypeahead,
  type EditorSlashCommand,
} from "@yopem-ui/editor/typeahead"
import { FileCode2Icon, Redo2Icon, TableIcon, Undo2Icon } from "lucide-react"
import { useState } from "react"

const slashCommands: readonly EditorSlashCommand[] = [
  {
    id: "equation",
    label: "Equation",
    description: "Insert a block equation",
    run() {
      $insertEditorMath({
        kind: "block",
        tex: "\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}",
      })
    },
  },
  {
    id: "inline-equation",
    label: "Inline equation",
    description: "Insert an inline equation",
    run() {
      $insertEditorMath({ kind: "inline", tex: "E=mc^2" })
    },
  },
]

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

function paragraph(text: string) {
  return {
    type: "paragraph",
    version: 1,
    direction: null,
    format: "",
    indent: 0,
    children: [textNode(text)],
  }
}

const initialState = JSON.stringify({
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
        children: [
          textNode("Inline equation: "),
          { type: "editor-math", version: 1, kind: "inline", tex: "E=mc^2" },
          textNode(" (Einstein's famous equation)."),
        ],
      },
      paragraph("Block equation example:"),
      {
        type: "editor-math",
        version: 1,
        kind: "block",
        tex: "\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}",
      },
      paragraph("Code sample: const area = radius * radius;"),
      paragraph("Use a table and slash commands with these equations."),
    ],
  },
})

export function MathExample() {
  const [controller] = useState(() =>
    createEditorTypeahead({ commands: slashCommands }),
  )

  const [extensions] = useState(() => [
    EditorMathExtension,
    controller.extension,
  ])

  const [editable, setEditable] = useState(true)

  const toggleEditable = useStableCallback(function toggleEditable() {
    setEditable((current) => !current)
  })

  return (
    <Stack>
      <Button onClick={toggleEditable}>
        {editable ? "Read only" : "Edit document"}
      </Button>
      <EditorRoot
        ariaLabel="Math editor"
        editable={editable}
        extensions={extensions}
        initialState={initialState}
      >
        <EditorToolbar aria-label="Math tools">
          <EditorMathControl kind="inline" />
          <EditorMathControl kind="block" />
          <EditorMathControl />
          <EditorBlockButton
            block="code"
            aria-label="Code block"
            title="Code block"
            render={<Button variant="ghost" size="icon-sm" />}
          >
            <FileCode2Icon aria-hidden="true" size={16} />
          </EditorBlockButton>
          <EditorTableButton
            aria-label="Insert table"
            title="Insert table"
            render={<Button variant="ghost" size="icon-sm" />}
          >
            <TableIcon aria-hidden="true" size={16} />
          </EditorTableButton>
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
        <EditorTypeahead
          controller={controller}
          placeholder="Type /equation or /inline equation to insert math."
        />
      </EditorRoot>
    </Stack>
  )
}
