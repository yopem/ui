"use client"

import type { BoxProps } from "@registry/components/ui/box"
import type { WrapProps } from "@registry/components/ui/wrap"
import type { MouseEvent } from "react"

import { useRender } from "@base-ui/react/use-render"
import { useStableCallback } from "@base-ui/utils/useStableCallback"
import { Box } from "@registry/components/ui/box"
import { Button } from "@registry/components/ui/button"
import { Text } from "@registry/components/ui/text"
import { Wrap } from "@registry/components/ui/wrap"
import { useRef, useState } from "react"
import { flushSync } from "react-dom"

import type {
  EditorDocumentExportResourceResolver,
  EditorDocumentImageCapture,
} from "./document-export-image"
import type {
  EditorDocumentExportLease,
  EditorDocumentExportOperation,
} from "./document-export-model"

import { htmlDocument } from "./document"
import {
  createEditorDocumentExportSnapshot,
  waitForEditorDocumentExportImages,
} from "./document-export-image"
import {
  assertEditorDocumentExportActive,
  assertEditorDocumentExportPNG,
  beginEditorDocumentExport,
  EditorDocumentExportError,
  editorDocumentExportLimits,
  validateEditorDocumentExportDimensions,
  waitForEditorDocumentExport,
  waitForEditorDocumentExportWithCleanup,
} from "./document-export-model"
import { useEditor } from "./root"

export { editorDocumentExportLimits }

export type { EditorDocumentExportOperation }

export type { EditorDocumentExportResourceResolver, EditorDocumentImageCapture }

interface ActiveExport {
  readonly controller: AbortController
  readonly lease: EditorDocumentExportLease
  readonly initialState: string
  readonly focusTarget: HTMLElement
  popup: Window | null
  reason: "cancelled" | "stale" | "unmounted" | null
}

interface ExportOptions {
  readonly nonce?: string
  readonly resolveResource?: EditorDocumentExportResourceResolver
}

function exportErrorMessage(
  error: EditorDocumentExportError | null,
  active: ActiveExport | null,
) {
  if (active?.reason === "stale") return "Document changed during export."

  if (active?.reason === "cancelled") return "Document export cancelled."

  if (error) return error.message

  return "Document could not be exported."
}

function finishExportUI(
  active: ActiveExport | null,
  setBusy: (busy: boolean) => void,
) {
  const target = active?.focusTarget
  const ownerDocument = target?.ownerDocument
  const focused = ownerDocument?.activeElement

  const controls = target?.closest(
    '[data-slot="editor-document-print-control"], [data-slot="editor-document-image-export-control"], [data-slot="editor-document-pdf-export-control"]',
  )

  const restoreFocus =
    active?.reason !== "stale" &&
    target?.isConnected === true &&
    (focused === ownerDocument?.body ||
      focused === target ||
      (focused !== null &&
        focused !== undefined &&
        controls?.contains(focused) === true))

  flushSync(() => setBusy(false))

  if (restoreFocus && target.isConnected) target.focus()
}

function useExportRootRef(
  editor: ReturnType<typeof useEditor>,
  activeRef: { current: ActiveExport | null },
  mountedRef: { current: boolean },
) {
  return useState(
    () =>
      function rootRef(element: HTMLDivElement | null) {
        if (!element) return
        mountedRef.current = true

        const unregister = editor.registerUpdateListener(({ editorState }) => {
          const active = activeRef.current

          if (
            active &&
            JSON.stringify(editorState.toJSON()) !== active.initialState
          ) {
            active.reason = "stale"
            active.controller.abort()
            active.popup?.close()
          }
        })

        return () => {
          mountedRef.current = false
          unregister()
          const active = activeRef.current

          if (active) {
            active.reason = "unmounted"
            active.controller.abort()
            active.popup?.close()
          }
        }
      },
  )[0]
}

