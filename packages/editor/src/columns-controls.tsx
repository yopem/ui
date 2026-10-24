"use client"

import { Button } from "@registry/components/ui/button"
import { Slider } from "@registry/components/ui/slider"
import { ToolbarButton } from "@registry/components/ui/toolbar"
import { Wrap } from "@registry/components/ui/wrap"
import * as stylex from "@stylexjs/stylex"
import { $getNodeByKey, HISTORY_MERGE_TAG, HISTORY_PUSH_TAG } from "lexical"
import { useRef, useState, useSyncExternalStore } from "react"

import {
  $getEditorColumnsContext,
  INSERT_EDITOR_COLUMNS_COMMAND,
  MOVE_EDITOR_COLUMN_COMMAND,
  REMOVE_EDITOR_COLUMNS_COMMAND,
  SET_EDITOR_COLUMNS_LAYOUT_COMMAND,
} from "./columns-extension"
import {
  EDITOR_COLUMNS_MAXIMUM,
  EDITOR_COLUMNS_MINIMUM,
  resizeEditorColumnsLayout,
  type EditorColumnsLayout,
} from "./columns-model"
import { EditorColumnsGroupNode } from "./columns-node"
import { useEditor, useEditorState } from "./root"
import { createEditorSelectionBookmark } from "./selection-bookmark"

const styles = stylex.create({
  resizeSlider: {
    alignItems: "center",
    display: "flex",
    inlineSize: "11rem",
    minBlockSize: "2.75rem",
  },
})

function isSingleSliderValue(
  value: number | readonly number[],
): value is number {
  return Number.isFinite(value)
}

const layoutPresets = new Map<
  number,
  { label: string; layout: EditorColumnsLayout }[]
>([
  [
    2,
    [
      { label: "Equal columns", layout: [50, 50] },
      { label: "Wider first column", layout: [60, 40] },
      { label: "Wider second column", layout: [40, 60] },
    ],
  ],
  [
    3,
    [
      { label: "Equal columns", layout: [34, 33, 33] },
      { label: "Wider first column", layout: [50, 25, 25] },
      { label: "Wider last column", layout: [25, 25, 50] },
    ],
  ],
  [4, [{ label: "Equal columns", layout: [25, 25, 25, 25] }]],
])

export function EditorColumnsInsertControl() {
  const editor = useEditor()
  const { editable } = useEditorState()
  const [bookmark] = useState(() => createEditorSelectionBookmark(editor))
  useSyncExternalStore(
    bookmark.subscribe,
    bookmark.getSnapshot,
    bookmark.getServerSnapshot,
  )
  const context = editor.getEditorState().read($getEditorColumnsContext)

  function capture() {
    editor.getEditorState().read(bookmark.capture)
  }

  function insert(count: number) {
    if (!editable || !editor.isEditable() || !bookmark.getSnapshot()) return
    const revision = bookmark.getRevision()
    let inserted = false

    editor.update(
      () => {
        if (bookmark.getRevision() !== revision || !bookmark.restore()) return

        const layout =
          count === 2 ? [50, 50] : count === 3 ? [34, 33, 33] : [25, 25, 25, 25]

        inserted = editor.dispatchCommand(INSERT_EDITOR_COLUMNS_COMMAND, layout)
      },
      { discrete: true, tag: HISTORY_PUSH_TAG },
    )

    bookmark.clear()

    if (inserted) editor.focus()
  }

  return (
    <Wrap>
      {[2, 3, 4].map((count) => (
        <ToolbarButton
          key={count}
          aria-label={`Insert ${count} columns`}
          disabled={!editable || context !== null}
          render={<Button variant="ghost" size="sm" />}
          onMouseDown={(event) => {
            event.preventDefault()
            capture()
          }}
          onFocus={capture}
          onClick={() => insert(count)}
        >
          {count} columns
        </ToolbarButton>
      ))}
    </Wrap>
  )
}

