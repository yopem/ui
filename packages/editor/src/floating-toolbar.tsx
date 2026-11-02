"use client"

import type { ComponentProps, FocusEvent, MouseEvent, ReactNode } from "react"

import { TOGGLE_LINK_COMMAND } from "@lexical/link"
import { Button } from "@registry/components/ui/button"
import { Popover, PopoverPopup } from "@registry/components/ui/popover"
import { ToolbarLink } from "@registry/components/ui/toolbar"
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  KEY_DOWN_COMMAND,
  HISTORY_PUSH_TAG,
  type LexicalEditor,
} from "lexical"
import { useId, useState, useSyncExternalStore } from "react"

import type { EditorToolbarProps } from "./controls"

import { EditorCommandButton, EditorToolbar } from "./controls"
import { EditorLinkControl } from "./link-control"
import { $getEditorLinkEditTarget } from "./link-edit"
import { isSafeLink } from "./link-url"
import { useEditor, useEditorState } from "./root"
import { createEditorSelectionBookmark } from "./selection-bookmark"

type PositionerProps = ComponentProps<typeof PopoverPopup>

type PopupProps = ComponentProps<typeof PopoverPopup>

type FloatingAnchor = NonNullable<PositionerProps["anchor"]>

type PopupCloseType = FirstArgument<NonNullable<PopupProps["finalFocus"]>>

interface FloatingToolbarSnapshot {
  open: boolean
  anchor: FloatingAnchor | null
  url: string | null
}

type FirstArgument<T> = T extends (
  argument: infer Argument,
  ...rest: never[]
) => void
  ? Argument
  : never

export type EditorFloatingToolbarProps = Omit<
  EditorToolbarProps,
  "children" | "id"
> & {
  align?: PositionerProps["align"]
  alignOffset?: PositionerProps["alignOffset"]
  children: ReactNode
  side?: PositionerProps["side"]
  sideOffset?: PositionerProps["sideOffset"]
}

export function EditorFloatingToolbar(props: EditorFloatingToolbarProps) {
  return <FloatingToolbar {...props} selection="text" />
}

export type EditorLinkFloatingToolbarProps = Omit<
  EditorFloatingToolbarProps,
  "children"
> & {
  children?: ReactNode
}

export function EditorLinkFloatingToolbar({
  children,
  "aria-label": label = "Selected link",
  ...props
}: EditorLinkFloatingToolbarProps) {
  return (
    <FloatingToolbar {...props} selection="link" aria-label={label}>
      {children}
    </FloatingToolbar>
  )
}

function EditorLinkActions({ url }: { url: string }) {
  const editor = useEditor()

  function removeLink() {
    editor.update(
      () => {
        editor.dispatchCommand(TOGGLE_LINK_COMMAND, null)
      },
      { tag: HISTORY_PUSH_TAG },
    )
  }

  return (
    <>
      <ToolbarLink
        href={url || undefined}
        target="_blank"
        rel="noopener noreferrer"
        render={
          <Button
            variant="ghost"
            size="sm"
            render={<a href={url} aria-label="Open link" />}
          />
        }
      >
        Open link
      </ToolbarLink>
      <EditorLinkControl aria-label="Edit link">Edit link</EditorLinkControl>
      <EditorCommandButton command={removeLink}>
        Remove link
      </EditorCommandButton>
    </>
  )
}

function FloatingToolbar({
  align = "center",
  alignOffset = 0,
  children,
  side = "top",
  sideOffset = 8,
  "aria-label": label,
  selection,
  ...props
}: EditorFloatingToolbarProps & { selection: "text" | "link" }) {
  const editor = useEditor()
  const editorState = useEditorState()
  const toolbarId = useId()

  const [controller] = useState(() =>
    createEditorFloatingToolbar(editor, toolbarId, selection),
  )

  const snapshot = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getServerSnapshot,
  )

  const accessibleName = label ?? `${editorState.ariaLabel} formatting`

  return (
    <Popover
      open={snapshot.open}
      modal={false}
      onOpenChange={controller.handleOpenChange}
    >
      <PopoverPopup
        align={align}
        alignOffset={alignOffset}
        anchor={snapshot.anchor ?? undefined}
        side={side}
        sideOffset={sideOffset}
        aria-label={accessibleName}
        data-slot="editor-floating-toolbar-popup"
        finalFocus={controller.finalFocus}
        initialFocus={false}
        onClickCapture={controller.restoreOnClick}
        onFocusCapture={controller.captureFocus}
        onBlurCapture={controller.blur}
        onPointerDownCapture={controller.capture}
      >
        <EditorToolbar
          {...props}
          id={toolbarId}
          aria-label={accessibleName}
          data-slot="editor-floating-toolbar"
        >
          {selection === "link" && children === undefined ? (
            <EditorLinkActions url={snapshot.url ?? ""} />
          ) : (
            children
          )}
        </EditorToolbar>
      </PopoverPopup>
    </Popover>
  )
}

