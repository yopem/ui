"use client"

import { Box } from "@registry/components/ui/box"
import { Text } from "@registry/components/ui/text"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import { useState, useSyncExternalStore } from "react"
import { createPortal } from "react-dom"

import { useAi } from "./ai-controls"
import { createEditorCursorOverlay } from "./cursor-overlay-store"
import { useEditor, useEditorState } from "./root"

const maxPreviewCodePoints = 320

const styles = stylex.create({
  preview: {
    backgroundColor: tokens["--popover"],
    borderColor: tokens["--border"],
    borderRadius: tokens["--radius-md"],
    borderStyle: "solid",
    borderWidth: 1,
    color: tokens["--popover-foreground"],
    overflow: "hidden",
    padding: `calc(${tokens["--spacing"]} * 2)`,
    pointerEvents: "none",
    position: "fixed",
    zIndex: 1000,
  },
  position: (
    left: number,
    top: number,
    inlineSize: number,
    maxBlockSize: number,
  ) => ({
    inlineSize,
    left,
    maxBlockSize,
    top,
  }),
  text: {
    overflowWrap: "anywhere",
    whiteSpace: "pre-wrap",
  },
})

function truncatePreview(text: string) {
  let codePoints = 0
  let codeUnits = 0

  for (const character of text) {
    if (codePoints === maxPreviewCodePoints)
      return `${text.slice(0, codeUnits)}…`

    codePoints += 1
    codeUnits += character.length
  }

  return text
}

type EditorAiState = ReturnType<typeof useAi>["state"]

type CursorOverlaySnapshot = ReturnType<
  ReturnType<typeof createEditorCursorOverlay>["getSnapshot"]
>

function getPreviewTarget(
  state: EditorAiState,
  editable: boolean,
  snapshot: CursorOverlaySnapshot,
  document: Document | undefined,
  view: Window | null | undefined,
) {
  if (
    !state.open ||
    (state.status !== "streaming" && state.status !== "ready") ||
    !state.text ||
    !editable ||
    !snapshot.editable ||
    !document?.body ||
    !view ||
    view.innerWidth <= 16 ||
    view.innerHeight <= 16
  )
    return null

  for (let index = snapshot.selectionRects.length - 1; index >= 0; index -= 1) {
    const rect = snapshot.selectionRects[index]

    if (
      rect &&
      rect.bottom > 0 &&
      rect.top < view.innerHeight &&
      rect.right > 0 &&
      rect.left < view.innerWidth
    )
      return rect
  }

  return null
}

function getPreviewPosition(
  target: DOMRectReadOnly,
  viewportWidth: number,
  viewportHeight: number,
) {
  const inlineSize = Math.min(400, viewportWidth - 16)
  const maxBlockSize = Math.min(192, viewportHeight - 16)

  const left = Math.max(
    8,
    Math.min(target.left, viewportWidth - inlineSize - 8),
  )

  const below = target.bottom + 8

  const top =
    below + maxBlockSize <= viewportHeight - 8
      ? below
      : target.top - maxBlockSize - 8 >= 8
        ? target.top - maxBlockSize - 8
        : Math.max(8, viewportHeight - maxBlockSize - 8)

  return { inlineSize, left, maxBlockSize, top }
}

export function EditorAiInlinePreview() {
  const editor = useEditor()
  const { state } = useAi()
  const { editable } = useEditorState()
  const [overlay] = useState(() => createEditorCursorOverlay(editor))

  const snapshot = useSyncExternalStore(
    overlay.subscribe,
    overlay.getSnapshot,
    overlay.getServerSnapshot,
  )

  const root = editor.getRootElement()
  const document = root?.ownerDocument
  const view = document?.defaultView

  const target = getPreviewTarget(state, editable, snapshot, document, view)

  if (!target || !document || !view) return null

  const position = getPreviewPosition(target, view.innerWidth, view.innerHeight)

  return createPortal(
    <Box
      aria-hidden="true"
      data-slot="editor-ai-inline-preview"
      xstyle={[
        styles.preview,
        styles.position(
          position.left,
          position.top,
          position.inlineSize,
          position.maxBlockSize,
        ),
      ]}
    >
      <Text xstyle={styles.text}>{truncatePreview(state.text)}</Text>
    </Box>,
    document.body,
  )
}
