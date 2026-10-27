"use client"

import { useStableCallback } from "@base-ui/utils/useStableCallback"
import { Button } from "@registry/components/ui/button"
import { Field, FieldLabel } from "@registry/components/ui/field"
import { Input } from "@registry/components/ui/input"
import { Stack } from "@registry/components/ui/stack"
import { Text } from "@registry/components/ui/text"
import { Wrap } from "@registry/components/ui/wrap"
import * as stylex from "@stylexjs/stylex"
import {
  EditorContent,
  EditorRoot,
  EditorToolbar,
  EditorFormatButton,
  EditorHistoryButton,
  EditorBlockPresentationExtension,
  EditorTablePresentationExtension,
} from "@yopem-ui/editor"
import {
  createEditorReview,
  EditorReviewProvider,
  EditorReviewCreateControl,
  EditorReviewDiffControl,
  EditorReviewModeControl,
  EditorReviewPanel,
  type EditorReviewHost,
} from "@yopem-ui/editor/review"
import { useState, type ChangeEvent } from "react"

function allowDemoReview() {
  return true
}

function denyDemoReview() {
  return false
}

const demoHost = {
  viewer: { id: "demo-reviewer", name: "Demo reviewer" },
  visible: true,
  replyWhileReadonly: false,
  can: allowDemoReview,
}

const reviewStyles = stylex.create({ toolbar: { flexWrap: "wrap" } })

export function Preview() {
  const [controller] = useState(createEditorReview)

  const [extensions] = useState(() => [
    EditorBlockPresentationExtension,
    EditorTablePresentationExtension,
    controller.extension,
  ])

  const [host, setHost] = useState<EditorReviewHost>(demoHost)
  const [editable, setEditable] = useState(true)
  const [caption, setCaption] = useState("Review example")

  const changeCaption = useStableCallback(function changeCaption(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    setCaption(event.target.value)
  })

  const changeReviewer = useStableCallback(function changeReviewer() {
    setHost((current) => ({
      ...current,
      viewer:
        current.viewer?.id === demoHost.viewer.id
          ? { id: "second-reviewer", name: "Second reviewer" }
          : demoHost.viewer,
    }))
  })

  const toggleReviewer = useStableCallback(function toggleReviewer() {
    setHost((current) => ({
      ...current,
      viewer: current.viewer ? null : demoHost.viewer,
    }))
  })

  const toggleEditable = useStableCallback(function toggleEditable() {
    setEditable((current) => !current)
  })

  const toggleReplyWhileReadonly = useStableCallback(
    function toggleReplyWhileReadonly() {
      setHost((current) => ({
        ...current,
        replyWhileReadonly: !current.replyWhileReadonly,
      }))
    },
  )

  const toggleVisibility = useStableCallback(function toggleVisibility() {
    setHost((current) => ({ ...current, visible: !current.visible }))
  })

  const toggleReviewPermission = useStableCallback(
    function toggleReviewPermission() {
      setHost((current) => ({
        ...current,
        can: current.can === allowDemoReview ? denyDemoReview : allowDemoReview,
      }))
    },
  )

  return (
    <Stack>
      <Text>
        Preview identities stay local. Supply verified identity and server
        policies in your application.
      </Text>
      <Field>
        <FieldLabel>Document caption</FieldLabel>
        <Input
          aria-label="Document caption"
          value={caption}
          onChange={changeCaption}
        />
      </Field>
      <Wrap>
        <Button onClick={changeReviewer}>Change reviewer</Button>
        <Button onClick={toggleReviewer}>
          {host.viewer ? "Remove reviewer" : "Restore reviewer"}
        </Button>
        <Button aria-pressed={!editable} onClick={toggleEditable}>
          Read-only document
        </Button>
        <Button
          aria-pressed={host.replyWhileReadonly}
          onClick={toggleReplyWhileReadonly}
        >
          Allow read-only discussion
        </Button>
        <Button onClick={toggleVisibility}>
          {host.visible ? "Hide discussions" : "Show discussions"}
        </Button>
        <Button onClick={toggleReviewPermission}>
          {host.can === allowDemoReview
            ? "Deny review actions"
            : "Allow review actions"}
        </Button>
      </Wrap>
      <EditorRoot
        ariaLabel="Review document"
        editable={editable}
        extensions={extensions}
      >
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
          <EditorContent placeholder="Write text, then select text to comment." />
          <EditorReviewCreateControl />
          <EditorReviewDiffControl />
          <EditorReviewPanel />
        </EditorReviewProvider>
      </EditorRoot>
    </Stack>
  )
}
