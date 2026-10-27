"use client"

import type { MouseEvent } from "react"

import { useStableCallback } from "@base-ui/utils/useStableCallback"
import { Box } from "@registry/components/ui/box"
import { Button } from "@registry/components/ui/button"
import {
  Dialog,
  DialogPopup,
  DialogTitle,
  DialogDescription,
} from "@registry/components/ui/dialog"
import { Field, FieldLabel } from "@registry/components/ui/field"
import { HStack } from "@registry/components/ui/hstack"
import { Stack } from "@registry/components/ui/stack"
import { Text } from "@registry/components/ui/text"
import { Textarea } from "@registry/components/ui/textarea"
import { ToolbarButton } from "@registry/components/ui/toolbar"
import {
  $createNodeSelection,
  $setSelection,
  $getNodeByKey,
  $getSelection,
  HISTORY_PUSH_TAG,
} from "lexical"
import { useState, useSyncExternalStore, type ComponentProps } from "react"

import { $getSelectedEditorMath, $insertEditorMath } from "./math-extension"
import { parseEditorMath, type EditorMathValue } from "./math-model"
import { EditorMathNode } from "./math-node"
import { renderEditorMath } from "./math-render"
import { useEditor, useEditorState } from "./root"
import { createEditorSelectionBookmark } from "./selection-bookmark"

function preventToolbarMouseDown(event: MouseEvent<HTMLButtonElement>) {
  event.preventDefault()
}

export function EditorMathPreview({ value }: { value: EditorMathValue }) {
  const result = renderEditorMath(value)

  if (!result.ok) return <Text role="alert">{result.error}</Text>

  return (
    <Box
      aria-label={value.tex}
      dangerouslySetInnerHTML={{ __html: result.html }}
    />
  )
}

export function EditorMathControl({
  kind,
}: {
  kind?: EditorMathValue["kind"]
}) {
  const editor = useEditor()
  const { editable } = useEditorState()
  const [bookmark] = useState(() => createEditorSelectionBookmark(editor))
  useSyncExternalStore(
    bookmark.subscribe,
    bookmark.getSnapshot,
    bookmark.getServerSnapshot,
  )

  const [session, setSession] = useState<{
    revision: number
    node: EditorMathNode | null
    kind: EditorMathValue["kind"]
  } | null>(null)

  const [value, setValue] = useState<EditorMathValue>({
    kind: kind ?? "inline",
    tex: "x^2",
  })

  const [error, setError] = useState("")
  const valid = renderEditorMath(value).ok

  const close = useStableCallback(function close() {
    editor.update(
      () => {
        if (!session || bookmark.getRevision() !== session.revision) return

        if (
          session.node &&
          $getNodeByKey(session.node.getKey()) === session.node
        ) {
          const selection = $createNodeSelection()
          selection.add(session.node.getKey())
          $setSelection(selection)
        } else bookmark.restore()
      },
      { discrete: true },
    )
    setSession(null)
    bookmark.clear()
    editor.focus()
  })

  const open = useStableCallback(function open() {
    if (!editor.isEditable()) return
    editor.getEditorState().read(() => {
      const node = kind ? null : $getSelectedEditorMath()

      if (!kind && !node) {
        setError("Select one equation")

        return
      }

      bookmark.capture()

      const nextValue = node?.getValue() ?? {
        kind: kind ?? "inline",
        tex: "x^2",
      }

      setValue(nextValue)
      setError("")
      setSession({
        revision: bookmark.getRevision(),
        node,
        kind: nextValue.kind,
      })
    })
  })

  const apply = useStableCallback(function apply(remove = false) {
    if (!session || !editor.isEditable() || (!remove && !valid)) return
    let applied = false
    editor.update(
      () => {
        if (!editor.isEditable() || bookmark.getRevision() !== session.revision)
          return

        if (session.node) {
          const node = $getNodeByKey(session.node.getKey())

          if (
            !(node instanceof EditorMathNode) ||
            node !== session.node ||
            !node.isAttached() ||
            ($getSelection() !== null && $getSelectedEditorMath() !== node)
          )
            return

          if (remove) {
            node.selectPrevious()
            node.remove()
          } else {
            node.setValue(parseEditorMath(value))
            node.selectNext()
          }

          applied = true
        } else if (!remove && bookmark.restore())
          applied = $insertEditorMath(parseEditorMath(value))
      },
      { discrete: true, tag: HISTORY_PUSH_TAG },
    )

    if (applied) close()
    else setError("Selection expired. Close and select again.")
  })

  const handleOpenChange = useStableCallback(function handleOpenChange(
    next: boolean,
  ) {
    if (!next) close()
  })

  const handleFinalFocus = useStableCallback(function handleFinalFocus() {
    return editor.getRootElement()
  })

  const handleChange = useStableCallback(function handleChange(
    event: Parameters<
      NonNullable<ComponentProps<typeof Textarea>["onChange"]>
    >[0],
  ) {
    setValue((current) => ({
      ...current,
      tex: event.currentTarget.value,
    }))
  })

  const handleKeyDown = useStableCallback(function handleKeyDown(
    event: Parameters<
      NonNullable<ComponentProps<typeof Textarea>["onKeyDown"]>
    >[0],
  ) {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault()
      apply()
    }
  })

  const handleApply = useStableCallback(function handleApply() {
    apply()
  })

  const handleDelete = useStableCallback(function handleDelete() {
    apply(true)
  })

  return (
    <>
      <ToolbarButton
        render={<Button variant="ghost" size="sm" />}
        aria-haspopup="dialog"
        aria-expanded={session !== null}
        disabled={!editable}
        onMouseDown={preventToolbarMouseDown}
        onClick={open}
      >
        {kind ? `Insert ${kind} equation` : "Edit equation"}
      </ToolbarButton>
      {!session && error ? <Box render={<output />}>{error}</Box> : null}
      <Dialog open={session !== null} onOpenChange={handleOpenChange}>
        <DialogPopup finalFocus={handleFinalFocus}>
          <Stack>
            <DialogTitle>
              {kind ? "Insert equation" : "Edit equation"}
            </DialogTitle>
            <DialogDescription>
              Enter a TeX expression. Apply changes or cancel.
            </DialogDescription>
            <Field>
              <FieldLabel>TeX expression</FieldLabel>
              <Textarea
                value={value.tex}
                maxLength={4096}
                disabled={!editable}
                aria-invalid={!valid}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
              />
            </Field>
            <EditorMathPreview value={value} />
            {error ? <Text role="alert">{error}</Text> : null}
            <HStack>
              <Button disabled={!editable || !valid} onClick={handleApply}>
                Apply equation
              </Button>
              <Button variant="outline" onClick={close}>
                Cancel
              </Button>
              {session?.node ? (
                <Button
                  variant="destructive"
                  disabled={!editable}
                  onClick={handleDelete}
                >
                  Delete equation
                </Button>
              ) : null}
            </HStack>
          </Stack>
        </DialogPopup>
      </Dialog>
    </>
  )
}

export function EditorMathControls() {
  return (
    <>
      <EditorMathControl kind="inline" />
      <EditorMathControl kind="block" />
      <EditorMathControl />
    </>
  )
}
