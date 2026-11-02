"use client"

import type { EditorBlockSelectionController } from "@yopem-ui/editor/block-selection"

import { mergeProps } from "@base-ui/react/merge-props"
import { Box } from "@registry/components/ui/box"
import { Button } from "@registry/components/ui/button"
import { Toggle } from "@registry/components/ui/toggle"
import { Wrap } from "@registry/components/ui/wrap"
import {
  EditorContent,
  EditorHistoryButton,
  EditorRoot,
  EditorToolbar,
  useEditor,
} from "@yopem-ui/editor"
import {
  createEditorBlockSelection,
  EditorBlockSelection,
  EditorBlockSelectionActions,
  EditorBlockDragHandle,
  EditorBlockSelectionGutter,
  EditorBlockSelectionStatus,
} from "@yopem-ui/editor/block-selection"
import {
  $getRoot,
  $getSelection,
  $isNodeSelection,
  $isRangeSelection,
  mergeRegister,
} from "lexical"
import { useState, useSyncExternalStore } from "react"
import { createPortal } from "react-dom"

const initialState = JSON.stringify({
  root: {
    type: "root",
    version: 1,
    direction: null,
    format: "",
    indent: 0,
    children: ["First block", "Second block", "Third block"].map((text) => ({
      type: "paragraph",
      version: 1,
      direction: null,
      format: "",
      indent: 0,
      children: [
        {
          type: "text",
          version: 1,
          text,
          format: 0,
          detail: 0,
          mode: "normal",
          style: "",
        },
      ],
    })),
  },
})

function BlockSelectionEvidence({
  controller,
}: {
  controller: EditorBlockSelectionController
}) {
  const editor = useEditor()

  const [connect] = useState(
    () =>
      function connect(element: HTMLDivElement | null) {
        if (!element) return
        const target = element
        const pending = new Set<ReturnType<typeof setTimeout>>()

        function record() {
          const state = editor.getEditorState()
          target.setAttribute(
            "data-native-composing",
            String(editor.isComposing()),
          )
          target.setAttribute(
            "data-native-document",
            JSON.stringify(state.toJSON()),
          )
          target.setAttribute(
            "data-block-snapshot",
            JSON.stringify(controller.getSnapshot()),
          )
          state.read(() => {
            const selection = $getSelection()
            target.setAttribute(
              "data-native-text",
              $getRoot()
                .getChildren()
                .map((node) => node.getTextContent())
                .join(""),
            )
            target.setAttribute(
              "data-native-selection",
              $isNodeSelection(selection)
                ? "node"
                : $isRangeSelection(selection)
                  ? "range"
                  : "none",
            )
            target.setAttribute(
              "data-native-selected",
              JSON.stringify(
                $isNodeSelection(selection)
                  ? selection.getNodes().map((node) => node.getKey())
                  : [],
              ),
            )
          })
        }

        function afterNativeEvent() {
          const timer = setTimeout(() => {
            pending.delete(timer)
            record()
          }, 0)

          pending.add(timer)
        }

        const abort = new AbortController()

        for (const type of [
          "keydown",
          "compositionstart",
          "compositionend",
          "focusin",
          "focusout",
        ])
          element.ownerDocument.addEventListener(type, afterNativeEvent, {
            capture: true,
            signal: abort.signal,
          })

        const cleanup = mergeRegister(
          editor.registerUpdateListener(record),
          controller.subscribe(record),
        )

        record()

        return function disconnect() {
          cleanup()
          abort.abort()

          for (const timer of pending) clearTimeout(timer)
        }
      },
  )

  return <Box hidden data-slot="block-selection-evidence" ref={connect} />
}

const topologies = [
  "normal",
  "gutter-free",
  "portalled-content",
  "portalled-handle",
  "standalone",
] as const

export function Preview() {
  const [readOnly, setReadOnly] = useState(false)
  const [cancelDefault, setCancelDefault] = useState(false)
  const [cancelBaseUI, setCancelBaseUI] = useState(false)

  const [topology, setTopology] =
    useState<(typeof topologies)[number]>("normal")

  const [portalHost, setPortalHost] = useState<HTMLDivElement | null>(null)
  const [escapeCount, setEscapeCount] = useState(0)

  const keyboardProps = mergeProps<"div">(undefined, {
    onKeyDown(event) {
      if (event.key !== "Escape") return
      setEscapeCount((count) => count + 1)

      if (cancelDefault) event.preventDefault()

      if (cancelBaseUI) event.preventBaseUIHandler()
    },
  })

  const [setup] = useState(() => {
    const controller = createEditorBlockSelection({
      authorizeCut: () => window.confirm("Cut selected blocks?"),
    })

    return { controller, extensions: [controller.extension] }
  })

  const state = useSyncExternalStore(
    setup.controller.subscribe,
    setup.controller.getSnapshot,
    setup.controller.getServerSnapshot,
  )

  const controls = (
    <>
      <Wrap>
        <Toggle
          variant="outline"
          pressed={readOnly}
          onPressedChange={setReadOnly}
        >
          Read only
        </Toggle>
        <Toggle
          variant="outline"
          pressed={cancelDefault}
          onPressedChange={setCancelDefault}
        >
          Cancel keyboard default
        </Toggle>
        <Toggle
          variant="outline"
          pressed={cancelBaseUI}
          onPressedChange={setCancelBaseUI}
        >
          Cancel Base UI handler
        </Toggle>
        <Button
          variant="outline"
          disabled={!state.blocks.length}
          onClick={() => {
            const key = state.blocks[0]

            if (key) setup.controller.select(key)
          }}
        >
          Select first block
        </Button>
      </Wrap>
      <EditorToolbar aria-label="History controls">
        <EditorHistoryButton action="undo" />
        <EditorHistoryButton action="redo" />
      </EditorToolbar>
    </>
  )

  const content = <EditorContent placeholder="Enter block content" />

  const handle = state.blocks[0] ? (
    <EditorBlockDragHandle
      blockKey={state.blocks[0]}
      label="Custom drag block 1"
    />
  ) : null

  return (
    <Box
      data-slot="block-selection-preview"
      data-wrapper-escape-count={escapeCount}
    >
      <Wrap aria-label="Block selection compositions">
        {topologies.map((value) => (
          <Toggle
            key={value}
            variant="outline"
            pressed={topology === value}
            onPressedChange={() => {
              setTopology(value)
              setEscapeCount(0)
            }}
          >
            Composition {value}
          </Toggle>
        ))}
      </Wrap>
      <EditorRoot
        ariaLabel="Block selection editor"
        editable={!readOnly}
        initialState={initialState}
        extensions={setup.extensions}
      >
        {topology === "standalone" ? (
          <Box data-slot="block-selection-standalone">
            {controls}
            {content}
            <BlockSelectionEvidence controller={setup.controller} />
          </Box>
        ) : (
          <EditorBlockSelection
            {...keyboardProps}
            controller={setup.controller}
          >
            {controls}
            <EditorBlockSelectionActions />
            {topology !== "gutter-free" && <EditorBlockSelectionGutter />}
            {topology === "portalled-content"
              ? portalHost && createPortal(content, portalHost)
              : content}
            {topology === "portalled-handle"
              ? portalHost && createPortal(handle, portalHost)
              : handle}
            <EditorBlockSelectionStatus />
            <BlockSelectionEvidence controller={setup.controller} />
          </EditorBlockSelection>
        )}
      </EditorRoot>
      <Box data-slot="block-selection-portal-host" ref={setPortalHost} />
    </Box>
  )
}
