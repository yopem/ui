"use client"

import { $isListNode, type ListNode, type ListType } from "@lexical/list"
import {
  $getNodeByKey,
  $addUpdateTag,
  $getSelection,
  $isRangeSelection,
  HISTORY_PUSH_TAG,
  SKIP_DOM_SELECTION_TAG,
  type LexicalEditor,
  type LexicalNode,
} from "lexical"
import { useSyncExternalStore } from "react"

import {
  $getEditorListMarker,
  $setEditorListMarker,
  isEditorListMarkerForType,
  parseEditorListStart,
  type EditorListMarker,
} from "./list-presentation-model"
import { useEditor } from "./root"
import {
  $isValidBookmarkPoint,
  createEditorSelectionBookmark,
} from "./selection-bookmark"

interface EditorListPresentationSnapshot {
  available: boolean
  editable: boolean
  listType: ListType | null
  marker: EditorListMarker | undefined
  start: number | undefined
}

const emptySnapshot: EditorListPresentationSnapshot = {
  available: false,
  editable: false,
  listType: null,
  marker: undefined,
  start: undefined,
}

function $getListForNode(node: LexicalNode | null) {
  for (let current = node; current; current = current.getParent())
    if ($isListNode(current)) return current

  return null
}

function $getEditorListPresentationContext() {
  const selection = $getSelection()

  if (
    !$isRangeSelection(selection) ||
    ![selection.anchor, selection.focus].every($isValidBookmarkPoint)
  )
    return null

  const anchor = $getListForNode(selection.anchor.getNode())
  const focus = $getListForNode(selection.focus.getNode())

  return anchor && focus && anchor.getKey() === focus.getKey() ? anchor : null
}

function createEditorListPresentationSelection(editor: LexicalEditor) {
  const bookmark = createEditorSelectionBookmark(editor)
  const listeners = new Set<() => void>()
  let listKey: string | null = null
  let snapshot: EditorListPresentationSnapshot | undefined
  let unregister: (() => void) | undefined

  function readSnapshot() {
    return editor.getEditorState().read(() => {
      const selection = $getSelection()
      let list = $getEditorListPresentationContext()

      if (bookmark.getSnapshot()) {
        if (list && list.getKey() !== listKey) list = null

        if (!selection && listKey) {
          const saved = $getNodeByKey(listKey)
          list = $isListNode(saved) && saved.isAttached() ? saved : null
        }
      }

      return {
        available: list !== null,
        editable: editor.isEditable(),
        listType: list?.getListType() ?? null,
        marker: list ? $getEditorListMarker(list) : undefined,
        start: list?.getStart(),
      }
    })
  }

  function sameSnapshot(
    left: EditorListPresentationSnapshot | undefined,
    right: EditorListPresentationSnapshot,
  ) {
    return (
      left?.available === right.available &&
      left.editable === right.editable &&
      left.listType === right.listType &&
      left.marker === right.marker &&
      left.start === right.start
    )
  }

  function publish() {
    const next = readSnapshot()

    if (sameSnapshot(snapshot, next)) return
    snapshot = next

    for (const listener of listeners) listener()
  }

  function getSnapshot() {
    const next = readSnapshot()

    if (!sameSnapshot(snapshot, next)) snapshot = next

    return snapshot ?? next
  }

  const subscribe = (listener: () => void) => {
    listeners.add(listener)

    if (!unregister) {
      const stopUpdate = editor.registerUpdateListener(publish)
      const stopEditable = editor.registerEditableListener(publish)
      const stopRoot = editor.registerRootListener(publish)

      const stopBookmark = bookmark.subscribe(() => {
        if (!bookmark.getSnapshot()) listKey = null
        publish()
      })

      unregister = () => {
        stopUpdate()
        stopEditable()
        stopRoot()
        stopBookmark()
      }
    }

    publish()

    return function unsubscribe() {
      listeners.delete(listener)

      if (listeners.size === 0) {
        unregister?.()
        unregister = undefined
        bookmark.clear()
        listKey = null
        snapshot = undefined
      }
    }
  }

  function clear() {
    listKey = null
    bookmark.clear()
    publish()
  }

  function capture() {
    editor.getEditorState().read(() => {
      const selection = $getSelection()

      const selectedListKey =
        $getEditorListPresentationContext()?.getKey() ?? null

      if (selectedListKey) {
        bookmark.capture()

        if (bookmark.getSnapshot()) listKey = selectedListKey
      } else if (selection || !bookmark.getSnapshot()) clear()
    })

    publish()
  }

  function apply(action: (list: ListNode) => void) {
    if (!editor.isEditable() || !bookmark.getSnapshot() || !listKey)
      return false
    const targetKey = listKey
    let applied = false

    editor.update(
      () => {
        if (!editor.isEditable() || !bookmark.getSnapshot()) return
        const selection = $getSelection()
        const liveList = $getEditorListPresentationContext()

        if (selection && (!liveList || liveList.getKey() !== targetKey)) {
          clear()

          return
        }

        if (!bookmark.restore()) {
          clear()

          return
        }

        const restored = $getEditorListPresentationContext()

        if (!restored || restored.getKey() !== targetKey) {
          clear()

          return
        }

        action(restored)
        $addUpdateTag(SKIP_DOM_SELECTION_TAG)
        applied = true
      },
      {
        tag: HISTORY_PUSH_TAG,
        onUpdate() {
          if (!applied) return

          editor.getEditorState().read(() => {
            const current = $getEditorListPresentationContext()

            if (current?.getKey() === targetKey) {
              listKey = targetKey
              bookmark.capture()
            } else clear()
          })
        },
      },
    )

    return applied
  }

  function setMarker(marker: EditorListMarker | undefined) {
    return apply((list) => {
      if (list.getListType() === "check") return

      if (
        marker !== undefined &&
        !isEditorListMarkerForType(marker, list.getListType())
      )
        return

      $setEditorListMarker(list, marker)
    })
  }

  function setStart(value: number) {
    const parsed = parseEditorListStart(value)

    return apply((list) => {
      if (list.getListType() === "number") list.setStart(parsed)
    })
  }

  return {
    capture,
    clear,
    getSnapshot: () => getSnapshot(),
    getServerSnapshot: () => emptySnapshot,
    setMarker,
    setStart,
    subscribe: (listener: () => void) => subscribe(listener),
  }
}

const selections = new WeakMap<
  LexicalEditor,
  ReturnType<typeof createEditorListPresentationSelection>
>()

function getEditorListPresentationSelection(editor: LexicalEditor) {
  const existing = selections.get(editor)

  if (existing) return existing
  const selection = createEditorListPresentationSelection(editor)
  selections.set(editor, selection)

  return selection
}

export function useEditorListPresentationSelection() {
  const editor = useEditor()
  const selection = getEditorListPresentationSelection(editor)

  const snapshot = useSyncExternalStore(
    selection.subscribe,
    selection.getSnapshot,
    selection.getServerSnapshot,
  )

  return { ...selection, ...snapshot }
}
