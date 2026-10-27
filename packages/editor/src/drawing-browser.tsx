"use client"

import type { EditorState, LexicalEditor } from "lexical"
import type { ComponentProps } from "react"

import { useStableCallback } from "@base-ui/utils/useStableCallback"
import {
  Excalidraw,
  exportToBlob,
  exportToSvg,
  loadFromBlob,
  serializeAsJSON,
} from "@excalidraw/excalidraw"
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
  assertEditorDrawingExportActive,
  assertEditorDrawingExportPNG,
  createEditorDrawingExportDeferred,
  beginEditorDrawingExport,
  editorDrawingExportLimits,
  observeEditorDrawingSdkControlNames,
  removeEmptyEditorDrawingSvgMetadata,
  validateEditorDrawingExportDimensions,
  validateEditorDrawingJSON,
  waitForEditorDrawingExport,
} from "./drawing-export-model"
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
import { normalizeEditorDrawingSdkElements } from "./drawing-sdk"
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
  previewFrame: {
    backgroundColor: tokens["--muted"],
    borderColor: tokens["--border"],
    borderRadius: tokens["--radius-md"],
    borderStyle: "solid",
    borderWidth: 1,
    blockSize: "12rem",
    display: "grid",
    inlineSize: "min(100%, 28rem)",
    overflow: "hidden",
    placeItems: "center",
  },
  previewImage: {
    blockSize: "100%",
    display: "block",
    inlineSize: "100%",
    objectFit: "contain",
  },
  previewStatus: { color: tokens["--muted-foreground"] },
  error: { color: tokens["--destructive-foreground"] },
})

type ExcalidrawChangeHandler = NonNullable<
  ComponentProps<typeof Excalidraw>["onChange"]
>

type ExcalidrawLinkOpenHandler = NonNullable<
  ComponentProps<typeof Excalidraw>["onLinkOpen"]
>

type ExcalidrawApi =
  NonNullable<ComponentProps<typeof Excalidraw>["excalidrawAPI"]> extends (
    api: infer Api,
  ) => void
    ? NonNullable<Api>
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

const drawingUIOptions: NonNullable<
  ComponentProps<typeof Excalidraw>["UIOptions"]
> = {
  canvasActions: {
    loadScene: false,
    export: false,
    saveToActiveFile: false,
    saveAsImage: false,
  },
  tools: { image: false },
}

function rejectDrawingContent() {
  return false
}

