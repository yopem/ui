"use client"

import type { MouseEvent } from "react"

import { Box } from "@registry/components/ui/box"
import { Button } from "@registry/components/ui/button"
import { Fieldset, FieldsetLegend } from "@registry/components/ui/fieldset"
import { Progress } from "@registry/components/ui/progress"
import { Stack } from "@registry/components/ui/stack"
import { Text } from "@registry/components/ui/text"
import { useEditor, useEditorState } from "@yopem-ui/editor"
import { createEditorSelectionBookmark } from "@yopem-ui/editor/selection-bookmark"
import {
  $createRangeSelectionFromDom,
  $getSelection,
  $isRangeSelection,
  $setSelection,
  COMMAND_PRIORITY_LOW,
  DROP_COMMAND,
  HISTORY_PUSH_TAG,
  mergeRegister,
  PASTE_COMMAND,
  type PasteCommandType,
  type RangeSelection,
} from "lexical"
import { useState, useSyncExternalStore } from "react"

import type { MediaUpload } from "./upload"

import {
  getMediaClipboardKind,
  hasRichMediaClipboardType,
  isMediaClipboardFileCountAllowed,
} from "./clipboard-model"
import { $insertMedia } from "./extension"
import { createMediaUpload } from "./upload"

function getTransferFileList(transfer: DataTransfer) {
  try {
    return Array.from(transfer.files)
  } catch {
    return []
  }
}

function getMediaFiles(transfer: DataTransfer) {
  const transferFiles = getTransferFileList(transfer)

  try {
    const itemFiles = Array.from(transfer.items)
      .filter((item) => item.kind === "file")
      .map((item) => item.getAsFile())
      .filter((file): file is File => file !== null)

    return transferFiles.length >= itemFiles.length ? transferFiles : itemFiles
  } catch {
    return transferFiles
  }
}

function hasRichMediaClipboardData(transfer: DataTransfer) {
  if (hasRichMediaClipboardType(Array.from(transfer.types))) return true

  try {
    return Boolean(
      transfer.getData("application/x-lexical-editor") ||
      transfer.getData("text/html") ||
      transfer.getData("text/markdown") ||
      transfer.getData("text/rtf"),
    )
  } catch {
    return true
  }
}

function isNativeControlTarget(root: HTMLElement, event: Event) {
  const view = root.ownerDocument.defaultView
  const target = event.target

  if (!view || !(target instanceof view.Element) || !root.contains(target))
    return true

  return (
    target.closest("[contenteditable]") !== root ||
    Boolean(
      target.closest(
        "button, input, textarea, select, a[href], video, audio, summary, iframe",
      ),
    )
  )
}

function getDropRange(root: HTMLElement, event: DragEvent) {
  const document = root.ownerDocument
  const view = document.defaultView

  if (
    !view ||
    !Number.isFinite(event.clientX) ||
    !Number.isFinite(event.clientY) ||
    event.clientX < 0 ||
    event.clientY < 0
  )
    return null

  const target = document.elementFromPoint(event.clientX, event.clientY)

  if (
    !target ||
    target.ownerDocument !== document ||
    !root.contains(target) ||
    target.closest(
      "button, input, textarea, select, a[href], video, audio, summary, iframe",
    )
  )
    return null

  const caretRange = document.caretRangeFromPoint?.(
    event.clientX,
    event.clientY,
  )

  const caretPosition = document.caretPositionFromPoint?.(
    event.clientX,
    event.clientY,
  )

  const range =
    caretRange ??
    (caretPosition
      ? (() => {
          const next = document.createRange()
          next.setStart(caretPosition.offsetNode, caretPosition.offset)
          next.collapse(true)

          return next
        })()
      : null)

  if (
    !range ||
    !root.contains(range.startContainer) ||
    !root.contains(range.endContainer)
  )
    return null

  range.collapse(true)

  return range
}

export function MediaFileClipboard({ upload }: { upload?: MediaUpload }) {
  const [configuration, setConfiguration] = useState({ upload, revision: 0 })

  if (configuration.upload !== upload)
    setConfiguration({ upload, revision: configuration.revision + 1 })

  if (!upload) return null

  return (
    <ConfiguredMediaFileClipboard
      key={configuration.revision}
      upload={upload}
    />
  )
}

