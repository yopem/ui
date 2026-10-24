"use client"

import type { ReactNode } from "react"

import { Stack } from "@registry/components/ui/stack"
import {
  EditorContent,
  EditorRoot,
  EditorToolbar,
  EditorHistoryButton,
} from "@yopem-ui/editor"
import {
  EditorReviewReplyForm,
  EditorReviewDiffControl,
  EditorReviewThread,
  EditorReviewComment,
  EditorReviewDecisionControls,
  EditorReviewRichComposer,
  type EditorReviewRichContentValue,
  createEditorReview,
  EditorReviewProvider,
  EditorReviewModeControl,
  EditorReviewCreateControl,
  EditorReviewPanel,
  makeReviewRichContent,
} from "@yopem-ui/editor/review"
import { useState } from "react"

export const demoComment = {
  id: "demo-comment",
  author: { id: "demo-reviewer", name: "Demo reviewer" },
  text: "Review content",
  content: makeReviewRichContent("Review content"),
  createdAt: 1,
  updatedAt: 1,
}

const documentContent = makeReviewRichContent(
  "Select this text to comment or suggest an edit.",
)

const initialState = JSON.stringify({
  root: {
    ...documentContent.root,
    children: documentContent.root.children.map((paragraph) => ({
      ...paragraph,
      children: [
        {
          type: "mark",
          version: 1,
          direction: null,
          format: "",
          indent: 0,
          ids: ["demo-thread"],
          children: paragraph.children,
        },
        {
          type: "text",
          version: 1,
          text: " Proposed text",
          detail: 0,
          format: 0,
          mode: "normal",
          style: "",
          $: {
            yopemSuggestion: {
              id: "demo-suggestion",
              author: demoComment.author,
              createdAt: 1,
              kind: "insert",
              beforeFormat: 0,
            },
          },
        },
      ],
    })),
    $: {
      yopemReview: {
        version: 1,
        threads: [
          { id: "demo-thread", resolved: false, comments: [demoComment] },
        ],
      },
    },
  },
})

const host = {
  viewer: demoComment.author,
  visible: true,
  replyWhileReadonly: false,
  can: () => true,
}

export function ReviewExample({ children }: { children?: ReactNode }) {
  const [controller] = useState(createEditorReview)
  const [extensions] = useState(() => [controller.extension])

  return (
    <EditorRoot
      initialState={initialState}
      extensions={extensions}
      ariaLabel="Review document"
    >
      <EditorReviewProvider controller={controller} host={host}>
        <Stack>
          <EditorToolbar>
            <EditorReviewModeControl />
            <EditorHistoryButton action="undo" />
            <EditorHistoryButton action="redo" />
          </EditorToolbar>
          <EditorContent />
          <EditorReviewCreateControl />
          {children ?? <EditorReviewPanel />}
        </Stack>
      </EditorReviewProvider>
    </EditorRoot>
  )
}

export function ReviewProviderExample() {
  return <ReviewExample />
}

export function ReviewModeExample() {
  return (
    <ReviewExample>
      <EditorReviewModeControl />
    </ReviewExample>
  )
}

export function ReviewCreateExample() {
  return (
    <ReviewExample>
      <EditorReviewPanel />
    </ReviewExample>
  )
}

export function ReviewReplyExample() {
  return (
    <ReviewExample>
      <EditorReviewReplyForm id="demo-thread" />
    </ReviewExample>
  )
}

export function ReviewDiffExample() {
  return (
    <ReviewExample>
      <EditorReviewDiffControl />
      <EditorReviewPanel />
    </ReviewExample>
  )
}

export function ReviewPanelExample() {
  return (
    <ReviewExample>
      <EditorReviewPanel />
    </ReviewExample>
  )
}

export function ReviewThreadExample() {
  return (
    <ReviewExample>
      <EditorReviewThread id="demo-thread" />
    </ReviewExample>
  )
}

export function ReviewCommentExample() {
  return (
    <ReviewExample>
      <EditorReviewComment threadId="demo-thread" comment={demoComment} />
    </ReviewExample>
  )
}

export function ReviewDecisionExample() {
  return (
    <ReviewExample>
      <EditorReviewDecisionControls id="demo-suggestion" />
      <EditorReviewPanel />
    </ReviewExample>
  )
}

export function ReviewKeyboardExample() {
  const [, setDraft] = useState<EditorReviewRichContentValue | null>(null)

  return <EditorReviewRichComposer label="Keyboard draft" onChange={setDraft} />
}
