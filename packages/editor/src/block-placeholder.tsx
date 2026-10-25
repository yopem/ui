"use client"

import { $isHeadingNode } from "@lexical/rich-text"
import { Box } from "@registry/components/ui/box"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import {
  $getSelection,
  $isElementNode,
  $isRangeSelection,
  $isRootNode,
  type LexicalEditor,
} from "lexical"
import {
  useState,
  useSyncExternalStore,
  type ComponentPropsWithRef,
} from "react"
import { z } from "zod"

import { useEditor } from "./root"

export type EditorBlockPlaceholderLabels = Readonly<Record<string, string>>

export interface EditorBlockPlaceholderProps extends Omit<
  ComponentPropsWithRef<"output">,
  "children" | "style"
> {
  labels?: EditorBlockPlaceholderLabels
  xstyle?: stylex.StyleXStyles
}

const defaultLabels = {
  paragraph: "Type text…",
  h1: "Heading 1",
  h2: "Heading 2",
  h3: "Heading 3",
  h4: "Heading 4",
  h5: "Heading 5",
  h6: "Heading 6",
  quote: "Write a quote…",
  code: "Write code…",
} satisfies EditorBlockPlaceholderLabels

const labelsSchema = z
  .record(z.string().min(1).max(64), z.string().max(512))
  .refine((labels) => Object.keys(labels).length <= 64)

const owners = new WeakMap<LexicalEditor, symbol>()

const attribute = "data-editor-block-placeholder"

const styles = stylex.create({
  active: {
    position: "relative",
    "::before": {
      content: "attr(data-editor-block-placeholder)",
      color: tokens["--muted-foreground"],
      position: "absolute",
      pointerEvents: "none",
      userSelect: "none",
      maxInlineSize: "100%",
      whiteSpace: "pre-wrap",
      overflowWrap: "anywhere",
    },
  },
  status: {
    position: "absolute",
    inlineSize: 1,
    blockSize: 1,
    padding: 0,
    margin: -1,
    borderWidth: 0,
    overflow: "hidden",
    clipPath: "inset(50%)",
    whiteSpace: "nowrap",
  },
})

function serverSnapshot() {
  return ""
}

function createPlaceholderStore(
  editor: LexicalEditor,
  options: EditorBlockPlaceholderLabels,
) {
  const labels = new Map(
    Object.entries({ ...defaultLabels, ...labelsSchema.parse(options) }),
  )

  const classes = (stylex.props(styles.active).className ?? "")
    .split(/\s+/)
    .filter(Boolean)

  const owner = Symbol("editor-block-placeholder")
  const listeners = new Set<() => void>()
  let root: HTMLElement | null = null
  let snapshot = ""

  let painted: {
    element: HTMLElement
    previous: string | null
    label: string
    classes: string[]
  } | null = null

  let disconnect: (() => void) | null = null

  function clearPaint() {
    if (!painted) return
    const { element, previous, label, classes: added } = painted

    if (element.getAttribute(attribute) === label) {
      if (previous === null) element.removeAttribute(attribute)
      else element.setAttribute(attribute, previous)
    }

    for (const name of added) element.classList.remove(name)
    painted = null
  }

  function getActive() {
    if (
      !root ||
      !editor.isEditable() ||
      !root.contains(root.ownerDocument.activeElement)
    )
      return null

    return editor.getEditorState().read(() => {
      const selection = $getSelection()

      if (!$isRangeSelection(selection) || !selection.isCollapsed()) return null
      const node = selection.anchor.getNode()

      const block = $isRootNode(node)
        ? node.getChildAtIndex(selection.anchor.offset)
        : node.getTopLevelElement()

      if (
        !$isElementNode(block) ||
        !$isRootNode(block.getParent()) ||
        !block.isEmpty()
      )
        return null

      const label = labels.get(
        $isHeadingNode(block) ? block.getTag() : block.getType(),
      )

      if (!label) return null
      const element = editor.getElementByKey(block.getKey())

      if (!element || !root?.contains(element)) return null

      return { element, label }
    })
  }

  function paint() {
    const active = getActive()

    if (
      active?.element !== painted?.element ||
      active?.label !== painted?.label
    ) {
      clearPaint()

      if (active) {
        const added = classes.filter(
          (name) => !active.element.classList.contains(name),
        )

        painted = {
          ...active,
          previous: active.element.getAttribute(attribute),
          classes: added,
        }
        active.element.setAttribute(attribute, active.label)

        for (const name of added) active.element.classList.add(name)
      }
    }

    const next = active?.label ?? ""

    if (next !== snapshot) {
      snapshot = next

      for (const listener of listeners) listener()
    }
  }

  function detachRoot() {
    root?.removeEventListener("focusin", paint)
    root?.removeEventListener("focusout", paint)
    clearPaint()
    root = null
  }

  function getSnapshot() {
    return snapshot
  }

  function subscribe(listener: () => void) {
    if (listeners.size === 0) {
      if (owners.has(editor))
        throw new Error("Mount one EditorBlockPlaceholder per root")
      owners.set(editor, owner)

      const unregisterRoot = editor.registerRootListener((nextRoot) => {
        detachRoot()
        root = nextRoot
        root?.addEventListener("focusin", paint)
        root?.addEventListener("focusout", paint)
        paint()
      })

      const unregisterUpdate = editor.registerUpdateListener(paint)
      const unregisterEditable = editor.registerEditableListener(paint)
      disconnect = function disconnectPlaceholder() {
        unregisterEditable()
        unregisterUpdate()
        unregisterRoot()
        detachRoot()
        snapshot = ""

        if (owners.get(editor) === owner) owners.delete(editor)
      }
    }

    listeners.add(listener)
    paint()

    return function unsubscribe() {
      listeners.delete(listener)

      if (listeners.size === 0) {
        disconnect?.()
        disconnect = null
      }
    }
  }

  return { subscribe, getSnapshot }
}

export function EditorBlockPlaceholder({
  labels = defaultLabels,
  xstyle,
  ...props
}: EditorBlockPlaceholderProps) {
  const editor = useEditor()
  const [store] = useState(() => createPlaceholderStore(editor, labels))

  const text = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    serverSnapshot,
  )

  return (
    <Box
      render={<output {...props} />}
      aria-label="Selected block placeholder"
      aria-live="polite"
      aria-atomic="true"
      data-slot="editor-block-placeholder"
      xstyle={[styles.status, xstyle]}
    >
      {text}
    </Box>
  )
}
