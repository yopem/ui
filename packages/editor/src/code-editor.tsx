"use client"

import { useState } from "react"

import type { EditorCodeFormatter } from "./code-model"
import type { EditorProps } from "./extension"

import {
  EditorCodeToolbar,
  EditorCodeLanguage,
  EditorCodeCopyButton,
  EditorCodeFormatButton,
  EditorCodeToggle,
  EditorCodeStatus,
} from "./code-controls"
import { EditorCodeExtension } from "./code-extension"
import { EditorBlockButton, EditorHistoryButton } from "./controls"
import { EditorRoot, EditorContent } from "./root"

export type EditorCodeProps = EditorProps & {
  formatter?: EditorCodeFormatter
}

export function EditorCode({
  formatter,
  placeholder,
  extensions: suppliedExtensions,
  ariaLabel = "Code editor",
  ...props
}: EditorCodeProps) {
  const [extensions] = useState(() => [
    EditorCodeExtension,
    ...(suppliedExtensions ?? []),
  ])

  return (
    <EditorRoot {...props} ariaLabel={ariaLabel} extensions={extensions}>
      <EditorCodeToolbar aria-label={`${ariaLabel} tools`}>
        <EditorBlockButton block="code" />
        <EditorBlockButton block="paragraph" />
        <EditorCodeLanguage />
        <EditorCodeCopyButton />
        <EditorCodeFormatButton formatter={formatter} />
        <EditorCodeToggle setting="wrap" />
        <EditorCodeToggle setting="lineNumbers" />
        <EditorHistoryButton action="undo" />
        <EditorHistoryButton action="redo" />
        <EditorCodeStatus />
      </EditorCodeToolbar>
      <EditorContent placeholder={placeholder} />
    </EditorRoot>
  )
}
