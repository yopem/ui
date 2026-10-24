"use client"

import type { ComponentProps, ReactNode } from "react"

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

export function EditorBlockSelection({
  controller,
  children,
  xstyle,
  onKeyDown,
  ...props
}: ComponentProps<typeof Box> & {
  controller: EditorBlockSelectionController
  children: ReactNode
}) {
  const [initial] = useState(() => controller)

  if (initial !== controller)
    throw new Error("Keep the block selection controller stable")

  return (
    <Context value={controller}>
      <Box
        {...props}
        data-slot="editor-block-selection"
        xstyle={[styles.root, xstyle]}
        onKeyDown={function keyDown(event) {
          onKeyDown?.(event)

          if (event.defaultPrevented) return

          if (event.key === "Escape") {
            controller.cancelDrag()
            controller.clear()
            event.preventDefault()
          }

          if (
            event.target instanceof HTMLElement &&
            event.target.isContentEditable
          )
            return
          const current = controller.getSnapshot()

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
        }}
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

  return (
    <Box
      render={<fieldset />}
      aria-label="Block selection gutter"
      data-slot="editor-block-selection-gutter"
      ref={connect}
      xstyle={[styles.group, styles.gutter]}
      onPointerDown={function down(event) {
        if (event.target !== event.currentTarget || event.button !== 0) return
        event.preventDefault()
        event.currentTarget.setPointerCapture(event.pointerId)
        controller.startMarquee(event.clientY, event.ctrlKey || event.metaKey)
      }}
      onPointerMove={function move(event) {
        if (event.currentTarget.hasPointerCapture(event.pointerId))
          controller.marquee(event.clientY)
      }}
      onPointerUp={function up(event) {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId)
          controller.endMarquee()
        }
      }}
      onPointerCancel={function cancel() {
        controller.endMarquee()
      }}
    >
      {state.layout.map(({ key, top }, index) => (
        <HStack key={key} xstyle={styles.row(top)}>
          <Button
            variant="ghost"
            size="icon"
            xstyle={[styles.handle, selected.has(key) && styles.selected]}
            aria-label={`Select block ${index + 1}`}
            aria-pressed={selected.has(key)}
            onClick={function select(event) {
              controller.select(key, {
                shift: event.shiftKey,
                toggle: event.ctrlKey || event.metaKey,
              })
            }}
          >
            {index + 1}
          </Button>
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

  return (
    <Button
      {...props}
      variant={props.variant ?? "ghost"}
      size={props.size ?? "icon"}
      aria-label={label}
      data-slot="editor-block-drag-handle"
      disabled={!state.editable || props.disabled}
      xstyle={[styles.handle, props.xstyle]}
      onPointerDown={function down(event) {
        if (event.button !== 0 || !controller.beginDrag(blockKey)) return
        event.preventDefault()
        pointer.current = { x: event.clientX, y: event.clientY, moved: false }
        event.currentTarget.setPointerCapture(event.pointerId)
      }}
      onPointerMove={function move(event) {
        const start = pointer.current

        if (!start || !event.currentTarget.hasPointerCapture(event.pointerId))
          return

        if (Math.hypot(event.clientX - start.x, event.clientY - start.y) >= 6)
          start.moved = true

        if (start.moved) controller.previewDrop(event.clientY)
      }}
      onPointerUp={function up(event) {
        if (!event.currentTarget.hasPointerCapture(event.pointerId)) return

        if (controller.getSnapshot().dragging && pointer.current?.moved)
          controller.dropAt(event.clientY)
        else controller.cancelDrag()
        pointer.current = null
        event.currentTarget.releasePointerCapture(event.pointerId)
        event.currentTarget.focus()
      }}
      onPointerCancel={function cancel() {
        pointer.current = null
        controller.cancelDrag()
      }}
      onLostPointerCapture={function lost(event) {
        pointer.current = null
        controller.cancelDrag()
        props.onLostPointerCapture?.(event)
      }}
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
            <Button
              variant="outline"
              disabled={!state.mode}
              onClick={function clear() {
                controller.clear()
              }}
            >
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
      onClick={function click(event) {
        props.onClick?.(event)

        if (event.defaultPrevented) return

        if (action === "up" || action === "down") controller.move(action)
        else if (action === "duplicate") controller.duplicate()
        else if (action === "delete") controller.remove()
        else if (action === "copy") void controller.copy()
        else controller.cut()
      }}
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
