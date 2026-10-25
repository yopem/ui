"use client"

import type { EditorState, LexicalEditor } from "lexical"
import type { ComponentProps } from "react"

import { Excalidraw, exportToSvg, loadFromBlob } from "@excalidraw/excalidraw"
import { $insertNodeToNearestRoot } from "@lexical/utils"
import { Box } from "@registry/components/ui/box"
import { Button } from "@registry/components/ui/button"
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from "@registry/components/ui/dialog"
import { Stack } from "@registry/components/ui/stack"
import { Text } from "@registry/components/ui/text"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import {
  $getNodeByKey,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  HISTORY_PUSH_TAG,
  type NodeKey,
} from "lexical"
import { useRef, useState } from "react"

import { sanitizeEditorDiagramSvg } from "./diagram-render"
import {
  EDITOR_DRAWING_MAX_BYTES,
  parseEditorDrawingScene,
  type EditorDrawingScene,
} from "./drawing-model"
import {
  $createEditorDrawingNode,
  $isEditorDrawingNode,
  registerEditorDrawingRenderer,
} from "./drawing-node"
import { useEditor, useEditorState } from "./root"

const styles = stylex.create({
  dialog: { maxInlineSize: "min(96vw, 72rem)", blockSize: "min(90dvh, 56rem)" },
  panel: { minBlockSize: 0, blockSize: "100%", padding: 0 },
  toolbar: { flexDirection: "row", flexWrap: "wrap", alignItems: "center" },
  stage: {
    borderColor: tokens["--border"],
    borderRadius: tokens["--radius-md"],
    borderStyle: "solid",
    borderWidth: 1,
    blockSize: "min(70dvh, 42rem)",
    minBlockSize: "24rem",
    minInlineSize: 0,
    overflow: "hidden",
    position: "relative",
  },
  error: { color: tokens["--destructive-foreground"] },
})

type ExcalidrawApi =
  NonNullable<ComponentProps<typeof Excalidraw>["excalidrawAPI"]> extends (
    api: infer Api,
  ) => void
    ? Api
    : never

declare global {
  interface Window {
    EXCALIDRAW_ASSET_PATH?: string | string[]
  }
}

interface AssetPathLease {
  path: string
  previous: string | string[] | undefined
  owners: number
}

let assetPathLease: AssetPathLease | null = null

export function registerEditorDrawingRuntime(
  editor: LexicalEditor,
  assetPath: string,
) {
  if (!/^\/(?:[A-Za-z0-9_-]+\/)*$/.test(assetPath))
    throw new Error("Use a trusted same-origin Excalidraw asset path")

  if (assetPathLease && assetPathLease.path !== assetPath)
    throw new Error("Excalidraw asset path is already in use")

  const unregisterRenderer = registerEditorDrawingRenderer(
    editor,
    (node, currentEditor) => (
      <EditorDrawingView
        editor={currentEditor}
        nodeKey={node.getKey()}
        scene={node.getScene()}
      />
    ),
  )

  if (assetPathLease) assetPathLease.owners += 1
  else {
    assetPathLease = {
      path: assetPath,
      previous: window.EXCALIDRAW_ASSET_PATH,
      owners: 1,
    }
    window.EXCALIDRAW_ASSET_PATH = assetPath
  }

  let registered = true

  return function unregister() {
    if (!registered) return

    registered = false
    unregisterRenderer()

    if (!assetPathLease || assetPathLease.path !== assetPath) return

    assetPathLease.owners -= 1

    if (assetPathLease.owners === 0) {
      if (window.EXCALIDRAW_ASSET_PATH === assetPath)
        window.EXCALIDRAW_ASSET_PATH = assetPathLease.previous
      assetPathLease = null
    }
  }
}

function loadDrawingData(scene: EditorDrawingScene) {
  const parsed = parseEditorDrawingScene(scene)

  const source = JSON.stringify({
    type: "excalidraw",
    version: 2,
    source: "yopem-ui",
    elements: parsed.elements,
    appState: null,
    files: {},
  })

  if (
    !source ||
    new TextEncoder().encode(source).byteLength > EDITOR_DRAWING_MAX_BYTES
  )
    throw new Error("Editor drawing exceeds the byte limit")

  return loadFromBlob(
    new Blob([source], { type: "application/json" }),
    null,
    null,
  ).then((restored) => {
    if (Object.keys(restored.files).length > 0)
      throw new Error("Editor drawing files are not supported")

    parseEditorDrawingScene({ elements: restored.elements })

    return restored
  })
}

