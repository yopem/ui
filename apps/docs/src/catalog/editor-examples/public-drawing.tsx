"use client"

import "@excalidraw/excalidraw/index.css"
import { useStableCallback } from "@base-ui/utils/useStableCallback"
import { $insertNodeToNearestRoot } from "@lexical/utils"
import { Box } from "@registry/components/ui/box"
import { Button } from "@registry/components/ui/button"
import { Checkbox } from "@registry/components/ui/checkbox"
import { Input } from "@registry/components/ui/input"
import { Label } from "@registry/components/ui/label"
import { Stack } from "@registry/components/ui/stack"
import { Text } from "@registry/components/ui/text"
import {
  EditorContent,
  EditorHistoryButton,
  EditorRoot,
  EditorToolbar,
  useEditor,
  useEditorState,
} from "@yopem-ui/editor"
import {
  $createEditorDrawingNode,
  EditorDrawingExtension,
  type EditorDrawingScene,
} from "@yopem-ui/editor/drawing"
import {
  EditorDrawingInsertButton,
  registerEditorDrawingRuntime,
} from "@yopem-ui/editor/drawing/browser"
import {
  $getRoot,
  $getSelection,
  $isRangeSelection,
  HISTORY_PUSH_TAG,
} from "lexical"
import { Redo2Icon, Undo2Icon } from "lucide-react"
import { type ComponentProps, type MouseEvent, useId, useState } from "react"

const extensions = [EditorDrawingExtension]

const assetPath = "/assets/excalidraw/"

const drawingDefaults = {
  angle: 0,
  strokeColor: "#000000",
  backgroundColor: "transparent",
  fillStyle: "solid",
  strokeWidth: 2,
  strokeStyle: "solid",
  roughness: 0,
  opacity: 100,
  groupIds: [],
  frameId: null,
  roundness: null,
  version: 1,
  versionNonce: 1,
  isDeleted: false,
  boundElements: [],
  updated: 1700000000000,
  link: null,
  locked: false,
}

const drawingFixture: EditorDrawingScene = {
  elements: [
    {
      ...drawingDefaults,
      id: "fixture-rectangle",
      type: "rectangle",
      x: 60,
      y: 60,
      width: 160,
      height: 120,
      seed: 11,
    },
    {
      ...drawingDefaults,
      id: "fixture-ellipse",
      type: "ellipse",
      x: 300,
      y: 80,
      width: 120,
      height: 120,
      seed: 12,
    },
  ],
}

function DrawingControls() {
  const editor = useEditor()
  const { editable } = useEditorState()

  const insertDrawingFixture = useStableCallback(function insertDrawingFixture(
    event: MouseEvent<HTMLButtonElement>,
  ) {
    if (event.defaultPrevented || !editor.isEditable()) return

    editor.update(
      () => {
        if (!editor.isEditable()) return
        const node = $createEditorDrawingNode(drawingFixture)

        if ($isRangeSelection($getSelection())) $insertNodeToNearestRoot(node)
        else $getRoot().append(node)
      },
      { tag: HISTORY_PUSH_TAG },
    )
  })

  const [connect] = useState(
    () =>
      function connect() {
        return registerEditorDrawingRuntime(editor, assetPath)
      },
  )

  return (
    <Stack ref={connect}>
      <EditorToolbar aria-label="Drawing editor tools">
        <EditorDrawingInsertButton />
        <Button disabled={!editable} onClick={insertDrawingFixture}>
          Insert shape fixture
        </Button>
        <EditorHistoryButton
          action="undo"
          aria-label="Undo"
          title="Undo"
          render={<Button variant="ghost" size="icon-sm" />}
        >
          <Undo2Icon aria-hidden="true" size={16} />
        </EditorHistoryButton>
        <EditorHistoryButton
          action="redo"
          aria-label="Redo"
          title="Redo"
          render={<Button variant="ghost" size="icon-sm" />}
        >
          <Redo2Icon aria-hidden="true" size={16} />
        </EditorHistoryButton>
      </EditorToolbar>
    </Stack>
  )
}

export function PublicDrawingExample() {
  const [readOnly, setReadOnly] = useState(false)
  const [assetsReady, setAssetsReady] = useState(false)
  const assetPathId = useId()

  const changeReadOnly = useStableCallback(function changeReadOnly(
    checked: Parameters<
      NonNullable<ComponentProps<typeof Checkbox>["onCheckedChange"]>
    >[0],
  ) {
    setReadOnly(checked === true)
  })

  const changeAssetsReady = useStableCallback(function changeAssetsReady(
    checked: Parameters<
      NonNullable<ComponentProps<typeof Checkbox>["onCheckedChange"]>
    >[0],
  ) {
    setAssetsReady(checked === true)
  })

  return (
    <Box render={<section />} data-testid="public-drawing">
      <Stack>
        <Text>
          Draw with Excalidraw. Scenes keep bounded native shapes and text only.
          Insert the rectangle and ellipse fixture, then edit and reopen it.
          Saved drawings can also open in read-only view mode. Files and
          embedded URLs are rejected.
        </Text>
        <Text>
          Load the Excalidraw stylesheet before this module. Serve its fonts at
          the same-origin asset path before mounting the editor. Excalidraw may
          use its fallback font host when a local font is missing.
        </Text>
        <Label>
          <Checkbox
            aria-label="Read-only editor"
            checked={readOnly}
            onCheckedChange={changeReadOnly}
          />
          Read-only editor
        </Label>
        <Label htmlFor={assetPathId}>Excalidraw asset URL</Label>
        <Input id={assetPathId} readOnly value={assetPath} />
        <Label>
          <Checkbox
            aria-label="Drawing assets are installed"
            checked={assetsReady}
            onCheckedChange={changeAssetsReady}
          />
          Drawing assets are installed
        </Label>
        <EditorRoot
          ariaLabel="Public drawing editor"
          editable={!readOnly}
          extensions={extensions}
        >
          <EditorContent placeholder="Write, then insert a drawing…" />
          {assetsReady ? (
            <DrawingControls />
          ) : (
            <Text>
              Install the local SDK assets before connecting drawing controls.
            </Text>
          )}
        </EditorRoot>
      </Stack>
    </Box>
  )
}
