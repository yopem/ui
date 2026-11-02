"use client"

import { Button } from "@registry/components/ui/button"
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
import { FileCode2Icon, PilcrowIcon, Redo2Icon, Undo2Icon } from "lucide-react"

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
        <EditorBlockButton
          block="code"
          aria-label="Code block"
          title="Code block"
          render={<Button variant="ghost" size="icon-sm" />}
        >
          <FileCode2Icon aria-hidden="true" size={16} />
        </EditorBlockButton>
        <EditorBlockButton
          block="paragraph"
          aria-label="Paragraph"
          title="Paragraph"
          render={<Button variant="ghost" size="icon-sm" />}
        >
          <PilcrowIcon aria-hidden="true" size={16} />
        </EditorBlockButton>
        <EditorCodeLanguage />
        <EditorCodeCopyButton />
        <EditorCodeFormatButton formatter={prettierEditorCodeFormatter} />
        <EditorCodeToggle setting="wrap" />
        <EditorCodeToggle setting="lineNumbers" />
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
        <EditorCodeStatus />
      </EditorCodeToolbar>
      <EditorContent placeholder="Select a code block to edit its language…" />
    </EditorRoot>
  )
}