export function EditorColumnsLayoutControl() {
  const editor = useEditor()
  const { editable } = useEditorState()
  const [bookmark] = useState(() => createEditorSelectionBookmark(editor))
  useSyncExternalStore(
    bookmark.subscribe,
    bookmark.getSnapshot,
    bookmark.getServerSnapshot,
  )
  const target = useRef<{ groupKey: string; revision: number } | null>(null)
  const context = editor.getEditorState().read($getEditorColumnsContext)

  const presets = context
    ? (layoutPresets.get(context.layout.length) ?? [])
    : []

  function capture() {
    if (!context) return
    editor.getEditorState().read(() => {
      bookmark.capture()
      target.current = {
        groupKey: context.group.getKey(),
        revision: bookmark.getRevision(),
      }
    })
  }

  function apply(layout: EditorColumnsLayout) {
    const selected = target.current

    if (!editable || !editor.isEditable() || !selected) return
    let applied = false

    editor.update(
      () => {
        if (bookmark.getRevision() !== selected.revision || !bookmark.restore())
          return
        const group = $getNodeByKey(selected.groupKey)

        if (
          !(group instanceof EditorColumnsGroupNode) ||
          !group.isAttached() ||
          group.getChildrenSize() !== layout.length
        )
          return
        applied = editor.dispatchCommand(
          SET_EDITOR_COLUMNS_LAYOUT_COMMAND,
          layout,
        )
      },
      { discrete: true, tag: HISTORY_PUSH_TAG },
    )

    bookmark.clear()
    target.current = null

    if (applied) editor.focus()
  }

  if (!context) return null

  return (
    <Wrap>
      {presets.map((preset) => (
        <ToolbarButton
          key={preset.label}
          aria-label={preset.label}
          disabled={!editable}
          render={<Button variant="ghost" size="sm" />}
          onMouseDown={(event) => {
            event.preventDefault()
            capture()
          }}
          onFocus={capture}
          onClick={() => apply(preset.layout)}
        >
          {preset.label}
        </ToolbarButton>
      ))}
    </Wrap>
  )
}

export function EditorColumnResizeControls() {
  const editor = useEditor()
  const { editable } = useEditorState()
  const [bookmark] = useState(() => createEditorSelectionBookmark(editor))
  useSyncExternalStore(
    bookmark.subscribe,
    bookmark.getSnapshot,
    bookmark.getServerSnapshot,
  )

  const session = useRef<{
    groupKey: string
    revision: number
    initialLayout: EditorColumnsLayout
    changed: boolean
  } | null>(null)

  const context = editor.getEditorState().read($getEditorColumnsContext)

  function start() {
    if (session.current || !context || !editable || !editor.isEditable()) return
    editor.getEditorState().read(bookmark.capture)
    session.current = {
      groupKey: context.group.getKey(),
      revision: bookmark.getRevision(),
      initialLayout: context.layout,
      changed: false,
    }
  }

  function finish() {
    session.current = null
    bookmark.clear()
  }

  function cancel() {
    const current = session.current

    session.current = null

    if (
      !current ||
      !current.changed ||
      bookmark.getRevision() !== current.revision
    ) {
      bookmark.clear()

      return
    }

    editor.update(
      () => {
        if (!editor.isEditable() || bookmark.getRevision() !== current.revision)
          return
        const group = $getNodeByKey(current.groupKey)

        if (group instanceof EditorColumnsGroupNode && group.isAttached())
          group.setLayout(current.initialLayout)
      },
      { discrete: true, tag: HISTORY_MERGE_TAG },
    )
    bookmark.clear()
  }

  function resize(boundary: number, width: number, reason: string) {
    start()
    const current = session.current

    if (
      !current ||
      !editable ||
      !editor.isEditable() ||
      bookmark.getRevision() !== current.revision
    ) {
      finish()

      return
    }

    let changed = false

    editor.update(
      () => {
        if (
          !editor.isEditable() ||
          bookmark.getRevision() !== current.revision ||
          (!current.changed && !bookmark.restore())
        )
          return
        const group = $getNodeByKey(current.groupKey)

        if (!(group instanceof EditorColumnsGroupNode) || !group.isAttached())
          return
        const previous = group.getLayout()
        const next = resizeEditorColumnsLayout(previous, boundary, width)

        if (previous.every((item, index) => item === next[index])) return
        group.setLayout(next)
        changed = true
      },
      {
        discrete: true,
        tag:
          reason === "keyboard" || !current.changed
            ? HISTORY_PUSH_TAG
            : HISTORY_MERGE_TAG,
      },
    )

    if (changed) {
      current.changed = true
      current.revision = bookmark.getRevision()
    }
  }

  if (!context) return null

  return (
    <Wrap>
      {context.layout.map((firstWidth, boundary) => {
        const secondWidth = context.layout[boundary + 1]

        if (secondWidth === undefined) return null
        const pairWidth = firstWidth + secondWidth

        const minimum = Math.max(
          EDITOR_COLUMNS_MINIMUM,
          pairWidth - EDITOR_COLUMNS_MAXIMUM,
        )

        const maximum = Math.min(
          EDITOR_COLUMNS_MAXIMUM,
          pairWidth - EDITOR_COLUMNS_MINIMUM,
        )

        return (
          <Slider
            key={`${context.group.getKey()}-${boundary}`}
            aria-label={`Resize between column ${boundary + 1} and column ${boundary + 2}`}
            disabled={!editable}
            max={maximum}
            min={minimum}
            xstyle={styles.resizeSlider}
            value={firstWidth}
            onFocus={start}
            onPointerDown={start}
            onPointerCancel={cancel}
            onBlur={cancel}
            onKeyDown={(event) => {
              if (event.key === "Escape") cancel()
              else start()
            }}
            onValueChange={(value, details) => {
              if (!isSingleSliderValue(value)) return
              resize(boundary, value, details.reason)
            }}
            onValueCommitted={finish}
          />
        )
      })}
    </Wrap>
  )
}

