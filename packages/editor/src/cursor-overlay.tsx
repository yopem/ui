"use client"

import { Box } from "@registry/components/ui/box"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import { useState, useSyncExternalStore } from "react"
import { createPortal } from "react-dom"

import { createEditorCursorOverlay } from "./cursor-overlay-store"
import { useEditor } from "./root"

const styles = stylex.create({
  caret: {
    backgroundColor: tokens["--primary"],
    inlineSize: "2px",
    pointerEvents: "none",
    position: "fixed",
    zIndex: 1000,
  },
  caretPosition: (height: number, left: number, top: number) => ({
    blockSize: height,
    left,
    top,
  }),
  selection: {
    backgroundColor: tokens["--primary"],
    opacity: 0.16,
    pointerEvents: "none",
    position: "fixed",
    zIndex: 999,
  },
  selectionPosition: (
    height: number,
    left: number,
    top: number,
    width: number,
  ) => ({
    height,
    left,
    top,
    width,
  }),
})

export function EditorCursorOverlay() {
  const editor = useEditor()
  const [controller] = useState(() => createEditorCursorOverlay(editor))

  const snapshot = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getServerSnapshot,
  )

  const root = editor.getRootElement()
  const portal = root?.ownerDocument.body

  if (!portal) return null

  return createPortal(
    <>
      {snapshot.selectionRects.map((rect) => (
        <Box
          key={`${rect.left}:${rect.top}:${rect.width}:${rect.height}`}
          aria-hidden="true"
          data-slot="editor-cursor-selection"
          {...stylex.props(
            styles.selection,
            styles.selectionPosition(
              rect.height,
              rect.left,
              rect.top,
              rect.width,
            ),
          )}
        />
      ))}
      {snapshot.dragCaret ? (
        <Box
          aria-hidden="true"
          data-slot="editor-cursor-drag-caret"
          {...stylex.props(
            styles.caret,
            styles.caretPosition(
              snapshot.dragCaret.height,
              snapshot.dragCaret.left,
              snapshot.dragCaret.top,
            ),
          )}
        />
      ) : null}
    </>,
    portal,
  )
}