function startExport(
  editor: ReturnType<typeof useEditor>,
  focusTarget: HTMLElement,
  activeRef: { current: ActiveExport | null },
  setBusy: (value: boolean) => void,
  title: string,
) {
  if (activeRef.current)
    throw new EditorDocumentExportError(
      "busy",
      "Another document export is still running.",
    )

  const controller = new AbortController()

  const lease = beginEditorDocumentExport({
    signal: controller.signal,
    deadlineAt: Date.now() + editorDocumentExportLimits.maxDurationMs,
  })

  try {
    const html = htmlDocument(editor, title)
    assertEditorDocumentExportActive(lease)
    const initialState = JSON.stringify(editor.getEditorState().toJSON())
    assertEditorDocumentExportActive(lease)

    const active: ActiveExport = {
      controller,
      lease,
      initialState,
      focusTarget,
      popup: null,
      reason: null,
    }

    activeRef.current = active
    setBusy(true)

    return { active, html }
  } catch (error) {
    lease.finish()
    controller.abort()
    throw error
  }
}

function assertExportCurrent(
  editor: ReturnType<typeof useEditor>,
  active: ActiveExport,
) {
  assertEditorDocumentExportActive(active.lease)
  const currentState = JSON.stringify(editor.getEditorState().toJSON())
  assertEditorDocumentExportActive(active.lease)

  if (currentState !== active.initialState) {
    active.reason = "stale"
    active.controller.abort()
    throw new EditorDocumentExportError(
      "aborted",
      "Document changed during export.",
    )
  }
}

async function waitForPrintCompletion(
  popup: Window,
  ownerView: Window,
  active: ActiveExport,
  setStatus: (value: string) => void,
) {
  await new Promise<void>((resolve, reject) => {
    let settled = false
    const remaining = Math.max(0, active.lease.deadlineAt - Date.now())

    const timer = ownerView.setTimeout(() => {
      finish(
        new EditorDocumentExportError(
          "deadline",
          "Print window reached its time limit.",
        ),
      )
    }, remaining)

    function cleanup() {
      ownerView.clearTimeout(timer)
      popup.removeEventListener("afterprint", onAfterPrint)
      popup.removeEventListener("pagehide", onPageHide)
      active.controller.signal.removeEventListener("abort", onAbort)
    }

    function finish(error?: Error) {
      if (settled) return
      settled = true
      cleanup()

      if (error) reject(error)
      else resolve()
    }

    function onAfterPrint() {
      finish()
    }

    function onPageHide() {
      finish()
    }

    function onAbort() {
      finish(
        new EditorDocumentExportError("aborted", "Document export cancelled."),
      )
    }

    popup.addEventListener("afterprint", onAfterPrint, { once: true })
    popup.addEventListener("pagehide", onPageHide, { once: true })
    active.controller.signal.addEventListener("abort", onAbort, { once: true })

    try {
      assertEditorDocumentExportActive(active.lease)
      popup.focus()
      assertEditorDocumentExportActive(active.lease)
      popup.print()
      assertEditorDocumentExportActive(active.lease)
      setStatus("Print dialog opened.")
    } catch (error) {
      finish(
        error instanceof EditorDocumentExportError
          ? error
          : new EditorDocumentExportError(
              "popup",
              "The browser could not open the print dialog.",
            ),
      )
    }
  })
}

export interface EditorDocumentPrintControlProps extends Omit<
  BoxProps,
  "children"
> {
  nonce?: string
  resolveResource?: EditorDocumentExportResourceResolver
  title?: string
}

