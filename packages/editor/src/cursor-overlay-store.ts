import type { LexicalEditor } from "lexical"

export interface EditorCursorOverlaySnapshot {
  readonly dragCaret: DOMRectReadOnly | null
  readonly selectionRects: readonly DOMRectReadOnly[]
  readonly editable: boolean
}

export function createEditorCursorOverlay(editor: LexicalEditor) {
  const listeners = new Set<() => void>()
  let root: HTMLElement | null = null
  let removeRootListeners: (() => void) | undefined
  let disconnect: (() => void) | undefined
  let dragCaret: DOMRectReadOnly | null = null
  let selectionRects: readonly DOMRectReadOnly[] = []
  let disposed = false

  let snapshot: EditorCursorOverlaySnapshot = {
    dragCaret,
    selectionRects,
    editable: editor.isEditable(),
  }

  const serverSnapshot: EditorCursorOverlaySnapshot = {
    dragCaret: null,
    selectionRects: [],
    editable: editor.isEditable(),
  }

  function publish() {
    snapshot = { dragCaret, selectionRects, editable: editor.isEditable() }

    for (const listener of listeners) listener()
  }

  function clearCaret() {
    if (!dragCaret) return
    dragCaret = null
    publish()
  }

  function containsRange(range: Range) {
    return Boolean(
      root?.contains(range.startContainer) &&
      root?.contains(range.endContainer),
    )
  }

  function syncSelection() {
    if (!root || !editor.isEditable()) {
      if (selectionRects.length) {
        selectionRects = []
        publish()
      }

      return
    }

    const selection = root.ownerDocument.getSelection()

    if (!selection?.rangeCount || selection.isCollapsed) {
      if (root.ownerDocument.activeElement === root && selectionRects.length) {
        selectionRects = []
        publish()
      }

      return
    }

    const range = selection.getRangeAt(0)

    if (!containsRange(range)) {
      if (root.ownerDocument.activeElement === root && selectionRects.length) {
        selectionRects = []
        publish()
      }

      return
    }

    const bounds = root.getBoundingClientRect()
    const rects = new Map<string, DOMRectReadOnly>()

    for (const rect of range.getClientRects()) {
      if (
        rect.width <= 0 ||
        rect.height <= 0 ||
        rect.bottom <= bounds.top ||
        rect.top >= bounds.bottom ||
        rect.right <= bounds.left ||
        rect.left >= bounds.right
      ) {
        continue
      }

      const key = `${rect.left}:${rect.top}:${rect.width}:${rect.height}`

      if (!rects.has(key))
        rects.set(
          key,
          new DOMRectReadOnly(rect.x, rect.y, rect.width, rect.height),
        )
    }

    selectionRects = Array.from(rects.values())
    publish()
  }

  function handleDragOver(event: DragEvent) {
    if (!root || !editor.isEditable()) return

    const doc = root.ownerDocument
    const range = doc.caretRangeFromPoint?.(event.clientX, event.clientY)
    const caret = doc.caretPositionFromPoint?.(event.clientX, event.clientY)

    const position =
      range ??
      (caret
        ? (() => {
            const next = doc.createRange()
            next.setStart(caret.offsetNode, caret.offset)
            next.collapse(true)

            return next
          })()
        : null)

    if (!position || !containsRange(position)) {
      clearCaret()

      return
    }

    const rect = position.getBoundingClientRect()
    const bounds = root.getBoundingClientRect()

    if (
      rect.bottom < bounds.top ||
      rect.top > bounds.bottom ||
      rect.right < bounds.left ||
      rect.left > bounds.right
    ) {
      clearCaret()

      return
    }

    dragCaret = new DOMRectReadOnly(
      rect.x,
      rect.y,
      Math.max(1, rect.width),
      rect.height || 16,
    )
    publish()
  }

  function handleDrop() {
    clearCaret()
  }

  function handleRoot(nextRoot: HTMLElement | null) {
    const removeListeners = removeRootListeners
    removeRootListeners = undefined
    removeListeners?.()
    root = nextRoot
    dragCaret = null
    selectionRects = []

    if (root) {
      const attachedRoot = root
      const doc = attachedRoot.ownerDocument
      doc.addEventListener("selectionchange", syncSelection)
      attachedRoot.addEventListener("dragover", handleDragOver)
      attachedRoot.addEventListener("dragleave", clearCaret)
      attachedRoot.addEventListener("drop", handleDrop)
      doc.defaultView?.addEventListener("resize", syncSelection)
      doc.addEventListener("scroll", syncSelection, true)
      removeRootListeners = () => {
        doc.removeEventListener("selectionchange", syncSelection)
        attachedRoot.removeEventListener("dragover", handleDragOver)
        attachedRoot.removeEventListener("dragleave", clearCaret)
        attachedRoot.removeEventListener("drop", handleDrop)
        doc.defaultView?.removeEventListener("resize", syncSelection)
        doc.removeEventListener("scroll", syncSelection, true)
      }
    }

    publish()
  }

  function connect() {
    if (disposed || disconnect) return

    const cleanups: (() => void)[] = []

    try {
      cleanups.push(editor.registerRootListener(handleRoot))
      cleanups.push(
        editor.registerUpdateListener(({ dirtyElements, dirtyLeaves }) => {
          if (dirtyElements.size || dirtyLeaves.size) {
            dragCaret = null
            selectionRects = []
          } else syncSelection()
          publish()
        }),
      )
      cleanups.push(
        editor.registerEditableListener(() => {
          dragCaret = null
          selectionRects = []
          publish()
        }),
      )
      disconnect = function disconnectListeners() {
        for (const cleanup of cleanups.reverse()) cleanup()
      }
    } finally {
      if (!disconnect) {
        const removeListeners = removeRootListeners
        removeRootListeners = undefined
        removeListeners?.()
        root = null

        for (const cleanup of cleanups.reverse()) cleanup()
      }
    }
  }

  function subscribe(listener: () => void) {
    if (!disposed) {
      connect()
      listeners.add(listener)
    }

    return () => {
      listeners.delete(listener)
      queueMicrotask(() => {
        if (listeners.size === 0) dispose()
      })
    }
  }

  function dispose() {
    if (disposed) return
    disposed = true

    const disconnectListeners = disconnect
    disconnect = undefined
    disconnectListeners?.()
    const removeListeners = removeRootListeners
    removeRootListeners = undefined
    removeListeners?.()
    root = null
    dragCaret = null
    selectionRects = []
    listeners.clear()
    snapshot = { dragCaret, selectionRects, editable: editor.isEditable() }
  }

  return {
    dispose,
    getSnapshot(this: void) {
      return snapshot
    },
    getServerSnapshot(this: void) {
      return serverSnapshot
    },
    subscribe,
  }
}
