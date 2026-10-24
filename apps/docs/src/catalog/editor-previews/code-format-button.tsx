"use client"

import {
  EditorBlockPresentationExtension,
  EditorBlockButton,
  EditorContent,
  EditorHistoryButton,
  EditorRoot,
} from "@yopem-ui/editor"
import {
  EditorCodeExtension,
  EditorCodeFormatButton,
  EditorCodeLanguage,
  type EditorCodeFormatter,
  EditorCodeStatus,
  EditorCodeToolbar,
} from "@yopem-ui/editor/code"

const formatter: EditorCodeFormatter = {
  supports(language) {
    return language === "json"
  },
  format(text) {
    const value: unknown = JSON.parse(text)

    return `${JSON.stringify(value, null, 2)}\n`
  },
}

const extensions = [EditorBlockPresentationExtension, EditorCodeExtension]

const initialState = JSON.stringify({
  root: {
    type: "root",
    version: 1,
    format: "",
    indent: 0,
    direction: null,
    children: [
      {
        type: "code",
        version: 1,
        language: "json",
        format: "",
        indent: 0,
        direction: null,
        children: [
          {
            type: "text",
            version: 1,
            text: '{"count":1}',
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

export function Preview() {
  return (
    <EditorRoot
      ariaLabel="EditorCodeFormatButton preview"
      extensions={extensions}
      initialState={initialState}
    >
      <EditorCodeToolbar aria-label="Code tools">
        <EditorBlockButton block="code" />
        <EditorCodeLanguage />
        <EditorCodeFormatButton formatter={formatter} />
        <EditorHistoryButton action="undo" />
        <EditorCodeStatus />
      </EditorCodeToolbar>
      <EditorContent />
    </EditorRoot>
  )
}
