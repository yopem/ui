"use client"

import type { LexicalEditor } from "lexical"
import type { ComponentProps } from "react"

import { Box } from "@registry/components/ui/box"
import { Button } from "@registry/components/ui/button"
import { Popover, PopoverPopup } from "@registry/components/ui/popover"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import { useState, useSyncExternalStore } from "react"

import type {
  EditorCopilotConfig,
  EditorCopilotSnapshot,
} from "./copilot-session"

import { createEditorCopilotSession } from "./copilot-session"
import { useEditor } from "./root"

export type {
  EditorCopilotConfig,
  EditorCopilotSnapshot,
} from "./copilot-session"

const configKeys = new WeakMap<EditorCopilotConfig, string>()

let nextConfigKey = 0

type CopilotAnchor = NonNullable<ComponentProps<typeof PopoverPopup>["anchor"]>

const styles = stylex.create({
  ghost: {
    color: tokens["--muted-foreground"],
    fontStyle: "italic",
    overflowWrap: "anywhere",
    pointerEvents: "none",
    whiteSpace: "pre-wrap",
  },
  popup: {
    backgroundColor: "transparent",
    borderColor: "transparent",
    borderWidth: 0,
    boxShadow: "none",
    display: "block",
    inlineSize: "max-content",
    maxInlineSize: "min(40rem, calc(100vw - 2rem))",
    minInlineSize: 0,
    padding: 0,
    pointerEvents: "none",
  },
  status: {
    blockSize: 1,
    clipPath: "inset(50%)",
    inlineSize: 1,
    margin: -1,
    overflow: "hidden",
    padding: 0,
    position: "absolute",
    whiteSpace: "nowrap",
  },
})

function configurationKey(config: EditorCopilotConfig) {
  const current = configKeys.get(config)

  if (current) return current

  const next = String(++nextConfigKey)
  configKeys.set(config, next)

  return next
}

interface CaretPosition {
  root: HTMLElement
  range: Range
}

interface CaretAnchorState {
  anchor: CopilotAnchor
  update(position: CaretPosition | null): void
}

function createCaretAnchorState(): CaretAnchorState {
  let position: CaretPosition | null = null

  const anchor: CopilotAnchor = {
    get contextElement() {
      return position?.root ?? document.body
    },
    getBoundingClientRect() {
      return position?.range.getBoundingClientRect() ?? new DOMRect()
    },
    getClientRects() {
      return position?.range.getClientRects() ?? []
    },
  }

  function update(next: CaretPosition | null) {
    position = next
  }

  return { anchor, update }
}

function getCaretPosition(editor: LexicalEditor): CaretPosition | null {
  const root = editor.getRootElement()
  const selection = root?.ownerDocument.getSelection()

  if (
    !root ||
    !selection ||
    selection.rangeCount === 0 ||
    !root.contains(selection.anchorNode)
  )
    return null

  const range = selection.getRangeAt(0).cloneRange()

  return range.collapsed ? { root, range } : null
}

function statusMessage(snapshot: EditorCopilotSnapshot) {
  if (snapshot.status === "waiting")
    return "Waiting for a typing pause before automatic completion."

  if (snapshot.status === "streaming") return "AI completion is streaming."

  if (snapshot.status === "ready")
    return `AI completion ready. Preview: ${snapshot.text.slice(0, 256)}. Press Tab to accept all, Mod+Right to accept one grapheme, or Escape to cancel.`

  if (snapshot.status === "failed")
    return "Completion unavailable. No text was applied."

  if (snapshot.status === "timeout")
    return "Completion timed out. No text was applied."

  if (snapshot.status === "truncated")
    return "Completion stream ended early. No text was applied."

  if (snapshot.status === "cancelled")
    return "Completion cancelled. No text was applied."

  if (snapshot.status === "stale")
    return "Completion cleared because the editor changed. No text was applied."

  return "Press Control+Space at the end of a paragraph to request a completion."
}

function EditorCopilotInstance({ config }: { config: EditorCopilotConfig }) {
  const editor = useEditor()
  const [session] = useState(() => createEditorCopilotSession(editor, config))

  const snapshot = useSyncExternalStore(
    session.subscribe,
    session.getSnapshot,
    session.getServerSnapshot,
  )

  const [anchorState] = useState(createCaretAnchorState)
  const position = getCaretPosition(editor)
  anchorState.update(position)

  const visible =
    Boolean(position && snapshot.text) &&
    (snapshot.status === "streaming" || snapshot.status === "ready")

  return (
    <>
      {config.allowAutomatic === true ? (
        <Button
          aria-pressed={snapshot.automatic}
          variant="ghost"
          size="sm"
          onClick={session.toggleAutomatic}
        >
          Automatic suggestions; paid requests may incur charges
        </Button>
      ) : null}
      <Box
        render={<output />}
        data-slot="editor-copilot-status"
        aria-live="polite"
        aria-atomic="true"
        xstyle={styles.status}
      >
        {statusMessage(snapshot)}
      </Box>
      <Popover open={visible} modal={false}>
        <PopoverPopup
          anchor={visible ? anchorState.anchor : undefined}
          initialFocus={false}
          finalFocus={false}
          side="right"
          align="start"
          sideOffset={0}
          aria-hidden="true"
          role="presentation"
          xstyle={styles.popup}
        >
          <Box
            render={<span />}
            data-slot="editor-copilot-ghost"
            xstyle={styles.ghost}
          >
            {snapshot.text}
          </Box>
        </PopoverPopup>
      </Popover>
    </>
  )
}

export function EditorCopilot({ config }: { config: EditorCopilotConfig }) {
  return (
    <EditorCopilotInstance key={configurationKey(config)} config={config} />
  )
}
