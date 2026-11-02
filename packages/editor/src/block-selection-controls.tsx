"use client"

import type { BaseUIEvent } from "@base-ui/react/types"
import type {
  ComponentProps,
  KeyboardEvent,
  MouseEvent,
  PointerEvent,
  ReactNode,
} from "react"

import { mergeProps } from "@base-ui/react/merge-props"
import { useMergedRefs } from "@base-ui/utils/useMergedRefs"
import { useStableCallback } from "@base-ui/utils/useStableCallback"
import { Box } from "@registry/components/ui/box"
import { Button } from "@registry/components/ui/button"
import { HStack } from "@registry/components/ui/hstack"
import { Wrap } from "@registry/components/ui/wrap"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import { GripVertical } from "lucide-react"
import {
  createContext,
  use,
  useRef,
  useState,
  useSyncExternalStore,
} from "react"

import type { EditorBlockSelectionController } from "./block-selection"

const Context = createContext<EditorBlockSelectionController | null>(null)

const styles = stylex.create({
  blockTarget: { minBlockSize: "44px" },
  root: {
    position: "relative",
    paddingInlineStart: `calc(${tokens["--spacing"]} * 22)`,
  },
  group: { borderWidth: 0, marginBlock: 0, marginInline: 0, padding: 0 },
  gutter: {
    position: "absolute",
    insetInlineStart: 0,
    insetBlock: 0,
    inlineSize: `calc(${tokens["--spacing"]} * 22)`,
    touchAction: "none",
  },
  row: (top: number) => ({
    position: "absolute",
    insetBlockStart: top,
    insetInlineStart: 0,
    gap: 0,
  }),
  handle: { minInlineSize: "44px", minBlockSize: "44px", touchAction: "none" },
  selected: {
    backgroundColor: tokens["--accent"],
    color: tokens["--accent-foreground"],
  },
  status: { color: tokens["--muted-foreground"] },
  dropBefore: { boxShadow: `0 -2px 0 ${tokens["--ring"]}` },
  dropAfter: { boxShadow: `0 2px 0 ${tokens["--ring"]}` },
})

export function useEditorBlockSelection() {
  const controller = use(Context)

  if (!controller)
    throw new Error("Place block selection parts inside EditorBlockSelection")

  const state = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getServerSnapshot,
  )

  return { controller, state }
}

function EditorBlockSelectionSelectButton({
  blockKey,
  index,
  selected,
}: {
  blockKey: string
  index: number
  selected: boolean
}) {
  const { controller } = useEditorBlockSelection()

  const select = useStableCallback(function select(
    event: MouseEvent<HTMLButtonElement>,
  ) {
    controller.select(blockKey, {
      shift: event.shiftKey,
      toggle: event.ctrlKey || event.metaKey,
    })
  })

  return (
    <Button
      variant="ghost"
      size="icon"
      xstyle={[styles.handle, selected && styles.selected]}
      aria-label={`Select block ${index + 1}`}
      aria-pressed={selected}
      onClick={select}
    >
      {index + 1}
    </Button>
  )
}

export function EditorBlockSelection({
  controller,
  children,
  xstyle,
  ref,
  onKeyDown,
  onKeyDownCapture,
  ...props
}: ComponentProps<typeof Box> & {
  controller: EditorBlockSelectionController
  children: ReactNode
}) {
  const [initial] = useState(() => controller)

  const [connect] = useState(
    () =>
      function connect(element: HTMLDivElement | null) {
        if (element) return controller.connectKeyboardBoundary(element)
      },
  )

  const mergedRef = useMergedRefs(connect, ref)

  const captureKeyDown = useStableCallback(function captureKeyDown(
    event: BaseUIEvent<KeyboardEvent<HTMLDivElement>>,
  ) {
    controller.captureKeyboardEvent(event.nativeEvent, event.currentTarget)
    mergeProps<"div">(undefined, { onKeyDownCapture }).onKeyDownCapture?.(event)
  })

  const handleKeyDown = useStableCallback(function handleKeyDown(
    event: KeyboardEvent<HTMLDivElement>,
  ) {
    if (
      event.defaultPrevented ||
      event.nativeEvent.isComposing ||
      event.nativeEvent.keyCode === 229
    )
      return
    const current = controller.getSnapshot()

    if (controller.escape(event.nativeEvent)) {
      event.preventDefault()

      return
    }

    if (event.target instanceof HTMLElement && event.target.isContentEditable)
      return

    if (
      current.mode &&
      (event.key === "ArrowUp" || event.key === "ArrowDown")
    ) {
      const direction = event.key === "ArrowUp" ? "up" : "down"

      if (event.altKey) controller.move(direction)
      else {
        const key =
          direction === "up"
            ? current.selected[0]
            : current.selected[current.selected.length - 1]

        const index = key ? current.blocks.indexOf(key) : -1
        const next = current.blocks[index + (direction === "up" ? -1 : 1)]

        if (next) controller.select(next, { shift: event.shiftKey })
      }

      event.preventDefault()
    }

    if (
      (event.ctrlKey || event.metaKey) &&
      event.key.toLowerCase() === "a" &&
      controller.getSnapshot().mode
    ) {
      controller.selectAll()
      event.preventDefault()
    }
  })

  if (initial !== controller)
    throw new Error("Keep the block selection controller stable")

  return (
    <Context value={controller}>
      <Box
        {...props}
        ref={mergedRef}
        data-slot="editor-block-selection"
        onKeyDownCapture={captureKeyDown}
        xstyle={[styles.root, xstyle]}
        onKeyDown={
          mergeProps<"div">({ onKeyDown: handleKeyDown }, { onKeyDown })
            .onKeyDown
        }
      >
        {children}
      </Box>
    </Context>
  )
}

