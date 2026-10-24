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
  EditorCode,
  EditorCodeExtension,
  EditorCodeToolbar,
  EditorCodeLanguage,
  EditorCodeCopyButton,
  EditorCodeFormatButton,
  EditorCodeToggle,
  EditorCodeStatus,
} from "@yopem-ui/editor/code"
import { prettierEditorCodeFormatter } from "@yopem-ui/editor/code-format"
import { useState } from "react"

const presetState = JSON.stringify({
  root: {
    type: "root",
    version: 1,
    format: "",
    indent: 0,
    direction: null,
    children: [
      {
        language: "javascript",
        text: "async function fetchUserData(id){const response=await fetch(`/api/users/${id}`);return response.json()}",
      },
      {
        language: "python",
        text: "class TaskManager:\n    def __init__(self):\n        self.tasks = []\n    def add_task(self, task):\n        self.tasks.append(task)",
      },
      { language: "css", text: ".container{display:flex;gap:1rem}" },
    ].map(({ language, text }) => ({
      type: "code",
      version: 1,
      language,
      format: "",
      indent: 0,
      direction: null,
      children: [
        {
          type: "text",
          version: 1,
          text,
          format: 0,
          style: "",
          mode: "normal",
          detail: 0,
        },
      ],
    })),
  },
})

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
      <EditorCode
        ariaLabel="Code preset"
        initialState={presetState}
        formatter={prettierEditorCodeFormatter}
      />
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
          <EditorCodeFormatButton formatter={prettierEditorCodeFormatter} />
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
