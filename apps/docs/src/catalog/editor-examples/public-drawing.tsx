"use client"

import "@excalidraw/excalidraw/index.css"
import { Box } from "@registry/components/ui/box"
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
} from "@yopem-ui/editor"
import { EditorDrawingExtension } from "@yopem-ui/editor/drawing"
import {
  EditorDrawingInsertButton,
  registerEditorDrawingRuntime,
} from "@yopem-ui/editor/drawing/browser"
import { useId, useState } from "react"

const extensions = [EditorDrawingExtension]

const assetPath = "/assets/excalidraw/"

function DrawingControls() {
  const editor = useEditor()

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
        <EditorHistoryButton action="undo" />
        <EditorHistoryButton action="redo" />
      </EditorToolbar>
    </Stack>
  )
}

export function PublicDrawingExample() {
  const [readOnly, setReadOnly] = useState(false)
  const [assetsReady, setAssetsReady] = useState(false)
  const assetPathId = useId()

  return (
    <Box render={<section />} data-testid="public-drawing">
      <Stack>
        <Text>
          Draw with Excalidraw. Scenes keep bounded native shapes and text only.
          Files and embedded URLs are rejected.
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
            onCheckedChange={(checked) => setReadOnly(checked === true)}
          />
          Read-only editor
        </Label>
        <Label htmlFor={assetPathId}>Excalidraw asset URL</Label>
        <Input id={assetPathId} readOnly value={assetPath} />
        <Label>
          <Checkbox
            aria-label="Drawing assets are installed"
            checked={assetsReady}
            onCheckedChange={(checked) => setAssetsReady(checked === true)}
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