function createEditorFloatingToolbar(
  editor: LexicalEditor,
  toolbarId: string,
  selectionKind: "text" | "link",
) {
  function getToolbar() {
    const root = editor.getRootElement()

    return root?.ownerDocument.getElementById(toolbarId) ?? null
  }

  const bookmark = createEditorSelectionBookmark(editor)
  const listeners = new Set<() => void>()

  const serverSnapshot: FloatingToolbarSnapshot = {
    open: false,
    anchor: null,
    url: null,
  }

  let snapshot = serverSnapshot
  let root: HTMLElement | null = null
  let blocked = false
  let popupFocusTarget: Element | null = null
  let removeRootListeners: (() => void) | undefined
  let disconnect: (() => void) | undefined

  function publish(next: FloatingToolbarSnapshot) {
    snapshot = next

    for (const listener of listeners) listener()
  }

  function hide(clearBookmark = true) {
    if (clearBookmark) bookmark.clear()

    if (snapshot.open || snapshot.anchor) publish(serverSnapshot)
  }

  function dismiss() {
    blocked = true
    hide()
  }

  function isToolbarFocused() {
    const activeElement = root?.ownerDocument.activeElement

    return activeElement !== null && activeElement !== undefined
      ? activeElement === popupFocusTarget ||
          (getToolbar()?.contains(activeElement) ?? false)
      : false
  }

  function capture() {
    if (
      blocked ||
      !snapshot.open ||
      !editor.isEditable() ||
      bookmark.getSnapshot()
    )
      return

    editor.getEditorState().read(() => {
      const selection = $getSelection()

      if (
        $isRangeSelection(selection) &&
        (selectionKind === "link" || !selection.isCollapsed())
      )
        bookmark.capture()
    })
  }

  function captureFocus(event: FocusEvent<HTMLDivElement>) {
    popupFocusTarget = event.target
    capture()
  }

  function blur(event: FocusEvent<HTMLDivElement>) {
    if (popupFocusTarget === event.target) popupFocusTarget = null
  }

  function restore() {
    if (
      blocked ||
      !snapshot.open ||
      !editor.isEditable() ||
      !bookmark.getSnapshot()
    ) {
      hide()

      return false
    }

    let restored = false

    editor.update(() => {
      restored = bookmark.restore()
    })

    if (!restored) hide()

    return restored
  }

  function restoreOnClick(event: MouseEvent<HTMLDivElement>) {
    const nodeConstructor = event.currentTarget.ownerDocument.defaultView?.Node

    if (
      !event.defaultPrevented &&
      nodeConstructor &&
      event.target instanceof nodeConstructor &&
      getToolbar()?.contains(event.target) &&
      !restore()
    )
      event.preventDefault()
  }

  function handleOpenChange(open: boolean) {
    if (!open) dismiss()
  }

  function finalFocus(closeType: PopupCloseType) {
    return closeType === "keyboard" ? editor.getRootElement() : false
  }

  function createAnchor(
    range: Range,
    contextElement: HTMLElement,
  ): FloatingAnchor {
    return {
      contextElement,
      getBoundingClientRect() {
        return range.getBoundingClientRect()
      },
      getClientRects() {
        return range.getClientRects()
      },
    }
  }

  function selectedRange(element: HTMLElement) {
    const nativeSelection = element.ownerDocument.getSelection()

    if (!nativeSelection || nativeSelection.rangeCount === 0) return null

    const range = nativeSelection.getRangeAt(0)

    if (
      range.collapsed ||
      range.toString().length === 0 ||
      !element.contains(range.startContainer) ||
      !element.contains(range.endContainer)
    )
      return null

    return range.cloneRange()
  }

  function syncSelection() {
    const currentRoot = root

    if (!currentRoot || !editor.isEditable()) {
      hide()

      return
    }

    if (blocked || (isToolbarFocused() && bookmark.getSnapshot())) return

    let url: string | null = null

    const range = editor.getEditorState().read(() => {
      const selection = $getSelection()

      if (!$isRangeSelection(selection)) return null

      if (selectionKind === "link") {
        if (!selection.isCollapsed()) return null
        const target = $getEditorLinkEditTarget()

        const link = target?.linkKey
          ? editor.getElementByKey(target.linkKey)
          : null

        if (!link || !isSafeLink(target?.url ?? "")) return null
        const range = currentRoot.ownerDocument.createRange()
        range.selectNodeContents(link)
        url = target?.url ?? null
        bookmark.capture()

        return range
      }

      if (selection.isCollapsed()) return null
      const current = selectedRange(currentRoot)

      if (current) bookmark.capture()

      return current
    })

    if (!range) {
      hide()

      return
    }

    const bounds = range.getBoundingClientRect()

    if (bounds.width === 0 && bounds.height === 0) {
      hide()

      return
    }

    publish({ open: true, anchor: createAnchor(range, currentRoot), url })
  }

  function resumeAfterInput() {
    blocked = false
    syncSelection()
  }

  function watchRoot(nextRoot: HTMLElement | null) {
    const replacing = root !== null && root !== nextRoot
    const attaching = root === null && nextRoot !== null
    removeRootListeners?.()
    removeRootListeners = undefined
    root = nextRoot

    if (replacing) blocked = true
    else if (attaching) blocked = false

    hide()

    if (!nextRoot) return

    const document = nextRoot.ownerDocument

    document.addEventListener("selectionchange", syncSelection)
    nextRoot.addEventListener("pointerup", resumeAfterInput)
    nextRoot.addEventListener("keyup", resumeAfterInput)

    removeRootListeners = () => {
      document.removeEventListener("selectionchange", syncSelection)
      nextRoot.removeEventListener("pointerup", resumeAfterInput)
      nextRoot.removeEventListener("keyup", resumeAfterInput)
    }

    syncSelection()
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (
      event.defaultPrevented ||
      event.key !== "F10" ||
      !event.altKey ||
      !snapshot.open ||
      blocked ||
      !editor.isEditable() ||
      !bookmark.getSnapshot()
    )
      return false

    const button = getToolbar()?.querySelector<HTMLElement>(
      'button:not(:disabled):not([aria-disabled="true"]), a[href]:not([aria-disabled="true"])',
    )

    if (!button) return false

    button.focus()
    event.preventDefault()

    return true
  }

  function subscribe(listener: () => void) {
    listeners.add(listener)

    if (!disconnect) {
      const unbookmark = bookmark.subscribe(() => {
        if (!bookmark.getSnapshot()) hide(false)
      })

      const unupdate = editor.registerUpdateListener(
        ({ dirtyElements, dirtyLeaves }) => {
          if (dirtyElements.size > 0 || dirtyLeaves.size > 0) {
            blocked = true
            hide()

            return
          }

          syncSelection()
        },
      )

      const uneditable = editor.registerEditableListener((editable) => {
        if (!editable) {
          blocked = true
          hide()
        }
      })

      const unroot = editor.registerRootListener(watchRoot)

      const unkeydown = editor.registerCommand(
        KEY_DOWN_COMMAND,
        handleKeyDown,
        COMMAND_PRIORITY_LOW,
      )

      disconnect = () => {
        unbookmark()
        unupdate()
        uneditable()
        unroot()
        unkeydown()
        removeRootListeners?.()
        removeRootListeners = undefined
        root = null
        blocked = false
        popupFocusTarget = null
        hide()
      }
    }

    return function unsubscribe() {
      listeners.delete(listener)

      if (listeners.size === 0) {
        disconnect?.()
        disconnect = undefined
      }
    }
  }

  function getSnapshot() {
    return snapshot
  }

  function getServerSnapshot() {
    return serverSnapshot
  }

  return {
    capture,
    captureFocus,
    blur,
    finalFocus,
    getServerSnapshot,
    getSnapshot,
    handleOpenChange,
    restoreOnClick,
    subscribe,
  }
}
