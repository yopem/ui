"use client"

import type { MediaUpload } from "@yopem-ui/editor/media"
import type { ChangeEvent, FormEvent, KeyboardEvent } from "react"

import { useStableCallback } from "@base-ui/utils/useStableCallback"
import { Box } from "@registry/components/ui/box"
import { Button } from "@registry/components/ui/button"
import { Field, FieldLabel } from "@registry/components/ui/field"
import { NativeSelect } from "@registry/components/ui/native-select"
import { Stack } from "@registry/components/ui/stack"
import { Text } from "@registry/components/ui/text"
import { Wrap } from "@registry/components/ui/wrap"
import {
  EditorContent,
  EditorRoot,
  EditorToolbar,
  useEditor,
} from "@yopem-ui/editor"
import {
  createMediaExtension,
  MediaInsertControl,
  mediaKinds,
} from "@yopem-ui/editor/media"
import { $getRoot } from "lexical"
import { useId, useReducer, useRef, useState } from "react"

const extensions = [
  createMediaExtension({ embedPolicy: { providers: ["vimeo"] } }),
]

export function EditorMediaHost({ upload }: { upload?: MediaUpload }) {
  const editor = useEditor()
  const selectId = useId()
  const [mode, setMode] = useState("none")
  const [completedMode, setCompletedMode] = useState("none")

  const [evidence, setEvidence] = useState<{
    mode: string
    beforeKey: string
    afterKey: string
    beforeSize: number
    afterSize: number
    committedText: string
    reentrantSubmitPrevented: boolean
  } | null>(null)

  const submitting = useRef(false)

  const handleSubmitCapture = useStableCallback(function handleSubmitCapture(
    event: FormEvent<HTMLDivElement>,
  ) {
    const form = event.target

    if (
      event.defaultPrevented ||
      submitting.current ||
      mode === "none" ||
      !(form instanceof HTMLFormElement)
    )
      return
    const reentrant = mode === "reentrant-content" || mode === "reentrant-no-op"

    if (reentrant) event.preventDefault()
    submitting.current = true

    try {
      editor.update(
        () => {
          const node = $getRoot().getAllTextNodes()[0]

          if (!node) return
          const beforeKey = node.getKey()
          const beforeSize = node.getTextContentSize()

          if (mode === "queued-content" || mode === "reentrant-content")
            node.setTextContent("Host changed same node")

          const reentrantSubmitPrevented =
            reentrant &&
            !form.dispatchEvent(
              new SubmitEvent("submit", { bubbles: true, cancelable: true }),
            )

          if (mode === "reentrant-content")
            node.setTextContent("Host finished same node")

          const committedText = editor
            .getEditorState()
            .read(() => $getRoot().getTextContent())

          setEvidence({
            mode,
            beforeKey,
            afterKey: node.getKey(),
            beforeSize,
            afterSize: node.getTextContentSize(),
            committedText,
            reentrantSubmitPrevented,
          })
        },
        { onUpdate: () => setCompletedMode(mode) },
      )
    } catch (error) {
      submitting.current = false
      throw error
    }

    submitting.current = false
  })

  const changeMode = useStableCallback(function changeMode(
    event: ChangeEvent<HTMLSelectElement>,
  ) {
    setMode(event.currentTarget.value)
  })

  return (
    <Stack onSubmitCapture={handleSubmitCapture}>
      <Field>
        <FieldLabel htmlFor={selectId}>Host submit update</FieldLabel>
        <NativeSelect id={selectId} value={mode} onChange={changeMode}>
          <option value="none">No host update</option>
          <option value="queued-content">Queue a same-node text change</option>
          <option value="queued-no-op">
            Queue an update without a content change
          </option>
          <option value="reentrant-content">Submit during a text update</option>
          <option value="reentrant-no-op">
            Submit during an update without a content change
          </option>
        </NativeSelect>
      </Field>
      <Text>
        Reentrant modes forward one submit event inside the native update.
      </Text>
      <EditorToolbar>
        <Wrap>
          {mediaKinds.map((kind) => (
            <MediaInsertControl key={kind} kind={kind} upload={upload} />
          ))}
        </Wrap>
      </EditorToolbar>
      <EditorContent placeholder="Select an insertion point." />
      <output
        aria-label="Host submit evidence"
        data-mode={evidence?.mode}
        data-before-key={evidence?.beforeKey}
        data-after-key={evidence?.afterKey}
        data-before-size={evidence?.beforeSize}
        data-after-size={evidence?.afterSize}
        data-committed-text={evidence?.committedText}
        data-completed-mode={completedMode}
        data-reentrant-submit-prevented={evidence?.reentrantSubmitPrevented}
      >
        {evidence?.mode}
      </output>
    </Stack>
  )
}

export function EditorMediaExample({ upload }: { upload?: MediaUpload }) {
  const [editable, toggleEditable] = useReducer(
    (current: boolean) => !current,
    true,
  )

  const handleKeyDown = useStableCallback(function handleKeyDown(
    event: KeyboardEvent<HTMLElement>,
  ) {
    if (
      event.defaultPrevented ||
      event.nativeEvent.defaultPrevented ||
      ("baseUIHandlerPrevented" in event &&
        event.baseUIHandlerPrevented === true) ||
      ("baseUIHandlerPrevented" in event.nativeEvent &&
        event.nativeEvent.baseUIHandlerPrevented === true) ||
      !event.nativeEvent.isTrusted ||
      event.nativeEvent.isComposing ||
      event.nativeEvent.keyCode === 229 ||
      event.getModifierState("AltGraph") ||
      !event.ctrlKey ||
      !event.altKey ||
      event.metaKey ||
      event.shiftKey ||
      event.code !== "KeyE"
    )
      return

    event.preventDefault()
    toggleEditable()
  })

  return (
    <Box
      render={<section />}
      aria-label="Media editor"
      onKeyDown={handleKeyDown}
    >
      <Button onClick={toggleEditable} aria-keyshortcuts="Control+Alt+E">
        {editable ? "Read only" : "Edit media"}
      </Button>
      <Text>
        Press Control+Alt+E to change editability, including inside the media
        dialog.
      </Text>
      <EditorRoot
        ariaLabel="Media content"
        editable={editable}
        extensions={extensions}
      >
        <EditorMediaHost upload={upload} />
      </EditorRoot>
    </Box>
  )
}
