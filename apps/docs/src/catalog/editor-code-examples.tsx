"use client"

import type { MouseEvent } from "react"

import { Button } from "@registry/components/ui/button"
import { Stack } from "@registry/components/ui/stack"
import {
  EditorRoot,
  EditorContent,
  EditorBlockButton,
  EditorHistoryButton,
  EditorIndentButton,
  EditorTableButton,
  useEditor,
} from "@yopem-ui/editor"
import {
  EditorCodeExtension,
  EditorCodeToolbar,
  EditorCodeLanguage,
  EditorCodeCopyButton,
  EditorCodeToggle,
  EditorCodeStatus,
} from "@yopem-ui/editor/code"
import { useState } from "react"

const extensions = [EditorCodeExtension]

function EditorCodeHostReplacement() {
  const editor = useEditor()

  function preserveFocus(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault()
  }

  function replaceDocument() {
    const state = editor.parseEditorState({
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
                text: "Host replacement",
                format: 0,
                style: "",
                mode: "normal",
                detail: 0,
              },
            ],
          },
        ],
      },
    })

    editor.setEditorState(state)
  }

  return (
    <Button
      variant="outline"
      onMouseDown={preserveFocus}
      onClick={replaceDocument}
    >
      Replace code document
    </Button>
  )
}

export function EditorCodeExamples() {
  const [editable, setEditable] = useState(true)
  const [toolsDisabled, setToolsDisabled] = useState(false)

  function toggleEditable() {
    setEditable(!editable)
  }

  function toggleTools() {
    setToolsDisabled(!toolsDisabled)
  }

  return (
    <Stack data-slot="editor-code-demo">
      <EditorRoot
        ariaLabel="Code editor"
        extensions={extensions}
        editable={editable}
      >
        <EditorCodeToolbar aria-label="Code tools" disabled={toolsDisabled}>
          <EditorBlockButton block="code" />
          <EditorBlockButton block="paragraph" />
          <EditorTableButton />
          <EditorCodeLanguage />
          <EditorCodeCopyButton />
          <EditorCodeToggle setting="wrap" />
          <EditorCodeToggle setting="lineNumbers" />
          <EditorIndentButton direction="indent" />
          <EditorIndentButton direction="outdent" />
          <EditorHistoryButton action="undo" />
          <EditorHistoryButton action="redo" />
          <EditorCodeStatus />
        </EditorCodeToolbar>
        <EditorContent placeholder="Write code, then select Code block." />
        <EditorCodeHostReplacement />
      </EditorRoot>
      <Button
        variant="outline"
        aria-pressed={toolsDisabled}
        onClick={toggleTools}
      >
        {toolsDisabled ? "Enable code tools" : "Disable code tools"}
      </Button>
      <Button
        variant="outline"
        aria-pressed={!editable}
        onClick={toggleEditable}
      >
        Code read-only
      </Button>
    </Stack>
  )
}