export function EditorDocumentPrintControl({
  nonce,
  resolveResource,
  title = "Document",
  ref,
  ...props
}: EditorDocumentPrintControlProps) {
  const editor = useEditor()
  const activeRef = useRef<ActiveExport | null>(null)
  const mountedRef = useRef(false)
  const rootRef = useExportRootRef(editor, activeRef, mountedRef)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [status, setStatus] = useState("")

  function setStatusIfMounted(value: string) {
    if (mountedRef.current) setStatus(value)
  }

  const cancel = useStableCallback(function cancel(
    event: MouseEvent<HTMLElement>,
  ) {
    if (event.defaultPrevented) return
    const active = activeRef.current

    if (!active) return
    active.reason = "cancelled"
    active.controller.abort()
    active.popup?.close()
  })

  async function print(event: MouseEvent<HTMLElement>) {
    if (event.defaultPrevented || activeRef.current) return

    const editorRoot = editor.getRootElement()
    const ownerDocument = editorRoot?.ownerDocument
    const ownerView = ownerDocument?.defaultView

    if (!editorRoot || !ownerDocument || !ownerView) {
      setError("Print needs a mounted editor view.")

      return
    }

    const popup = ownerView.open("about:blank", "_blank")

    if (!popup) {
      setError("Allow popups to print this document.")

      return
    }

    popup.opener = null
    setError("")
    setStatus("Preparing print document.")
    let active: ActiveExport | null = null

    let snapshot: Awaited<
      ReturnType<typeof createEditorDocumentExportSnapshot>
    > | null = null

    let onPopupPageHide: (() => void) | null = null

    try {
      const started = startExport(
        editor,
        event.currentTarget,
        activeRef,
        setBusy,
        title,
      )

      active = started.active
      active.popup = popup
      onPopupPageHide = () => {
        if (active?.reason !== null) return
        active.reason = "cancelled"
        active.controller.abort()
      }

      popup.addEventListener("pagehide", onPopupPageHide, { once: true })

      const snapshotWork = active.lease.track(
        createEditorDocumentExportSnapshot(started.html, editorRoot, {
          deadlineAt: active.lease.deadlineAt,
          nonce,
          purpose: "print",
          resolveResource,
          signal: active.lease.signal,
        }),
      )

      snapshot = await waitForEditorDocumentExportWithCleanup(
        snapshotWork,
        active.lease,
        (lateSnapshot) => lateSnapshot.dispose(),
      )
      assertExportCurrent(editor, active)

      const popupDocument = popup.document
      const popupView = popupDocument.defaultView

      if (!popupView || popup.closed)
        throw new EditorDocumentExportError(
          "popup",
          "Print window closed before the document was ready.",
        )

      popupDocument.documentElement.lang = "en"
      popupDocument.title = title
      popupDocument.head.replaceChildren()
      popupDocument.body.replaceChildren()
      const printStyles = popupDocument.createElement("style")

      if (nonce) printStyles.nonce = nonce
      printStyles.textContent = snapshot.styles.textContent
      const printRoot = popupDocument.importNode(snapshot.root, true)
      assertExportCurrent(editor, active)
      popupDocument.head.append(printStyles)
      popupDocument.body.append(printRoot)

      const printStyleProbe = popupView
        .getComputedStyle(printRoot)
        .getPropertyValue("--editor-export-probe")
        .trim()

      assertExportCurrent(editor, active)

      if (printStyleProbe !== "1")
        throw new EditorDocumentExportError(
          "document",
          "Print styles were blocked. Supply an allowed CSP nonce.",
        )

      snapshot.dispose()
      snapshot = null
      await waitForEditorDocumentExportImages(printRoot, active.lease)
      await waitForEditorDocumentExport(popupDocument.fonts.ready, active.lease)
      assertExportCurrent(editor, active)

      if (popup.closed)
        throw new EditorDocumentExportError(
          "popup",
          "Print window closed before printing started.",
        )

      const printBounds = printRoot.getBoundingClientRect()
      validateEditorDocumentExportDimensions(
        Math.ceil(Math.max(printRoot.scrollWidth, printBounds.width)),
        Math.ceil(Math.max(printRoot.scrollHeight, printBounds.height)),
      )
      assertExportCurrent(editor, active)

      await waitForPrintCompletion(popup, ownerView, active, setStatusIfMounted)

      if (mountedRef.current) setStatus("Print window closed.")
    } catch (cause) {
      active?.controller.abort()

      if (mountedRef.current && active?.reason !== "unmounted") {
        setError(
          exportErrorMessage(
            cause instanceof EditorDocumentExportError ? cause : null,
            active,
          ),
        )

        if (active?.reason === "cancelled")
          setStatus("Document export cancelled.")
      }
    } finally {
      snapshot?.dispose()

      if (onPopupPageHide)
        popup.removeEventListener("pagehide", onPopupPageHide)

      if (active) {
        if (activeRef.current === active) activeRef.current = null
        active.lease.finish()
      }

      if (!popup.closed) popup.close()

      if (mountedRef.current) finishExportUI(active, setBusy)
    }
  }

  const handlePrint = useStableCallback(function handlePrint(
    event: MouseEvent<HTMLElement>,
  ) {
    void print(event)
  })

  return useRender({
    render: <Box />,
    ref: [rootRef, ref ?? null],
    props: {
      role: "group",
      "aria-label": "Document print",
      ...props,
      "data-slot": "editor-document-print-control",
      "aria-busy": busy,
      children: (
        <Wrap>
          <Button disabled={busy} onClick={handlePrint}>
            Print document
          </Button>
          <Button disabled={!busy} onClick={cancel}>
            Cancel document export
          </Button>
          <Box render={<output aria-live="polite" />}>{status}</Box>
          {error ? <Text role="alert">{error}</Text> : null}
        </Wrap>
      ),
    },
  })
}

