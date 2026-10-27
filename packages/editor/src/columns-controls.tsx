"use client"

import type { ComponentProps, KeyboardEvent, MouseEvent } from "react"

import { useStableCallback } from "@base-ui/utils/useStableCallback"
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

function preventColumnButtonFocus(event: MouseEvent<HTMLElement>) {
  event.preventDefault()
}

type SliderValueChange = NonNullable<
  ComponentProps<typeof Slider>["onValueChange"]
>

function EditorColumnInsertButton({
  count,
  disabled,
  capture,
  insert,
}: {
  count: number
  disabled: boolean
  capture: () => void
  insert: (count: number) => void
}) {
  const handleMouseDown = useStableCallback(function handleMouseDown(
    event: MouseEvent<HTMLElement>,
  ) {
    event.preventDefault()
    capture()
  })

  const handleClick = useStableCallback(function handleClick() {
    insert(count)
  })

  return (
    <ToolbarButton
      aria-label={`Insert ${count} columns`}
      disabled={disabled}
      render={<Button variant="ghost" size="sm" />}
      onMouseDown={handleMouseDown}
      onFocus={capture}
      onClick={handleClick}
    >
      {count} columns
    </ToolbarButton>
  )
}

function EditorColumnLayoutButton({
  preset,
  disabled,
  capture,
  apply,
}: {
  preset: { label: string; layout: EditorColumnsLayout }
  disabled: boolean
  capture: () => void
  apply: (layout: EditorColumnsLayout) => void
}) {
  const handleMouseDown = useStableCallback(function handleMouseDown(
    event: MouseEvent<HTMLElement>,
  ) {
    event.preventDefault()
    capture()
  })

  const handleClick = useStableCallback(function handleClick() {
    apply(preset.layout)
  })

  return (
    <ToolbarButton
      aria-label={preset.label}
      disabled={disabled}
      render={<Button variant="ghost" size="sm" />}
      onMouseDown={handleMouseDown}
      onFocus={capture}
      onClick={handleClick}
    >
      {preset.label}
    </ToolbarButton>
  )
}

