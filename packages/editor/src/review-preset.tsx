"use client"

import * as stylex from "@stylexjs/stylex"
import { useState } from "react"

import type { EditorProps } from "./extension"
import type { EditorReviewHost } from "./review-model"

import { EditorBlockPresentationExtension } from "./block-presentation-extension"
import {
  EditorToolbar,
  EditorFormatButton,
  EditorHistoryButton,
} from "./controls"
import {
  EditorReviewCreateControl,
  EditorReviewDiffControl,
  EditorReviewModeControl,
  EditorReviewPanel,
  EditorReviewProvider,
} from "./review-components"
import { createEditorReview } from "./review-extension"
import { EditorContent, EditorRoot } from "./root"
import { EditorTablePresentationExtension } from "./table-presentation"

const reviewStyles = stylex.create({ toolbar: { flexWrap: "wrap" } })

export function EditorReviewPreset({
  host,
  placeholder,
  extensions = [],
  ...props
}: EditorProps & { host: EditorReviewHost | null }) {
  const [controller] = useState(createEditorReview)

  const [reviewExtensions] = useState(() => [
    EditorBlockPresentationExtension,
    EditorTablePresentationExtension,
    ...extensions,
    controller.extension,
  ])

  return (
    <EditorRoot {...props} extensions={reviewExtensions}>
      <EditorReviewProvider controller={controller} host={host}>
        <EditorToolbar xstyle={reviewStyles.toolbar}>
          <EditorReviewModeControl />
          <EditorFormatButton format="bold" />
          <EditorFormatButton format="italic" />
          <EditorFormatButton format="underline" />
          <EditorFormatButton format="strikethrough" />
          <EditorFormatButton format="code" />
          <EditorHistoryButton action="undo" />
          <EditorHistoryButton action="redo" />
        </EditorToolbar>
        <EditorContent placeholder={placeholder} />
        <EditorReviewCreateControl />
        <EditorReviewDiffControl />
        <EditorReviewPanel />
      </EditorReviewProvider>
    </EditorRoot>
  )
}