export interface EditorDocumentImageExportControlProps
  extends Omit<BoxProps, "children" | keyof ExportOptions>, ExportOptions {
  capture: EditorDocumentImageCapture
}

interface EditorDocumentRasterExportControlProps extends EditorDocumentImageExportControlProps {
  format: "PNG" | "PDF"
  encode?: (
    blob: Blob,
    ownerDocument: Document,
    operation: EditorDocumentExportOperation,
    dimensions: { readonly width: number; readonly height: number },
  ) => Promise<Blob>
}

export function EditorDocumentImageExportControl(
  props: EditorDocumentImageExportControlProps,
) {
  return useEditorDocumentRasterExport({ ...props, format: "PNG" })
}

export function useEditorDocumentRasterExport({
  capture,
  nonce,
  resolveResource,
  format,
  encode,
  ref,
  ...props
}: EditorDocumentRasterExportControlProps) {
  const editor = useEditor()
  const activeRef = useRef<ActiveExport | null>(null)
  const mountedRef = useRef(false)
  const rootRef = useExportRootRef(editor, activeRef, mountedRef)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [status, setStatus] = useState("")

  const cancel = useStableCallback(function cancel(
    event: MouseEvent<HTMLElement>,
  ) {
    if (event.defaultPrevented) return
    const active = activeRef.current

    if (!active) return
    active.reason = "cancelled"
    active.controller.abort()
  })

  async function exportImage(event: MouseEvent<HTMLElement>) {
    if (event.defaultPrevented || activeRef.current) return

    const editorRoot = editor.getRootElement()

    if (!editorRoot?.ownerDocument.defaultView) {
      setError(`${format} export needs a mounted editor view.`)

      return
    }

    setError("")
    setStatus(`Preparing ${format} export.`)
    let active: ActiveExport | null = null

    let snapshot: Awaited<
      ReturnType<typeof createEditorDocumentExportSnapshot>
    > | null = null

    try {
      const started = startExport(
        editor,
        event.currentTarget,
        activeRef,
        setBusy,
        "Document",
      )

      active = started.active

      const snapshotWork = active.lease.track(
        createEditorDocumentExportSnapshot(started.html, editorRoot, {
          deadlineAt: active.lease.deadlineAt,
          nonce,
          purpose: "image",
          resolveResource,
          signal: active.lease.signal,
        }),
      )

      snapshot = await waitForEditorDocumentExportWithCleanup(
        snapshotWork,
        active.lease,
        (lateSnapshot) => lateSnapshot.dispose(),
      )
      assertExportCurrent(editor, active)

      const captureWork = active.lease.track(
        capture(snapshot.root, {
          deadlineAt: active.lease.deadlineAt,
          height: snapshot.height,
          signal: active.lease.signal,
          width: snapshot.width,
        }),
      )

      let blob = await waitForEditorDocumentExport(captureWork, active.lease)
      assertExportCurrent(editor, active)
      await assertEditorDocumentExportPNG(blob, active.lease, {
        height: snapshot.height,
        width: snapshot.width,
      })
      assertExportCurrent(editor, active)

      const ownerDocument = editorRoot.ownerDocument
      const ownerView = ownerDocument.defaultView

      if (!ownerView)
        throw new EditorDocumentExportError(
          "document",
          `${format} export needs a mounted editor view.`,
        )

      if (encode) {
        const encodeWork = active.lease.track(
          encode(blob, ownerDocument, active.lease, {
            height: snapshot.height,
            width: snapshot.width,
          }),
        )

        blob = await waitForEditorDocumentExport(encodeWork, active.lease)
        assertExportCurrent(editor, active)
      }

      const url = ownerView.URL.createObjectURL(blob)
      const link = ownerDocument.createElement("a")

      try {
        link.href = url
        link.download = format === "PDF" ? "plate.pdf" : "document.png"
        link.hidden = true
        ownerDocument.body.append(link)
        assertEditorDocumentExportActive(active.lease)
        link.click()
      } finally {
        link.remove()
        ownerView.setTimeout(() => ownerView.URL.revokeObjectURL(url), 0)
      }

      if (mountedRef.current) setStatus(`${format} document downloaded.`)
    } catch (cause) {
      active?.controller.abort()

      if (mountedRef.current && active?.reason !== "unmounted") {
        setError(
          exportErrorMessage(
            cause instanceof EditorDocumentExportError ? cause : null,
            active,
          ),
        )

        if (active?.reason === "cancelled")
          setStatus("Document export cancelled.")
      }
    } finally {
      snapshot?.dispose()

      if (active) {
        if (activeRef.current === active) activeRef.current = null
        active.lease.finish()
      }

      if (mountedRef.current) finishExportUI(active, setBusy)
    }
  }

  const handleExportImage = useStableCallback(function handleExportImage(
    event: MouseEvent<HTMLElement>,
  ) {
    void exportImage(event)
  })

  return useRender({
    render: <Box />,
    ref: [rootRef, ref ?? null],
    props: {
      role: "group",
      "aria-label":
        format === "PDF" ? "Document PDF export" : "Document image export",
      ...props,
      "data-slot":
        format === "PDF"
          ? "editor-document-pdf-export-control"
          : "editor-document-image-export-control",
      "aria-busy": busy,
      children: (
        <Wrap>
          <Button disabled={busy} onClick={handleExportImage}>
            Export document as {format}
          </Button>
          <Button disabled={!busy} onClick={cancel}>
            Cancel document export
          </Button>
          <Box render={<output aria-live="polite" />}>{status}</Box>
          {error ? <Text role="alert">{error}</Text> : null}
        </Wrap>
      ),
    },
  })
}

export interface EditorDocumentExportControlsProps
  extends Omit<WrapProps, "children" | keyof ExportOptions>, ExportOptions {
  capture: EditorDocumentImageCapture
  title?: string
}

export function EditorDocumentExportControls({
  capture,
  nonce,
  resolveResource,
  title,
  ...props
}: EditorDocumentExportControlsProps) {
  return (
    <Wrap {...props} data-slot="editor-document-export-controls">
      <EditorDocumentPrintControl
        nonce={nonce}
        resolveResource={resolveResource}
        title={title}
      />
      <EditorDocumentImageExportControl
        capture={capture}
        nonce={nonce}
        resolveResource={resolveResource}
      />
    </Wrap>
  )
}
