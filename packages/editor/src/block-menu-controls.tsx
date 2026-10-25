"use client"

import type { MouseEvent as ReactMouseEvent, ReactNode } from "react"

import {
  ContextMenu,
  ContextMenuGroup,
  ContextMenuGroupLabel,
  ContextMenuItem,
  ContextMenuPopup,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@registry/components/ui/context-menu"
import { useState, useSyncExternalStore } from "react"

import type {
  EditorBlockMenuAction,
  EditorBlockMenuController,
} from "./block-menu"

import { useEditor } from "./root"

const portalProps = { role: "region", "aria-label": "Block actions" } as const

export interface EditorBlockMenuProps {
  controller: EditorBlockMenuController
  children: ReactNode
}

function EditorBlockMenuItem({
  action,
  controller,
  disabled,
  children,
}: {
  action: EditorBlockMenuAction
  controller: EditorBlockMenuController
  disabled?: boolean
  children: ReactNode
}) {
  const [activate] = useState(
    () =>
      function activate(event: ReactMouseEvent) {
        if (event.defaultPrevented) return
        void controller.run(action)
      },
  )

  return (
    <ContextMenuItem disabled={disabled} onClick={activate}>
      {children}
    </ContextMenuItem>
  )
}

export function EditorBlockMenu({
  controller,
  children,
}: EditorBlockMenuProps) {
  const editor = useEditor()

  const snapshot = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getServerSnapshot,
  )

  const [initialController] = useState(() => controller)

  if (initialController !== controller)
    throw new Error("Keep the block menu controller stable")

  const [handlers] = useState(() => ({
    openChange: (open: boolean) => {
      if (!open) controller.close()
    },
    contextMenu: (event: ReactMouseEvent<HTMLDivElement>) => {
      if (event.defaultPrevented) return
      const captured = controller.captureFromTarget(event.target)

      if (!captured && event.button !== 2) {
        if (controller.captureFromSelection()) return
      }

      if (!captured) event.preventDefault()
    },
    finalFocus: () => editor.getRootElement() ?? false,
  }))

  const editDisabled = !snapshot.editable
  const transformDisabled = editDisabled || !snapshot.canTransform

  return (
    <ContextMenu open={snapshot.open} onOpenChange={handlers.openChange}>
      <ContextMenuTrigger
        data-slot="editor-block-menu-trigger"
        tabIndex={-1}
        onContextMenuCapture={handlers.contextMenu}
      >
        {children}
      </ContextMenuTrigger>
      <ContextMenuPopup
        finalFocus={handlers.finalFocus}
        portalProps={portalProps}
      >
        <ContextMenuGroup>
          <ContextMenuGroupLabel>Block actions</ContextMenuGroupLabel>
          <EditorBlockMenuItem action="copy" controller={controller}>
            Copy block
          </EditorBlockMenuItem>
          <EditorBlockMenuItem
            action="duplicate"
            controller={controller}
            disabled={editDisabled}
          >
            Duplicate block
          </EditorBlockMenuItem>
          <EditorBlockMenuItem
            action="delete"
            controller={controller}
            disabled={editDisabled}
          >
            Delete block
          </EditorBlockMenuItem>
        </ContextMenuGroup>
        <ContextMenuSeparator />
        <ContextMenuGroup>
          <ContextMenuGroupLabel>Block type</ContextMenuGroupLabel>
          <EditorBlockMenuItem
            action="paragraph"
            controller={controller}
            disabled={transformDisabled}
          >
            Paragraph
          </EditorBlockMenuItem>
          <EditorBlockMenuItem
            action="heading-1"
            controller={controller}
            disabled={transformDisabled}
          >
            Heading 1
          </EditorBlockMenuItem>
          <EditorBlockMenuItem
            action="heading-2"
            controller={controller}
            disabled={transformDisabled}
          >
            Heading 2
          </EditorBlockMenuItem>
          <EditorBlockMenuItem
            action="heading-3"
            controller={controller}
            disabled={transformDisabled}
          >
            Heading 3
          </EditorBlockMenuItem>
          <EditorBlockMenuItem
            action="heading-4"
            controller={controller}
            disabled={transformDisabled}
          >
            Heading 4
          </EditorBlockMenuItem>
          <EditorBlockMenuItem
            action="heading-5"
            controller={controller}
            disabled={transformDisabled}
          >
            Heading 5
          </EditorBlockMenuItem>
          <EditorBlockMenuItem
            action="heading-6"
            controller={controller}
            disabled={transformDisabled}
          >
            Heading 6
          </EditorBlockMenuItem>
          <EditorBlockMenuItem
            action="quote"
            controller={controller}
            disabled={transformDisabled}
          >
            Quote
          </EditorBlockMenuItem>
          <EditorBlockMenuItem
            action="code"
            controller={controller}
            disabled={transformDisabled}
          >
            Code block
          </EditorBlockMenuItem>
        </ContextMenuGroup>
        <ContextMenuSeparator />
        <ContextMenuGroup>
          <ContextMenuGroupLabel>Indentation</ContextMenuGroupLabel>
          <EditorBlockMenuItem
            action="indent"
            controller={controller}
            disabled={transformDisabled}
          >
            Indent
          </EditorBlockMenuItem>
          <EditorBlockMenuItem
            action="outdent"
            controller={controller}
            disabled={transformDisabled}
          >
            Outdent
          </EditorBlockMenuItem>
        </ContextMenuGroup>
        <ContextMenuSeparator />
        <ContextMenuGroup>
          <ContextMenuGroupLabel>Alignment</ContextMenuGroupLabel>
          <EditorBlockMenuItem
            action="align-left"
            controller={controller}
            disabled={transformDisabled}
          >
            Align left
          </EditorBlockMenuItem>
          <EditorBlockMenuItem
            action="align-center"
            controller={controller}
            disabled={transformDisabled}
          >
            Align center
          </EditorBlockMenuItem>
          <EditorBlockMenuItem
            action="align-right"
            controller={controller}
            disabled={transformDisabled}
          >
            Align right
          </EditorBlockMenuItem>
          <EditorBlockMenuItem
            action="align-justify"
            controller={controller}
            disabled={transformDisabled}
          >
            Align justify
          </EditorBlockMenuItem>
        </ContextMenuGroup>
        {(snapshot.canAskAI || snapshot.canCodeDrawing) && (
          <>
            <ContextMenuSeparator />
            <ContextMenuGroup>
              <ContextMenuGroupLabel>Host actions</ContextMenuGroupLabel>
              {snapshot.canAskAI && (
                <EditorBlockMenuItem action="ask-ai" controller={controller}>
                  Ask AI
                </EditorBlockMenuItem>
              )}
              {snapshot.canCodeDrawing && (
                <EditorBlockMenuItem
                  action="code-drawing"
                  controller={controller}
                >
                  Code drawing
                </EditorBlockMenuItem>
              )}
            </ContextMenuGroup>
          </>
        )}
      </ContextMenuPopup>
    </ContextMenu>
  )
}