function EditorColumnResizeSlider({
  boundary,
  disabled,
  label,
  max,
  min,
  value,
  onCancel,
  onFinish,
  onResize,
  onStart,
}: {
  boundary: number
  disabled: boolean
  label: string
  max: number
  min: number
  value: number
  onCancel: () => void
  onFinish: () => void
  onResize: (boundary: number, width: number, reason: string) => void
  onStart: () => void
}) {
  const handleKeyDown = useStableCallback(function handleKeyDown(
    event: KeyboardEvent<HTMLElement>,
  ) {
    if (event.key === "Escape") onCancel()
    else onStart()
  })

  const handleValueChange = useStableCallback(function handleValueChange(
    value: Parameters<SliderValueChange>[0],
    details: Parameters<SliderValueChange>[1],
  ) {
    if (isSingleSliderValue(value)) onResize(boundary, value, details.reason)
  })

  return (
    <Slider
      aria-label={label}
      disabled={disabled}
      max={max}
      min={min}
      xstyle={styles.resizeSlider}
      value={value}
      onFocus={onStart}
      onPointerDown={onStart}
      onPointerCancel={onCancel}
      onBlur={onCancel}
      onKeyDown={handleKeyDown}
      onValueChange={handleValueChange}
      onValueCommitted={onFinish}
    />
  )
}

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

  const capture = useStableCallback(function capture() {
    editor.getEditorState().read(bookmark.capture)
  })

  const [insert] = useState(
    () =>
      function insert(count: number) {
        if (!editor.isEditable() || !bookmark.getSnapshot()) return
        const revision = bookmark.getRevision()
        let inserted = false

        editor.update(
          () => {
            if (bookmark.getRevision() !== revision || !bookmark.restore())
              return

            const layout =
              count === 2
                ? [50, 50]
                : count === 3
                  ? [34, 33, 33]
                  : [25, 25, 25, 25]

            inserted = editor.dispatchCommand(
              INSERT_EDITOR_COLUMNS_COMMAND,
              layout,
            )
          },
          { discrete: true, tag: HISTORY_PUSH_TAG },
        )

        bookmark.clear()

        if (inserted) editor.focus()
      },
  )

  return (
    <Wrap>
      {[2, 3, 4].map((count) => (
        <EditorColumnInsertButton
          key={count}
          count={count}
          disabled={!editable || context !== null}
          capture={capture}
          insert={insert}
        />
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

  const capture = useStableCallback(function capture() {
    editor.getEditorState().read(() => {
      const context = $getEditorColumnsContext()

      if (!context) return
      bookmark.capture()
      target.current = {
        groupKey: context.group.getKey(),
        revision: bookmark.getRevision(),
      }
    })
  })

  const [apply] = useState(
    () =>
      function apply(layout: EditorColumnsLayout) {
        const selected = target.current

        if (!editor.isEditable() || !selected) return
        let applied = false

        editor.update(
          () => {
            if (
              bookmark.getRevision() !== selected.revision ||
              !bookmark.restore()
            )
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
      },
  )

  if (!context) return null

  return (
    <Wrap>
      {presets.map((preset) => (
        <EditorColumnLayoutButton
          key={preset.label}
          preset={preset}
          disabled={!editable}
          capture={capture}
          apply={apply}
        />
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

  const start = useStableCallback(function start() {
    const context = editor.getEditorState().read($getEditorColumnsContext)

    if (session.current || !context || !editor.isEditable()) return
    editor.getEditorState().read(bookmark.capture)
    session.current = {
      groupKey: context.group.getKey(),
      revision: bookmark.getRevision(),
      initialLayout: context.layout,
      changed: false,
    }
  })

  const finish = useStableCallback(function finish() {
    session.current = null
    bookmark.clear()
  })

  const cancel = useStableCallback(function cancel() {
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
  })

  const resize = useStableCallback(function resize(
    boundary: number,
    width: number,
    reason: string,
  ) {
    start()
    const current = session.current

    if (
      !current ||
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
  })

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
          <EditorColumnResizeSlider
            key={`${context.group.getKey()}-${boundary}`}
            boundary={boundary}
            disabled={!editable}
            label={`Resize between column ${boundary + 1} and column ${boundary + 2}`}
            max={maximum}
            min={minimum}
            value={firstWidth}
            onCancel={cancel}
            onFinish={finish}
            onResize={resize}
            onStart={start}
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

  const [move] = useState(
    () =>
      function move(direction: "left" | "right") {
        if (!editor.isEditable()) return
        editor.update(
          () => {
            editor.dispatchCommand(MOVE_EDITOR_COLUMN_COMMAND, direction)
          },
          { discrete: true, tag: HISTORY_PUSH_TAG },
        )
        editor.focus()
      },
  )

  const moveLeft = useStableCallback(function moveLeft() {
    move("left")
  })

  const moveRight = useStableCallback(function moveRight() {
    move("right")
  })

  if (!context || context.columnIndex === null) return null

  return (
    <Wrap>
      <ToolbarButton
        aria-label="Move column left"
        disabled={!editable || context.columnIndex === 0}
        render={<Button variant="ghost" size="sm" />}
        onMouseDown={preventColumnButtonFocus}
        onClick={moveLeft}
      >
        Move left
      </ToolbarButton>
      <ToolbarButton
        aria-label="Move column right"
        disabled={
          !editable || context.columnIndex === context.layout.length - 1
        }
        render={<Button variant="ghost" size="sm" />}
        onMouseDown={preventColumnButtonFocus}
        onClick={moveRight}
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

  const remove = useStableCallback(function remove() {
    if (!editor.isEditable()) return
    editor.update(
      () => {
        editor.dispatchCommand(REMOVE_EDITOR_COLUMNS_COMMAND, undefined)
      },
      { discrete: true, tag: HISTORY_PUSH_TAG },
    )
    editor.focus()
  })

  if (!context) return null

  return (
    <ToolbarButton
      aria-label="Remove columns"
      disabled={!editable}
      render={<Button variant="destructive-outline" size="sm" />}
      onMouseDown={preventColumnButtonFocus}
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
