"use client"

import type { ChangeEvent, ComponentProps, FormEvent } from "react"

import { useStableCallback } from "@base-ui/utils/useStableCallback"
import { Button } from "@registry/components/ui/button"
import {
  Dialog,
  DialogTrigger,
  DialogPopup,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@registry/components/ui/dialog"
import { Field, FieldLabel } from "@registry/components/ui/field"
import { Form } from "@registry/components/ui/form"
import { Input } from "@registry/components/ui/input"
import { Progress } from "@registry/components/ui/progress"
import { Stack } from "@registry/components/ui/stack"
import { Text } from "@registry/components/ui/text"
import { ToolbarButton } from "@registry/components/ui/toolbar"
import * as stylex from "@stylexjs/stylex"
import { useEditor, useEditorState } from "@yopem-ui/editor"
import { createEditorSelectionBookmark } from "@yopem-ui/editor/selection-bookmark"
import { $getSelection, $isRangeSelection, HISTORY_PUSH_TAG } from "lexical"
import { useState, useSyncExternalStore } from "react"

import type { MediaEmbedType, MediaKind, MediaInput } from "./schema"
import type { MediaUpload } from "./upload"

import { $insertMedia } from "./extension"
import { parseMedia } from "./schema"
import { createMediaUpload } from "./upload"

function preventTriggerFocus(
  event: Parameters<
    NonNullable<ComponentProps<typeof DialogTrigger>["onMouseDown"]>
  >[0],
) {
  event.preventDefault()
}

const styles = stylex.create({
  target: { minBlockSize: 44, minInlineSize: 44 },
})

export function MediaInsertControl({
  kind,
  embedType,
  upload,
}: {
  kind: MediaKind
  embedType?: MediaEmbedType
  upload?: MediaUpload
}) {
  const editor = useEditor()
  const { editable } = useEditorState()
  const [bookmark] = useState(() => createEditorSelectionBookmark(editor))

  const hasBookmark = useSyncExternalStore(
    bookmark.subscribe,
    bookmark.getSnapshot,
    bookmark.getServerSnapshot,
  )

  const [sessionRevision, setSessionRevision] = useState<number | null>(null)
  const [task] = useState(createMediaUpload)

  const state = useSyncExternalStore(
    task.subscribe,
    task.getSnapshot,
    task.getSnapshot,
  )

  const [uploadRootRef] = useState(
    () =>
      function uploadRootRef(element: HTMLDivElement | null) {
        if (!element) {
          task.cancel()

          return
        }

        const unregister = editor.registerEditableListener((isEditable) => {
          if (!isEditable) {
            task.cancel()
            bookmark.clear()
            setSessionRevision(null)
          }
        })

        return () => {
          unregister()
          task.cancel()
        }
      },
  )

  const [open, setOpen] = useState(false)
  const [error, setError] = useState(false)
  const revision = bookmark.getRevision()

  const sessionValid =
    sessionRevision !== null && sessionRevision === revision && hasBookmark

  const label = embedType ?? kind

  const insert = useStableCallback(function insert(value: MediaInput) {
    const media = parseMedia(value)
    let inserted = false

    if (editor.isEditable() && sessionValid) {
      editor.update(
        () => {
          if (
            !editor.isEditable() ||
            bookmark.getRevision() !== sessionRevision ||
            !bookmark.restore() ||
            !$isRangeSelection($getSelection())
          )
            return

          inserted = $insertMedia(media)
        },
        { discrete: true, tag: HISTORY_PUSH_TAG },
      )
    }

    if (!inserted)
      throw new Error("Selection changed. Select an insertion point.")
    bookmark.clear()
    setSessionRevision(null)
    setOpen(false)
    editor.focus()
  })

  const changeOpen = useStableCallback(function changeOpen(next: boolean) {
    if (next) {
      task.reset()
      editor.getEditorState().read(bookmark.capture)
      setSessionRevision(bookmark.getRevision())
      setError(false)
    } else {
      task.cancel()
      bookmark.clear()
      setSessionRevision(null)
    }

    setOpen(next)
  })

  const submitURL = useStableCallback(function submitURL(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()
    const url = new FormData(event.currentTarget).get("url")

    if (url === null || url instanceof File) return

    try {
      insert(
        kind === "embed" && embedType
          ? { kind, url, embedType }
          : { kind, url },
      )
      setError(false)
    } catch {
      setError(true)
    }
  })

  const uploadFile = useStableCallback(async function uploadFile(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.currentTarget.files?.[0]
    event.currentTarget.value = ""

    if (!file) return

    if (!sessionValid || sessionRevision === null || !editor.isEditable()) {
      setError(true)

      return
    }

    if (!upload || kind === "embed") return
    const activeRevision = sessionRevision
    const result = await task.start(file, kind, upload)

    if (!result) return

    if (
      activeRevision !== bookmark.getRevision() ||
      !bookmark.getSnapshot() ||
      !editor.isEditable()
    ) {
      setError(true)

      return
    }

    try {
      insert(result)
    } catch {
      setError(true)
    }
  })

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogTrigger
        render={
          <ToolbarButton
            render={<Button xstyle={styles.target} />}
            disabled={!editable}
          />
        }
        disabled={!editable}
        onMouseDown={preventTriggerFocus}
      >
        Insert {label}
      </DialogTrigger>
      <DialogPopup
        ref={uploadRootRef}
        finalFocus={() => editor.getRootElement()}
      >
        <DialogHeader>
          <DialogTitle>Insert {label}</DialogTitle>
          <DialogDescription>
            Use an HTTPS media URL without credentials.
          </DialogDescription>
        </DialogHeader>
        <Stack>
          <Form onSubmit={submitURL}>
            <Stack>
              <Field>
                <FieldLabel>Media URL</FieldLabel>
                <Input
                  xstyle={styles.target}
                  name="url"
                  type="url"
                  required
                  aria-invalid={error}
                />
              </Field>
              {error && (
                <Text role="alert">Check the URL and insertion point.</Text>
              )}
              {!sessionValid && (
                <Text role="alert">Select an insertion point again.</Text>
              )}
              <Button
                type="submit"
                disabled={
                  !editable || !sessionValid || state.status === "uploading"
                }
                xstyle={styles.target}
              >
                Insert
              </Button>
            </Stack>
          </Form>
          {upload && kind !== "embed" && (
            <>
              <Field>
                <FieldLabel>Upload media</FieldLabel>
                <Input
                  xstyle={styles.target}
                  type="file"
                  disabled={
                    !editable || !sessionValid || state.status === "uploading"
                  }
                  onChange={uploadFile}
                />
              </Field>
              {state.status === "uploading" && (
                <>
                  <Progress value={state.progress} aria-label="Media upload" />
                  <Button
                    type="button"
                    xstyle={styles.target}
                    onClick={task.cancel}
                  >
                    Cancel upload
                  </Button>
                </>
              )}
              {state.status === "error" && (
                <Text role="alert">Upload failed. Try again.</Text>
              )}
              {state.status === "cancelled" && (
                <output>Upload cancelled.</output>
              )}
            </>
          )}
        </Stack>
      </DialogPopup>
    </Dialog>
  )
}