export function registerEditorDrawingRuntime(
  editor: LexicalEditor,
  assetPath: string,
) {
  if (!/^\/(?:[A-Za-z0-9_-]+\/)*$/.test(assetPath))
    throw new Error("Use a trusted same-origin Excalidraw asset path")

  if (assetPathLease && assetPathLease.path !== assetPath)
    throw new Error("Excalidraw asset path is already in use")

  const runtime = { active: true }

  const unregisterRenderer = registerEditorDrawingRenderer(
    editor,
    (node, currentEditor) => (
      <EditorDrawingView
        editor={currentEditor}
        nodeKey={node.getKey()}
        runtime={runtime}
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

  return function unregister() {
    if (!runtime.active) return

    runtime.active = false
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

    parseEditorDrawingScene({
      elements: normalizeEditorDrawingSdkElements(restored.elements),
    })

    return restored
  })
}

function captureEditorDrawingExport(api: ExcalidrawApi) {
  const elements = api.getSceneElements()

  const scene = parseEditorDrawingScene({
    elements: normalizeEditorDrawingSdkElements(elements),
  })

  const files = api.getFiles()

  if (Reflect.ownKeys(files).length > 0)
    throw new Error("Drawing export does not accept scene files")

  return {
    elements,
    scene,
    serializedScene: JSON.stringify(scene),
    appState: api.getAppState(),
  }
}

function createDrawingExportAppState(
  appState: ReturnType<ExcalidrawApi["getAppState"]>,
) {
  return {
    exportBackground: appState.exportBackground,
    exportEmbedScene: false,
    exportScale: 1,
    exportWithDarkMode: appState.exportWithDarkMode,
    viewBackgroundColor: appState.viewBackgroundColor,
  }
}

function downloadDrawingBlob(
  ownerDocument: Document,
  ownerWindow: Window & typeof globalThis,
  blob: Blob,
  filename: string,
) {
  const link = ownerDocument.createElement("a")
  const url = ownerWindow.URL.createObjectURL(blob)

  try {
    if (!ownerDocument.body) throw new Error("Drawing document is unavailable")

    link.href = url
    link.download = filename
    ownerDocument.body.append(link)
    link.click()
  } finally {
    link.remove()
    ownerWindow.setTimeout(() => ownerWindow.URL.revokeObjectURL(url), 0)
  }
}

async function createSafeDrawingSvg(
  input: Parameters<typeof exportToSvg>[0],
  ownerWindow: Window & typeof globalThis,
) {
  if (input.files && Object.keys(input.files).length > 0)
    throw new Error("SVG export does not accept scene files")

  const svg = await exportToSvg({
    elements: input.elements,
    appState: { ...input.appState, exportEmbedScene: false },
    files: {},
    exportPadding: 10,
    renderEmbeddables: false,
    skipInliningFonts: true,
  })

  removeEmptyEditorDrawingSvgMetadata(svg)

  const svgElements = [svg, ...Array.from(svg.querySelectorAll("*"))]

  if (
    svgElements.some((element) =>
      ["a", "image", "foreignObject"].includes(element.localName),
    ) ||
    svgElements.some((element) =>
      ["href", "xlink:href"].some((name) => element.hasAttribute(name)),
    )
  )
    throw new Error("SVG contains unsupported external content")

  const source = new ownerWindow.XMLSerializer().serializeToString(svg)

  if (
    new TextEncoder().encode(source).byteLength >
    editorDrawingExportLimits.maxOutputBytes
  )
    throw new Error("Drawing SVG exceeds the export size limit")

  return sanitizeEditorDiagramSvg(source)
}

function EditorDrawingScenePreview({
  editor,
  nodeKey,
  runtime,
  scene,
}: {
  editor: LexicalEditor
  nodeKey: NodeKey
  runtime: { active: boolean }
  scene: EditorDrawingScene
}) {
  const serializedScene = JSON.stringify(scene)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [status, setStatus] = useState("Generating drawing preview.")
  const generation = useRef(0)

  const ownedUrl = useRef<{
    revoke: (url: string) => void
    url: string
  } | null>(null)

  function revokePreviewUrl() {
    const owned = ownedUrl.current

    if (!owned) return

    owned.revoke(owned.url)
    ownedUrl.current = null
  }

  const failPreview = useStableCallback(function failPreview() {
    revokePreviewUrl()
    setPreviewUrl(null)
    setStatus("Drawing preview unavailable.")
  })

  const [previewRef] = useState(
    () =>
      function attachPreview(element: HTMLElement | null) {
        if (!element) {
          generation.current += 1
          revokePreviewUrl()

          return
        }

        const sequence = ++generation.current
        const ownerWindow = element.ownerDocument.defaultView
        revokePreviewUrl()
        setPreviewUrl(null)
        setStatus("Generating drawing preview.")

        if (!ownerWindow || scene.elements.length === 0) {
          setStatus("Drawing preview unavailable.")

          return
        }

        void Promise.resolve()
          .then(() => loadDrawingData(scene))
          .then((restored) =>
            createSafeDrawingSvg(
              {
                elements: restored.elements,
                appState: restored.appState,
                files: restored.files,
              },
              ownerWindow,
            ),
          )
          .then((safeSvg) => {
            if (
              !runtime.active ||
              sequence !== generation.current ||
              !element.isConnected
            )
              return

            const isCurrent = editor.getEditorState().read(() => {
              const node = $getNodeByKey(nodeKey)

              return (
                $isEditorDrawingNode(node) &&
                node.isAttached() &&
                JSON.stringify(node.getScene()) === serializedScene
              )
            })

            if (!isCurrent) {
              setStatus("Drawing preview unavailable.")

              return
            }

            const url = ownerWindow.URL.createObjectURL(
              new ownerWindow.Blob([safeSvg], {
                type: "image/svg+xml;charset=utf-8",
              }),
            )

            ownedUrl.current = {
              revoke: (ownedUrl) => ownerWindow.URL.revokeObjectURL(ownedUrl),
              url,
            }
            setPreviewUrl(url)
            setStatus("")
          })
          .catch(() => {
            if (
              runtime.active &&
              sequence === generation.current &&
              element.isConnected
            )
              setStatus("Drawing preview unavailable.")
          })
      },
  )

  return (
    <Box ref={previewRef} xstyle={styles.previewFrame}>
      {previewUrl ? (
        <img
          {...stylex.props(styles.previewImage)}
          alt={`Preview of drawing with ${scene.elements.length} elements`}
          data-testid="editor-drawing-scene-preview"
          onError={failPreview}
          src={previewUrl}
        />
      ) : null}
      {status ? (
        <Box
          render={<output />}
          data-testid="editor-drawing-preview-status"
          xstyle={styles.previewStatus}
        >
          {status}
        </Box>
      ) : null}
    </Box>
  )
}

export function EditorDrawingInsertButton() {
  const editor = useEditor()
  const { editable } = useEditorState()

  const insertDrawing = useStableCallback(function insertDrawing() {
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
  })

  return (
    <Button disabled={!editable} onClick={insertDrawing}>
      Insert drawing
    </Button>
  )
}

function EditorDrawingView({
  editor,
  nodeKey,
  runtime,
  scene,
}: {
  editor: LexicalEditor
  nodeKey: NodeKey
  runtime: { active: boolean }
  scene: EditorDrawingScene
}) {
  const { editable } = useEditorState()
  const [open, setOpen] = useState(false)
  const draft = useRef(scene)
  const [api, setApi] = useState<ExcalidrawApi | null>(null)
  const apiRef = useRef<ExcalidrawApi | null>(null)
  const [exportBusy, setExportBusy] = useState(false)
  const exportBusyRef = useRef(false)
  const exportController = useRef<AbortController | null>(null)
  const viewElement = useRef<HTMLElement | null>(null)

  const [initialData, setInitialData] = useState<Promise<Awaited<
    ReturnType<typeof loadFromBlob>
  > | null> | null>(null)

  const [error, setError] = useState("")
  const [exportStatus, setExportStatus] = useState("")

  const origin = useRef("")
  const originState = useRef<EditorState | null>(null)
  const loadSequence = useRef(0)

  const [handleApi] = useState(() => (nextApi: ExcalidrawApi | null) => {
    apiRef.current = nextApi
    setApi(nextApi)
  })

  const [viewRef] = useState(() => (element: HTMLElement | null) => {
    viewElement.current = element

    if (!element) {
      loadSequence.current += 1
      exportController.current?.abort()
    }
  })

  const [stageRef] = useState(() => {
    let cleanup: (() => void) | null = null

    return function attachStage(element: HTMLElement | null) {
      cleanup?.()
      cleanup = element ? observeEditorDrawingSdkControlNames(element) : null
    }
  })

  const openEditor = useStableCallback(function openEditor() {
    const serializedScene = JSON.stringify(scene)

    const current = editor.getEditorState().read(() => {
      const node = $getNodeByKey(nodeKey)

      return (
        $isEditorDrawingNode(node) &&
        node.isAttached() &&
        JSON.stringify(node.getScene()) === serializedScene
      )
    })

    if (!current) {
      setError("Drawing changed. Close and reopen its controls.")

      return
    }

    const sequence = ++loadSequence.current
    origin.current = serializedScene
    originState.current = editor.getEditorState()
    draft.current = scene
    setError("")
    setExportStatus("")
    apiRef.current = null
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
  })

  const handleDialogOpenChange = useStableCallback(
    function handleDialogOpenChange(
      nextOpen: boolean,
      details: Parameters<
        NonNullable<ComponentProps<typeof Dialog>["onOpenChange"]>
      >[1],
    ) {
      const ownerWindow = editor.getRootElement()?.ownerDocument.defaultView

      if (
        !nextOpen &&
        details.reason === "escape-key" &&
        ownerWindow &&
        details.event.target instanceof ownerWindow.HTMLTextAreaElement &&
        details.event.target.classList.contains("excalidraw-wysiwyg")
      ) {
        details.cancel()

        return
      }

      changeOpen(nextOpen)
    },
  )

  function changeOpen(nextOpen: boolean) {
    if (!nextOpen) {
      loadSequence.current += 1
      exportController.current?.abort()
      exportController.current = null
      setInitialData(null)
      apiRef.current = null
      setApi(null)
    }

    setOpen(nextOpen)
  }

  const apply = useStableCallback(function apply() {
    if (exportBusyRef.current) return

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
  })

  async function runDrawingExport(
    kind: "svg" | "json" | "png" | "copy-png",
    event: Parameters<NonNullable<ComponentProps<typeof Button>["onClick"]>>[0],
  ) {
    if (event.defaultPrevented || !api || exportBusyRef.current) return

    const ownerDocument = editor.getRootElement()?.ownerDocument
    const ownerWindow = ownerDocument?.defaultView

    if (!ownerDocument || !ownerWindow) {
      setError("Drawing export needs a mounted browser document.")

      return
    }

    const isClipboard = kind === "copy-png"
    let clipboard: Clipboard | null = null
    let ClipboardItemConstructor: typeof ClipboardItem | null = null

    try {
      if (isClipboard) {
        clipboard = ownerWindow.navigator.clipboard
        ClipboardItemConstructor = ownerWindow.ClipboardItem
        const supportsPNG = ClipboardItemConstructor?.supports?.("image/png")

        if (
          !clipboard?.write ||
          !ClipboardItemConstructor ||
          supportsPNG === false
        )
          throw new Error(
            "PNG clipboard copy is not supported by this browser.",
          )
      }

      const controller = new ownerWindow.AbortController()

      const operation = beginEditorDrawingExport({
        signal: controller.signal,
        deadlineAt: Date.now() + editorDrawingExportLimits.maxDurationMs,
      })

      exportController.current = controller
      exportBusyRef.current = true
      setExportBusy(true)
      setError("")
      setExportStatus("")

      try {
        const currentApi = apiRef.current

        if (!currentApi) throw new Error("Drawing editor is unavailable.")

        const expectedApi = currentApi
        const expectedApiScene = captureEditorDrawingExport(expectedApi)
        const expectedSavedScene = origin.current
        const expectedEditorState = originState.current
        const expectedSequence = loadSequence.current

        function assertCurrent() {
          assertEditorDrawingExportActive(operation)

          if (
            !runtime.active ||
            !viewElement.current?.isConnected ||
            !open ||
            expectedEditorState === null ||
            editor.getEditorState() !== expectedEditorState ||
            apiRef.current !== expectedApi ||
            exportController.current !== controller ||
            origin.current !== expectedSavedScene ||
            loadSequence.current !== expectedSequence
          )
            throw new Error("Drawing changed during export.")

          const savedSceneIsCurrent = editor.getEditorState().read(() => {
            const node = $getNodeByKey(nodeKey)

            return (
              $isEditorDrawingNode(node) &&
              node.isAttached() &&
              JSON.stringify(node.getScene()) === expectedSavedScene
            )
          })

          if (!savedSceneIsCurrent)
            throw new Error("Drawing changed during export.")

          if (
            captureEditorDrawingExport(expectedApi).serializedScene !==
            expectedApiScene.serializedScene
          )
            throw new Error("Drawing changed during export.")
        }

        assertCurrent()

        if (kind === "json") {
          const source = serializeAsJSON(
            expectedApiScene.elements,
            {
              name: expectedApiScene.appState.name,
              viewBackgroundColor:
                expectedApiScene.appState.viewBackgroundColor,
            },
            {},
            "local",
          )

          validateEditorDrawingJSON(source)
          assertCurrent()
          downloadDrawingBlob(
            ownerDocument,
            ownerWindow,
            new ownerWindow.Blob([source], {
              type: "application/json;charset=utf-8",
            }),
            "drawing.excalidraw",
          )

          return
        }

        if (kind === "svg") {
          const svgWork = operation.track(
            createSafeDrawingSvg(
              {
                elements: expectedApiScene.elements,
                appState: createDrawingExportAppState(
                  expectedApiScene.appState,
                ),
                files: {},
              },
              ownerWindow,
            ),
          )

          const safeSvg = await waitForEditorDrawingExport(svgWork, operation)

          assertCurrent()
          downloadDrawingBlob(
            ownerDocument,
            ownerWindow,
            new ownerWindow.Blob([safeSvg], {
              type: "image/svg+xml;charset=utf-8",
            }),
            "drawing.svg",
          )

          return
        }

        let clipboardBlob: ReturnType<
          typeof createEditorDrawingExportDeferred<Blob>
        > | null = null

        let writeWork: Promise<void> | null = null

        if (isClipboard) {
          if (!clipboard || !ClipboardItemConstructor)
            throw new Error("PNG clipboard copy is not supported.")

          clipboardBlob = createEditorDrawingExportDeferred<Blob>()
          void clipboardBlob.promise.catch(() => undefined)

          const item = new ClipboardItemConstructor({
            "image/png": clipboardBlob.promise,
          })

          writeWork = operation.track(clipboard.write([item]))
        }

        let dimensions: { width: number; height: number } | null = null

        const pngWork = operation.track<Blob>(
          exportToBlob({
            elements: expectedApiScene.elements,
            appState: createDrawingExportAppState(expectedApiScene.appState),
            files: {},
            exportPadding: 10,
            getDimensions(width: number, height: number) {
              assertCurrent()

              const result = validateEditorDrawingExportDimensions(
                width,
                height,
              )

              dimensions = { width: result.width, height: result.height }

              return result
            },
            mimeType: "image/png",
          }).then(async (blob: Blob) => {
            assertCurrent()

            if (!dimensions)
              throw new Error("PNG export did not report safe dimensions.")

            const safeBlob = await assertEditorDrawingExportPNG(
              blob,
              operation,
              dimensions,
            )

            assertCurrent()

            return safeBlob
          }),
        )

        if (isClipboard) {
          if (!clipboardBlob || !writeWork)
            throw new Error("PNG clipboard copy is not supported.")

          const currentWriteWork = writeWork

          void pngWork.then(clipboardBlob.resolve, () =>
            clipboardBlob.reject(new Error("PNG export failed.")),
          )

          const copied = await waitForEditorDrawingExport<Blob>(
            Promise.all([pngWork, currentWriteWork]).then(([blob]) => blob),
            operation,
          )

          assertCurrent()

          setExportStatus(`Copied PNG (${copied.size} bytes).`)

          return
        }

        const png = await waitForEditorDrawingExport(pngWork, operation)

        assertCurrent()
        downloadDrawingBlob(ownerDocument, ownerWindow, png, "drawing.png")
      } catch {
        if (
          !controller.signal.aborted &&
          viewElement.current?.isConnected &&
          runtime.active
        ) {
          const alternative = isClipboard
            ? "Use Download drawing PNG instead."
            : "Existing drawing is unchanged."

          setError(
            `${isClipboard ? "PNG clipboard copy" : `Drawing ${kind}`} failed. ${alternative}`,
          )
        }

        controller.abort()
      } finally {
        operation.finish()
        await operation.whenIdle

        if (exportController.current === controller)
          exportController.current = null

        exportBusyRef.current = false

        if (viewElement.current?.isConnected) setExportBusy(false)
      }
    } catch (cause) {
      if (
        viewElement.current?.isConnected &&
        runtime.active &&
        !(cause instanceof Error && cause.name === "AbortError")
      ) {
        const alternative = isClipboard
          ? "Use Download drawing PNG instead."
          : "Existing drawing is unchanged."

        setError(
          `${isClipboard ? "PNG clipboard copy" : `Drawing ${kind}`} failed. ${alternative}`,
        )
      }
    }
  }

  const handleLinkOpen = useStableCallback(function handleLinkOpen(
    _element: Parameters<ExcalidrawLinkOpenHandler>[0],
    event: Parameters<ExcalidrawLinkOpenHandler>[1],
  ) {
    event.preventDefault()
  })

  const handleChange = useStableCallback(function handleChange(
    elements: Parameters<ExcalidrawChangeHandler>[0],
    _appState: Parameters<ExcalidrawChangeHandler>[1],
    files: Parameters<ExcalidrawChangeHandler>[2],
  ) {
    try {
      if (Object.keys(files).length > 0)
        throw new Error("External drawing files are not supported")

      const accepted = parseEditorDrawingScene({
        elements: normalizeEditorDrawingSdkElements(elements),
      })

      draft.current = accepted
      setError("")
    } catch {
      setError("Files, embedded URLs, and unsupported elements are rejected.")
    }
  })

  const exportSvg = useStableCallback(function exportSvg(
    event: Parameters<typeof runDrawingExport>[1],
  ) {
    void runDrawingExport("svg", event)
  })

  const exportJson = useStableCallback(function exportJson(
    event: Parameters<typeof runDrawingExport>[1],
  ) {
    void runDrawingExport("json", event)
  })

  const exportPng = useStableCallback(function exportPng(
    event: Parameters<typeof runDrawingExport>[1],
  ) {
    void runDrawingExport("png", event)
  })

  const copyPng = useStableCallback(function copyPng(
    event: Parameters<typeof runDrawingExport>[1],
  ) {
    void runDrawingExport("copy-png", event)
  })

  const cancelDrawing = useStableCallback(function cancelDrawing() {
    draft.current = scene
    setError("")
    setExportStatus("")
    changeOpen(false)
  })

  return (
    <Box
      ref={viewRef}
      render={<figure />}
      contentEditable={false}
      data-testid="editor-drawing-preview"
    >
      <Stack>
        <EditorDrawingScenePreview
          key={JSON.stringify(scene)}
          editor={editor}
          nodeKey={nodeKey}
          runtime={runtime}
          scene={scene}
        />
        <Text>{`Drawing with ${scene.elements.length} elements`}</Text>
        <Stack xstyle={styles.toolbar}>
          <Button onClick={openEditor}>
            {editable ? "Edit drawing" : "View drawing"}
          </Button>
        </Stack>
        {!open && error ? (
          <Text role="alert" xstyle={styles.error}>
            {error}
          </Text>
        ) : null}
        <Dialog open={open} onOpenChange={handleDialogOpenChange}>
          <DialogPopup
            aria-label={editable ? "Edit drawing" : "View drawing"}
            showCloseButton={false}
            bottomStickOnMobile={false}
            portalProps={{
              container: editor.getRootElement()?.ownerDocument.body,
            }}
            xstyle={styles.dialog}
          >
            <DialogHeader>
              <DialogTitle>
                {editable ? "Edit drawing" : "View drawing"}
              </DialogTitle>
              <DialogDescription>
                Unsupported files and embedded URLs are rejected. Apply saves
                one editor history step.
              </DialogDescription>
            </DialogHeader>
            <DialogPanel xstyle={styles.panel}>
              {error ? (
                <Text role="alert" xstyle={styles.error}>
                  {error}
                </Text>
              ) : null}
              <Box ref={stageRef} xstyle={styles.stage}>
                {initialData ? (
                  <Excalidraw
                    excalidrawAPI={handleApi}
                    initialData={initialData}
                    viewModeEnabled={!editable}
                    validateEmbeddable={rejectDrawingContent}
                    onPaste={rejectDrawingContent}
                    onLinkOpen={handleLinkOpen}
                    UIOptions={drawingUIOptions}
                    onChange={handleChange}
                  />
                ) : null}
              </Box>
            </DialogPanel>
            <DialogFooter>
              {exportStatus ? (
                <Box render={<output />} xstyle={styles.previewStatus}>
                  {exportStatus}
                </Box>
              ) : null}
              <Stack xstyle={styles.toolbar}>
                <Button disabled={!api || exportBusy} onClick={exportSvg}>
                  Export drawing SVG
                </Button>
                <Button disabled={!api || exportBusy} onClick={exportJson}>
                  Export drawing JSON
                </Button>
                <Button disabled={!api || exportBusy} onClick={exportPng}>
                  Export drawing PNG
                </Button>
                <Button disabled={!api || exportBusy} onClick={copyPng}>
                  Copy drawing PNG
                </Button>
                <Button onClick={cancelDrawing}>Cancel drawing</Button>
                <Button
                  disabled={!editable || error !== "" || exportBusy}
                  onClick={apply}
                >
                  Apply drawing
                </Button>
              </Stack>
            </DialogFooter>
          </DialogPopup>
        </Dialog>
      </Stack>
    </Box>
  )
}
