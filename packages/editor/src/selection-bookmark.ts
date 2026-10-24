import {
  $getNodeByKey,
  $getSelection,
  $isElementNode,
  $isRangeSelection,
  $isTextNode,
  $setSelection,
  type LexicalEditor,
  type RangeSelection,
} from "lexical"

export function $isValidBookmarkPoint(point: RangeSelection["anchor"]) {
  const node = $getNodeByKey(point.key)

  const size =
    point.type === "text" && $isTextNode(node)
      ? node.getTextContentSize()
      : point.type === "element" && $isElementNode(node)
        ? node.getChildrenSize()
        : -1

  return (
    node?.isAttached() === true &&
    Number.isInteger(point.offset) &&
    point.offset >= 0 &&
    point.offset <= size
  )
}

export function createEditorSelectionBookmark(editor: LexicalEditor) {
  let saved: RangeSelection | null = null
  let revision = 0
  let unregister: (() => void) | undefined
  const listeners = new Set<() => void>()

  function clear() {
    if (!saved) return
    saved = null

    for (const listener of listeners) listener()
  }

  function capture() {
    if (!unregister) {
      clear()

      return
    }

    const selection = $getSelection()

    if (!$isRangeSelection(selection)) {
      clear()

      return
    }

    const hadSelection = saved !== null
    saved = selection.clone()

    if (!hadSelection) {
      for (const listener of listeners) listener()
    }
  }

  function restore() {
    if (!saved || !unregister) return false

    for (const point of [saved.anchor, saved.focus]) {
      if (!$isValidBookmarkPoint(point)) {
        clear()

        return false
      }
    }

    $setSelection(saved.clone())

    return true
  }

  function subscribe(listener: () => void) {
    listeners.add(listener)

    unregister ??= editor.registerUpdateListener(
      ({ dirtyElements, dirtyLeaves }) => {
        if (dirtyElements.size > 0 || dirtyLeaves.size > 0) {
          revision += 1
          clear()
        }
      },
    )

    return function unsubscribe() {
      listeners.delete(listener)

      if (listeners.size === 0) {
        unregister?.()
        unregister = undefined
        revision += 1
        clear()
      }
    }
  }

  function getSnapshot() {
    return saved !== null
  }

  function getServerSnapshot(): false {
    return false
  }

  function getRevision() {
    return revision
  }

  return {
    capture,
    clear,
    restore,
    subscribe,
    getSnapshot,
    getServerSnapshot,
    getRevision,
  }
}
