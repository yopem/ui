"use client"

import {
  EditorBlockButton,
  EditorContent,
  EditorHistoryButton,
  EditorRoot,
} from "@yopem-ui/editor"
import {
  EditorCodeCopyButton,
  EditorCodeExtension,
  EditorCodeFormatButton,
  EditorCodeLanguage,
  EditorCodeStatus,
  EditorCodeToggle,
  EditorCodeToolbar,
} from "@yopem-ui/editor/code"
import { prettierEditorCodeFormatter } from "@yopem-ui/editor/code-format"

const extensions = [EditorCodeExtension]

function codeBlock(language: string, text: string) {
  return {
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
  }
}

const initialState = JSON.stringify({
  root: {
    type: "root",
    version: 1,
    format: "",
    indent: 0,
    direction: null,
    children: [
      codeBlock("javascript", "const answer=42"),
      codeBlock("python", 'print("hello")'),
      codeBlock("css", ".example{color:teal}"),
    ],
  },
})

export function PublicCodeExample() {
  return (
    <EditorRoot
      ariaLabel="Public code editor"
      extensions={extensions}
      initialState={initialState}
    >
      <EditorCodeToolbar aria-label="Public code tools">
        <EditorBlockButton block="code" />
        <EditorBlockButton block="paragraph" />
        <EditorCodeLanguage />
        <EditorCodeCopyButton />
        <EditorCodeFormatButton formatter={prettierEditorCodeFormatter} />
        <EditorCodeToggle setting="wrap" />
        <EditorCodeToggle setting="lineNumbers" />
        <EditorHistoryButton action="undo" />
        <EditorHistoryButton action="redo" />
        <EditorCodeStatus />
      </EditorCodeToolbar>
      <EditorContent placeholder="Select a code block to edit its language…" />
    </EditorRoot>
  )
}