export function EditorBlockSelectionGutter() {
  const { controller, state } = useEditorBlockSelection()
  const selected = new Set(state.selected)

  const [connect] = useState(
    () =>
      function connect(element: HTMLDivElement | null) {
        if (!element) return
        const disconnect = controller.connectGutter(element)
        const owned = new Map<HTMLElement, string[]>()

        function restore() {
          for (const [node, names] of owned) node.classList.remove(...names)
          owned.clear()
        }

        function paint() {
          restore()
          const current = controller.getSnapshot()
          const selectedKeys = new Set(current.selected)

          for (const key of current.blocks) {
            const node = controller.getBlockElement(key)

            if (!node) continue
            const drop = current.dropTarget

            const classes =
              stylex
                .props(
                  styles.blockTarget,
                  selectedKeys.has(key) && styles.selected,
                  drop?.key === key &&
                    (drop.edge === "before"
                      ? styles.dropBefore
                      : styles.dropAfter),
                )
                .className?.split(" ")
                .filter((name) => name && !node.classList.contains(name)) ?? []

            if (classes.length) {
              node.classList.add(...classes)
              owned.set(node, classes)
            }
          }
        }

        const unsubscribe = controller.subscribe(paint)
        paint()

        return function cleanup() {
          unsubscribe()
          restore()
          disconnect()
        }
      },
  )

  const handlePointerDown = useStableCallback(function handlePointerDown(
    event: PointerEvent<HTMLDivElement>,
  ) {
    if (event.target !== event.currentTarget || event.button !== 0) return
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    controller.startMarquee(event.clientY, event.ctrlKey || event.metaKey)
  })

  const handlePointerMove = useStableCallback(function handlePointerMove(
    event: PointerEvent<HTMLDivElement>,
  ) {
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      controller.marquee(event.clientY)
  })

  const handlePointerUp = useStableCallback(function handlePointerUp(
    event: PointerEvent<HTMLDivElement>,
  ) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
      controller.endMarquee()
    }
  })

  const handlePointerCancel = useStableCallback(function handlePointerCancel() {
    controller.endMarquee()
  })

  return (
    <Box
      render={<fieldset />}
      aria-label="Block selection gutter"
      data-slot="editor-block-selection-gutter"
      ref={connect}
      xstyle={[styles.group, styles.gutter]}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
    >
      {state.layout.map(({ key, top }, index) => (
        <HStack key={key} xstyle={styles.row(top)}>
          <EditorBlockSelectionSelectButton
            blockKey={key}
            index={index}
            selected={selected.has(key)}
          />
          <EditorBlockDragHandle
            blockKey={key}
            label={`Drag block ${index + 1}`}
          />
        </HStack>
      ))}
    </Box>
  )
}