export function EditorDrawingInsertButton() {
  const editor = useEditor()
  const { editable } = useEditorState()

  function insertDrawing() {
    if (!editor.isEditable()) return

    editor.update(
      () => {
        const node = $createEditorDrawingNode({ elements: [] })
        const selection = $getSelection()

        if ($isRangeSelection(selection)) $insertNodeToNearestRoot(node)
        else $getRoot().append(node)
      },
      { tag: HISTORY_PUSH_TAG },
    )
  }

  return (
    <Button disabled={!editable} onClick={insertDrawing}>
      Insert drawing
    </Button>
  )
}

function EditorDrawingView({
  editor,
  nodeKey,
  scene,
}: {
  editor: LexicalEditor
  nodeKey: NodeKey
  scene: EditorDrawingScene
}) {
  const { editable } = useEditorState()
  const [open, setOpen] = useState(false)
  const draft = useRef(scene)
  const [api, setApi] = useState<ExcalidrawApi | null>(null)

  const [initialData, setInitialData] = useState<Promise<Awaited<
    ReturnType<typeof loadFromBlob>
  > | null> | null>(null)

  const [error, setError] = useState("")

  const origin = useRef("")
  const originState = useRef<EditorState | null>(null)
  const loadSequence = useRef(0)

  const [viewRef] = useState(() => (element: HTMLElement | null) => {
    if (!element) loadSequence.current += 1
  })

  function openEditor() {
    if (!editor.isEditable()) return

    const sequence = ++loadSequence.current
    const serializedScene = JSON.stringify(scene)
    origin.current = serializedScene
    originState.current = editor.getEditorState()
    draft.current = scene
    setError("")
    setApi(null)
    setInitialData(
      Promise.resolve()
        .then(() => loadDrawingData(scene))
        .then((restored) =>
          sequence === loadSequence.current ? restored : null,
        )
        .catch(() => {
          if (sequence === loadSequence.current)
            setError(
              "Drawing could not be restored. Existing content is unchanged.",
            )

          return null
        }),
    )
    setOpen(true)
  }

  function changeOpen(nextOpen: boolean) {
    if (!nextOpen) {
      loadSequence.current += 1
      setInitialData(null)
      setApi(null)
    }

    setOpen(nextOpen)
  }

  function apply() {
    let changed = false

    try {
      const accepted = parseEditorDrawingScene(draft.current)

      if (
        originState.current === null ||
        editor.getEditorState() !== originState.current
      ) {
        setError(
          "Editor changed before apply. Close and reopen the drawing to continue.",
        )

        return
      }

      editor.update(
        () => {
          const node = $getNodeByKey(nodeKey)

          if (
            !editor.isEditable() ||
            $getRoot().isDirty() ||
            !$isEditorDrawingNode(node) ||
            !node.isAttached() ||
            JSON.stringify(node.getScene()) !== origin.current
          )
            return

          node.setScene(accepted)
          changed = true
        },
        { discrete: true, tag: HISTORY_PUSH_TAG },
      )

      if (!changed) {
        setError(
          "Drawing changed before apply. Close and reopen it to continue.",
        )

        return
      }

      changeOpen(false)
      setError("")
    } catch {
      setError(
        "Drawing is invalid or exceeds supported limits. Existing content is unchanged.",
      )
    }
  }

  async function exportSvg() {
    if (!api) return

    const exportSequence = loadSequence.current
    const currentElements = api.getSceneElements()
    const expectedEditorScene = origin.current

    try {
      const expectedScene = JSON.stringify(
        parseEditorDrawingScene({ elements: currentElements }),
      )

      if (Object.keys(api.getFiles()).length > 0)
        throw new Error("SVG export does not accept scene files")

      const svg = await exportToSvg({
        elements: currentElements,
        appState: { ...api.getAppState(), exportEmbedScene: false },
        files: {},
        exportPadding: 10,
        renderEmbeddables: false,
        skipInliningFonts: true,
      })

      const root = svg

      const svgElements = [root, ...Array.from(root.querySelectorAll("*"))]

      if (
        svgElements.some((element) =>
          ["a", "image", "foreignObject"].includes(element.localName),
        ) ||
        svgElements.some((element) =>
          ["href", "xlink:href"].some((name) => element.hasAttribute(name)),
        )
      )
        throw new Error("SVG contains unsupported external content")

      const safeSvg = sanitizeEditorDiagramSvg(
        new XMLSerializer().serializeToString(svg),
      )

      let isCurrent = false

      editor.update(
        () => {
          const node = $getNodeByKey(nodeKey)

          isCurrent =
            !$getRoot().isDirty() &&
            editor.getEditorState() === originState.current &&
            $isEditorDrawingNode(node) &&
            node.isAttached() &&
            JSON.stringify(node.getScene()) === expectedEditorScene
        },
        { discrete: true },
      )

      if (
        !isCurrent ||
        loadSequence.current !== exportSequence ||
        JSON.stringify(
          parseEditorDrawingScene({ elements: api.getSceneElements() }),
        ) !== expectedScene ||
        Object.keys(api.getFiles()).length > 0
      )
        throw new Error("Drawing changed during SVG export")

      const ownerDocument = editor.getRootElement()?.ownerDocument

      const ownerWindow = ownerDocument?.defaultView

      if (!ownerDocument || !ownerWindow)
        throw new Error("Drawing document is unavailable")

      const url = ownerWindow.URL.createObjectURL(
        new Blob([safeSvg], { type: "image/svg+xml" }),
      )

      const link = ownerDocument.createElement("a")
      link.href = url
      link.download = "drawing.svg"
      link.click()
      ownerWindow.setTimeout(() => ownerWindow.URL.revokeObjectURL(url), 0)
      setError("")
    } catch {
      setError("SVG export failed. Existing drawing is unchanged.")
    }
  }

  return (
    <Box
      ref={viewRef}
      render={<figure />}
      contentEditable={false}
      data-testid="editor-drawing-preview"
    >
      <Stack>
        <Text>{`Drawing with ${scene.elements.length} elements`}</Text>
        <Stack xstyle={styles.toolbar}>
          <Button disabled={!editable} onClick={openEditor}>
            Edit drawing
          </Button>
        </Stack>
        {error ? (
          <Text role="alert" xstyle={styles.error}>
            {error}
          </Text>
        ) : null}
        <Dialog open={open} onOpenChange={changeOpen}>
          <DialogPopup
            aria-label="Edit drawing"
            showCloseButton={false}
            bottomStickOnMobile={false}
            portalProps={{
              container: editor.getRootElement()?.ownerDocument.body,
            }}
            xstyle={styles.dialog}
          >
            <DialogHeader>
              <DialogTitle>Edit drawing</DialogTitle>
              <DialogDescription>
                Unsupported files and embedded URLs are rejected. Apply saves
                one editor history step.
              </DialogDescription>
            </DialogHeader>
            <DialogPanel xstyle={styles.panel}>
              <Box xstyle={styles.stage}>
                {initialData ? (
                  <Excalidraw
                    excalidrawAPI={setApi}
                    initialData={initialData}
                    viewModeEnabled={!editable}
                    validateEmbeddable={() => false}
                    onPaste={() => false}
                    onLinkOpen={(_element, event) => event.preventDefault()}
                    UIOptions={{
                      canvasActions: {
                        loadScene: false,
                        export: false,
                        saveToActiveFile: false,
                        saveAsImage: false,
                      },
                      tools: { image: false },
                    }}
                    onChange={(elements, _appState, files) => {
                      try {
                        if (Object.keys(files).length > 0)
                          throw new Error(
                            "External drawing files are not supported",
                          )
                        const accepted = parseEditorDrawingScene({ elements })
                        draft.current = accepted
                        setError("")
                      } catch {
                        setError(
                          "Files, embedded URLs, and unsupported elements are rejected.",
                        )
                      }
                    }}
                  />
                ) : null}
              </Box>
            </DialogPanel>
            <DialogFooter>
              <Button onClick={exportSvg} disabled={!api}>
                Export drawing SVG
              </Button>
              <Button
                onClick={() => {
                  draft.current = scene
                  setError("")
                  changeOpen(false)
                }}
              >
                Cancel drawing
              </Button>
              <Button disabled={!editable || error !== ""} onClick={apply}>
                Apply drawing
              </Button>
            </DialogFooter>
          </DialogPopup>
        </Dialog>
      </Stack>
    </Box>
  )
}
