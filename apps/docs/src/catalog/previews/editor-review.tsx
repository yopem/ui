"use client"

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
import { useState } from "react"

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
          onChange={(event) => setCaption(event.target.value)}
        />
      </Field>
      <Wrap>
        <Button
          onClick={() =>
            setHost({
              ...host,
              viewer:
                host.viewer?.id === demoHost.viewer.id
                  ? { id: "second-reviewer", name: "Second reviewer" }
                  : demoHost.viewer,
            })
          }
        >
          Change reviewer
        </Button>
        <Button
          onClick={() =>
            setHost({ ...host, viewer: host.viewer ? null : demoHost.viewer })
          }
        >
          {host.viewer ? "Remove reviewer" : "Restore reviewer"}
        </Button>
        <Button aria-pressed={!editable} onClick={() => setEditable(!editable)}>
          Read-only document
        </Button>
        <Button
          aria-pressed={host.replyWhileReadonly}
          onClick={() =>
            setHost({ ...host, replyWhileReadonly: !host.replyWhileReadonly })
          }
        >
          Allow read-only discussion
        </Button>
        <Button onClick={() => setHost({ ...host, visible: !host.visible })}>
          {host.visible ? "Hide discussions" : "Show discussions"}
        </Button>
        <Button
          onClick={() =>
            setHost({
              ...host,
              can:
                host.can === allowDemoReview ? denyDemoReview : allowDemoReview,
            })
          }
        >
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