export function EditorBlockDragHandle({
  blockKey,
  label = "Drag block",
  ...props
}: Omit<
  ComponentProps<typeof Button>,
  "onPointerDown" | "onPointerMove" | "onPointerUp" | "onPointerCancel"
> & { blockKey: string; label?: string }) {
  const { controller, state } = useEditorBlockSelection()
  const pointer = useRef<{ x: number; y: number; moved: boolean } | null>(null)

  const handlePointerDown = useStableCallback(function handlePointerDown(
    event: PointerEvent<HTMLButtonElement>,
  ) {
    if (event.button !== 0 || !controller.beginDrag(blockKey)) return
    event.preventDefault()
    pointer.current = { x: event.clientX, y: event.clientY, moved: false }
    event.currentTarget.setPointerCapture(event.pointerId)
  })

  const handlePointerMove = useStableCallback(function handlePointerMove(
    event: PointerEvent<HTMLButtonElement>,
  ) {
    const start = pointer.current

    if (!start || !event.currentTarget.hasPointerCapture(event.pointerId))
      return

    if (Math.hypot(event.clientX - start.x, event.clientY - start.y) >= 6)
      start.moved = true

    if (start.moved) controller.previewDrop(event.clientY)
  })

  const handlePointerUp = useStableCallback(function handlePointerUp(
    event: PointerEvent<HTMLButtonElement>,
  ) {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return

    if (controller.getSnapshot().dragging && pointer.current?.moved)
      controller.dropAt(event.clientY)
    else controller.cancelDrag()
    pointer.current = null
    event.currentTarget.releasePointerCapture(event.pointerId)
    event.currentTarget.focus()
  })

  const handlePointerCancel = useStableCallback(function handlePointerCancel() {
    pointer.current = null
    controller.cancelDrag()
  })

  const handleLostPointerCapture = useStableCallback(
    function handleLostPointerCapture(event: PointerEvent<HTMLButtonElement>) {
      pointer.current = null
      controller.cancelDrag()
      props.onLostPointerCapture?.(event)
    },
  )

  return (
    <Button
      {...props}
      variant={props.variant ?? "ghost"}
      size={props.size ?? "icon"}
      aria-label={label}
      data-slot="editor-block-drag-handle"
      disabled={!state.editable || props.disabled}
      xstyle={[styles.handle, props.xstyle]}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onLostPointerCapture={handleLostPointerCapture}
    >
      {props.children ?? <GripVertical size={16} aria-hidden="true" />}
    </Button>
  )
}

export function EditorBlockSelectionActions({
  children,
  ...props
}: ComponentProps<typeof Wrap>) {
  const { controller, state } = useEditorBlockSelection()

  const clear = useStableCallback(function clear() {
    controller.clear()
  })

  return (
    <Box render={<fieldset />} aria-label="Block actions" xstyle={styles.group}>
      <Wrap {...props}>
        {children ?? (
          <>
            <EditorBlockSelectionAction action="up">
              Move blocks up
            </EditorBlockSelectionAction>
            <EditorBlockSelectionAction action="down">
              Move blocks down
            </EditorBlockSelectionAction>
            <EditorBlockSelectionAction action="duplicate">
              Duplicate blocks
            </EditorBlockSelectionAction>
            <EditorBlockSelectionAction action="delete">
              Delete blocks
            </EditorBlockSelectionAction>
            <EditorBlockSelectionAction action="copy">
              Copy blocks
            </EditorBlockSelectionAction>
            <EditorBlockSelectionAction action="cut">
              Cut blocks
            </EditorBlockSelectionAction>
            <Button variant="outline" disabled={!state.mode} onClick={clear}>
              Clear block selection
            </Button>
          </>
        )}
      </Wrap>
    </Box>
  )
}

export function EditorBlockSelectionAction({
  action,
  ...props
}: ComponentProps<typeof Button> & {
  action: "up" | "down" | "duplicate" | "delete" | "copy" | "cut"
}) {
  const { controller, state } = useEditorBlockSelection()

  const handleClick = useStableCallback(function handleClick(
    event: MouseEvent<HTMLButtonElement>,
  ) {
    props.onClick?.(event)

    if (event.defaultPrevented) return

    if (action === "up" || action === "down") controller.move(action)
    else if (action === "duplicate") controller.duplicate()
    else if (action === "delete") controller.remove()
    else if (action === "copy") void controller.copy()
    else controller.cut()
  })

  return (
    <Button
      {...props}
      variant={props.variant ?? "outline"}
      data-slot="editor-block-selection-action"
      disabled={
        (props.disabled ?? false) ||
        !state.mode ||
        (action !== "copy" && !state.editable)
      }
      onClick={handleClick}
    />
  )
}

export function EditorBlockSelectionStatus() {
  const { state } = useEditorBlockSelection()

  return (
    <Box render={<output />} aria-live="polite" xstyle={styles.status}>
      {state.error ??
        `${state.selected.length} blocks selected${state.dragging ? "; dragging" : ""}`}
    </Box>
  )
}