export function EditorColumnMoveControls() {
  const editor = useEditor()
  const { editable } = useEditorState()
  const context = editor.getEditorState().read($getEditorColumnsContext)

  if (!context || context.columnIndex === null) return null

  function move(direction: "left" | "right") {
    if (!editable || !editor.isEditable()) return
    editor.update(
      () => {
        editor.dispatchCommand(MOVE_EDITOR_COLUMN_COMMAND, direction)
      },
      { discrete: true, tag: HISTORY_PUSH_TAG },
    )
    editor.focus()
  }

  return (
    <Wrap>
      <ToolbarButton
        aria-label="Move column left"
        disabled={!editable || context.columnIndex === 0}
        render={<Button variant="ghost" size="sm" />}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => move("left")}
      >
        Move left
      </ToolbarButton>
      <ToolbarButton
        aria-label="Move column right"
        disabled={
          !editable || context.columnIndex === context.layout.length - 1
        }
        render={<Button variant="ghost" size="sm" />}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => move("right")}
      >
        Move right
      </ToolbarButton>
    </Wrap>
  )
}

export function EditorColumnsRemoveControl() {
  const editor = useEditor()
  const { editable } = useEditorState()
  const context = editor.getEditorState().read($getEditorColumnsContext)

  if (!context) return null

  function remove() {
    if (!editable || !editor.isEditable()) return
    editor.update(
      () => {
        editor.dispatchCommand(REMOVE_EDITOR_COLUMNS_COMMAND, undefined)
      },
      { discrete: true, tag: HISTORY_PUSH_TAG },
    )
    editor.focus()
  }

  return (
    <ToolbarButton
      aria-label="Remove columns"
      disabled={!editable}
      render={<Button variant="destructive-outline" size="sm" />}
      onMouseDown={(event) => event.preventDefault()}
      onClick={remove}
    >
      Remove columns
    </ToolbarButton>
  )
}

export function EditorColumnsControls() {
  return (
    <Wrap>
      <EditorColumnsInsertControl />
      <EditorColumnsLayoutControl />
      <EditorColumnResizeControls />
      <EditorColumnMoveControls />
      <EditorColumnsRemoveControl />
    </Wrap>
  )
}
