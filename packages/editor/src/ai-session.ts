import {
  $getRoot,
  $getSelection,
  $isRangeSelection,
  HISTORY_PUSH_TAG,
  type LexicalEditor,
} from "lexical"

import {
  requestEditorAi,
  type EditorAiConfig,
  type EditorAiOperation,
} from "./ai-client"
import { createEditorSelectionBookmark } from "./selection-bookmark"

function selectionKey() {
  const selection = $getSelection()

  return $isRangeSelection(selection)
    ? JSON.stringify([
        selection.anchor.key,
        selection.anchor.offset,
        selection.anchor.type,
        selection.focus.key,
        selection.focus.offset,
        selection.focus.type,
        selection.format,
        selection.style,
      ])
    : selection === null
      ? null
      : "non-range"
}

export interface EditorAiSnapshot {
  open: boolean
  operation: EditorAiOperation
  status:
    | "idle"
    | "streaming"
    | "ready"
    | "failed"
    | "cancelled"
    | "stale"
    | "timeout"
    | "truncated"
  text: string
}

export function createEditorAiSession(editor: LexicalEditor) {
  const bookmark = createEditorSelectionBookmark(editor)

  let snapshot: EditorAiSnapshot = {
    open: false,
    operation: "generate",
    status: "idle",
    text: "",
  }

  let selection: string | null = null
  let selectedText = ""
  let context = ""
  let approved = false
  let controller: AbortController | undefined
  const listeners = new Set<() => void>()
  let disconnect: (() => void) | undefined

  function publish(next: typeof snapshot) {
    snapshot = next

    for (const listener of listeners) listener()
  }

  function invalidate() {
    controller?.abort()
    controller = undefined
    bookmark.clear()

    if (snapshot.open) publish({ ...snapshot, status: "stale", text: "" })
  }

  function subscribe(listener: () => void) {
    listeners.add(listener)

    if (!disconnect) {
      const unbookmark = bookmark.subscribe(() => {
        if (!bookmark.getSnapshot()) invalidate()
      })

      const unupdate = editor.registerUpdateListener(
        ({ editorState, dirtyElements, dirtyLeaves }) => {
          if (!snapshot.open) return

          if (dirtyElements.size || dirtyLeaves.size) {
            invalidate()

            return
          }

          const current = editorState.read(selectionKey)

          if (current !== null && current !== selection) invalidate()
        },
      )

      const uneditable = editor.registerEditableListener((editable) => {
        if (!editable) invalidate()
      })

      disconnect = () => {
        unbookmark()
        unupdate()
        uneditable()
      }
    }

    return function unsubscribe() {
      listeners.delete(listener)

      if (!listeners.size) {
        controller?.abort()
        controller = undefined
        disconnect?.()
        disconnect = undefined
      }
    }
  }

  function open(operation: EditorAiOperation) {
    approved = false
    controller?.abort()
    controller = undefined
    editor.getEditorState().read(() => {
      bookmark.capture()
      selection = selectionKey()
      const range = $getSelection()
      selectedText = $isRangeSelection(range) ? range.getTextContent() : ""
      context = $getRoot().getTextContent().slice(0, 32_768)
    })
    publish({
      open: true,
      operation,
      status:
        editor.isEditable() &&
        bookmark.getSnapshot() &&
        (operation !== "rewrite" || selectedText.length > 0)
          ? "idle"
          : "stale",
      text: "",
    })
  }

  function close() {
    controller?.abort()
    controller = undefined
    publish({ ...snapshot, open: false, text: "", status: "idle" })
    bookmark.clear()
  }

  function cancel() {
    controller?.abort()
    controller = undefined
    publish({ ...snapshot, status: "cancelled", text: "" })
  }

  async function request(
    config: EditorAiConfig,
    instruction: string,
    origin: string,
  ) {
    if (
      snapshot.status !== "idle" ||
      !editor.isEditable() ||
      !bookmark.getSnapshot()
    )
      return
    const active = new AbortController()
    controller = active
    publish({ ...snapshot, status: "streaming", text: "" })

    try {
      const text = await requestEditorAi(
        config,
        { operation: snapshot.operation, instruction, selectedText, context },
        origin,
        active.signal,
        (text) => {
          if (controller === active) publish({ ...snapshot, text })
        },
      )

      if (controller === active && !active.signal.aborted)
        publish({ ...snapshot, status: "ready", text })
    } catch (error) {
      if (controller === active)
        publish({
          ...snapshot,
          status:
            error instanceof Error && error.message === "deadline"
              ? "timeout"
              : error instanceof Error && error.message === "truncated"
                ? "truncated"
                : "failed",
          text: "",
        })
    } finally {
      if (controller === active) controller = undefined
    }
  }

  function approve() {
    if (
      snapshot.status !== "ready" ||
      !snapshot.text ||
      !editor.isEditable() ||
      !bookmark.getSnapshot()
    )
      return false
    const text = snapshot.text
    let applied = false
    editor.update(
      () => {
        if (!bookmark.restore()) return
        const range = $getSelection()

        if (!$isRangeSelection(range)) return

        if (snapshot.operation !== "rewrite") {
          const end = range.isBackward() ? range.anchor : range.focus
          range.anchor.set(end.key, end.offset, end.type)
          range.focus.set(end.key, end.offset, end.type)
        }

        range.insertRawText(text)
        applied = true
      },
      { tag: HISTORY_PUSH_TAG, discrete: true },
    )
    approved = applied
    close()
    editor.focus()

    return applied
  }

  function getSnapshot() {
    return snapshot
  }

  function getApproved() {
    return approved
  }

  return {
    subscribe,
    getSnapshot,
    open,
    close,
    cancel,
    request,
    approve,
    getApproved,
  }
}