function ConfiguredMediaFileClipboard({ upload }: { upload: MediaUpload }) {
  const editor = useEditor()
  const { editable } = useEditorState()
  const [bookmark] = useState(() => createEditorSelectionBookmark(editor))
  const [task] = useState(createMediaUpload)

  const hasTarget = useSyncExternalStore(
    bookmark.subscribe,
    bookmark.getSnapshot,
    bookmark.getServerSnapshot,
  )

  const snapshot = useSyncExternalStore(
    task.subscribe,
    task.getSnapshot,
    task.getSnapshot,
  )

  const [error, setError] = useState<string | null>(null)

  const [cancelUpload] = useState(() => {
    return function cancelUpload(event: MouseEvent<HTMLButtonElement>) {
      if (event.defaultPrevented) return
      task.cancel()
      bookmark.clear()
      setError(null)
    }
  })

  const [registrationRef] = useState(() => {
    return function registrationRef(element: HTMLDivElement | null) {
      if (!element) {
        task.cancel()
        bookmark.clear()

        return
      }

      let uploadSelection: RangeSelection | null = null

      const unbookmark = bookmark.subscribe(() => {
        if (!bookmark.getSnapshot()) uploadSelection = null

        if (
          !bookmark.getSnapshot() &&
          task.getSnapshot().status === "uploading"
        ) {
          task.cancel()
          setError("Selection changed. Select an insertion point again.")
        }
      })

      function uploadFile(
        file: File,
        revision: number,
        expectedSelection: RangeSelection,
      ) {
        if (file.name.length > 512) {
          setError("File name is too long.")
          bookmark.clear()

          return
        }

        void task
          .start(file, getMediaClipboardKind(file), upload)
          .then((result) => {
            if (!result) return

            if (
              editor._dirtyElements.size > 0 ||
              editor._dirtyLeaves.size > 0
            ) {
              bookmark.clear()
              setError("Selection changed. Select an insertion point again.")

              return
            }

            let inserted = false

            try {
              editor.update(
                () => {
                  const selection = $getSelection()

                  if (
                    !editor.isEditable() ||
                    bookmark.getRevision() !== revision ||
                    !bookmark.getSnapshot() ||
                    !$isRangeSelection(selection) ||
                    !selection.is(expectedSelection) ||
                    !bookmark.restore()
                  )
                    return

                  inserted = $insertMedia(result)
                },
                { discrete: true, tag: HISTORY_PUSH_TAG },
              )
            } catch {
              inserted = false
            }

            if (!inserted) {
              bookmark.clear()
              setError("Selection changed. Select an insertion point again.")

              return
            }

            bookmark.clear()
            setError(null)
            editor.focus()
          })
          .catch(() => {
            bookmark.clear()
            setError("Upload failed. Try again.")
          })
      }

      function handleTransfer(
        event: ClipboardEvent | DragEvent,
        transfer: DataTransfer | null,
        resolveDropRange?: (root: HTMLElement) => Range | null,
      ) {
        if (event.defaultPrevented) return true

        if (!editor.isEditable() || !transfer) return false

        const root = editor.getRootElement()

        if (!root || isNativeControlTarget(root, event)) return false

        if (hasRichMediaClipboardData(transfer)) return false

        const files = getMediaFiles(transfer)

        if (!files.length) return false
        event.preventDefault()

        if (task.getSnapshot().status === "uploading") {
          setError("Finish or cancel the active upload first.")

          return true
        }

        task.reset()

        if (!isMediaClipboardFileCountAllowed(files.length)) {
          setError("Paste or drop one file at a time.")

          return true
        }

        const file = files[0]

        if (!file) return true

        if (resolveDropRange) {
          const range = root && resolveDropRange(root)
          const selection = root?.ownerDocument.getSelection()

          if (!range || !selection) {
            setError("Drop the file inside the editor content.")

            return true
          }

          selection.removeAllRanges()
          selection.addRange(range)

          const lexicalSelection = $createRangeSelectionFromDom(
            selection,
            editor,
          )

          if (!$isRangeSelection(lexicalSelection)) {
            setError("Select an insertion point again.")

            return true
          }

          $setSelection(lexicalSelection)
        }

        bookmark.clear()
        bookmark.capture()

        const selection = $getSelection()

        if (!bookmark.getSnapshot() || !$isRangeSelection(selection)) {
          setError("Select an insertion point again.")

          return true
        }

        setError(null)
        uploadSelection = selection.clone()
        uploadFile(file, bookmark.getRevision(), uploadSelection)

        return true
      }

      function handlePaste(event: PasteCommandType) {
        if (!("clipboardData" in event)) return false

        return handleTransfer(event, event.clipboardData)
      }

      function cancelStaleUpload() {
        if (task.getSnapshot().status !== "uploading") return
        task.cancel()
        bookmark.clear()
        setError("Selection changed. Select an insertion point again.")
      }

      const unregister = mergeRegister(
        editor.registerUpdateListener(({ editorState }) => {
          const expectedSelection = uploadSelection

          if (!expectedSelection || task.getSnapshot().status !== "uploading")
            return

          const matches = editorState.read(() => {
            const selection = $getSelection()

            return (
              $isRangeSelection(selection) && selection.is(expectedSelection)
            )
          })

          if (!matches) cancelStaleUpload()
        }),
        editor.registerCommand(
          PASTE_COMMAND,
          handlePaste,
          COMMAND_PRIORITY_LOW,
        ),
        editor.registerCommand(
          DROP_COMMAND,
          (event) =>
            handleTransfer(event, event.dataTransfer, (root) =>
              getDropRange(root, event),
            ),
          COMMAND_PRIORITY_LOW,
        ),
        editor.registerEditableListener((nextEditable) => {
          if (!nextEditable) {
            task.cancel()
            bookmark.clear()
            setError(null)
          }
        }),
      )

      return () => {
        unregister()
        unbookmark()
        task.cancel()
        bookmark.clear()
      }
    }
  })

  return (
    <Stack ref={registrationRef} data-slot="media-file-clipboard">
      <Fieldset>
        <FieldsetLegend>Media file clipboard</FieldsetLegend>
        <Text>Paste or drop one media file.</Text>
        {snapshot.status === "uploading" && (
          <>
            <Progress
              value={snapshot.progress}
              aria-label="Media file upload"
            />
            <Button type="button" disabled={!editable} onClick={cancelUpload}>
              Cancel upload
            </Button>
          </>
        )}
        {snapshot.status === "error" && (
          <Text role="alert">Upload failed. Try again.</Text>
        )}
        {snapshot.status === "cancelled" && (
          <Box render={<output />}>Upload cancelled.</Box>
        )}
        {error && <Text role="alert">{error}</Text>}
        {!hasTarget && snapshot.status === "uploading" && (
          <Text role="alert">Select an insertion point again.</Text>
        )}
      </Fieldset>
    </Stack>
  )
}
