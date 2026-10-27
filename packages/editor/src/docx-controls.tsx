"use client"

import type { BoxProps } from "@registry/components/ui/box"
import type { ChangeEvent, MouseEvent } from "react"

import { useRender } from "@base-ui/react/use-render"
import { useStableCallback } from "@base-ui/utils/useStableCallback"
import { Box } from "@registry/components/ui/box"
import { Button } from "@registry/components/ui/button"
import { Field, FieldLabel } from "@registry/components/ui/field"
import { Input } from "@registry/components/ui/input"
import { Text } from "@registry/components/ui/text"
import { Wrap } from "@registry/components/ui/wrap"
import { useId, useRef, useState } from "react"

import { exportDocx } from "./docx-export"
import { importDocx } from "./docx-import"
import { useEditor, useEditorState } from "./root"

const docxMimeType =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

export type EditorDocxImportControlProps = Omit<BoxProps, "children">

export function EditorDocxImportControl({
  ref,
  ...props
}: EditorDocxImportControlProps) {
  const editor = useEditor()
  const { editable } = useEditorState()
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const fileRef = useRef<File | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [status, setStatus] = useState("")

  const [rootRef] = useState(
    () =>
      function rootRef(element: HTMLDivElement | null) {
        if (!element) return
        setBusy(false)

        const unregister = editor.registerEditableListener((isEditable) => {
          if (!isEditable) abortRef.current?.abort()
        })

        return () => {
          unregister()
          abortRef.current?.abort()
          abortRef.current = null
        }
      },
  )

  const selectFile = useStableCallback(function selectFile(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    if (event.defaultPrevented) return
    const nextFile = event.currentTarget.files?.[0] ?? null
    fileRef.current = nextFile
    setFile(nextFile)
    setError("")
    setStatus("")
  })

  const cancel = useStableCallback(function cancel() {
    abortRef.current?.abort()
  })

  const importSelected = useStableCallback(async function importSelected(
    event: MouseEvent<HTMLElement>,
  ) {
    const file = fileRef.current

    if (
      event.defaultPrevented ||
      !file ||
      !editor.isEditable() ||
      abortRef.current
    )
      return
    const controller = new AbortController()
    abortRef.current = controller
    setBusy(true)
    setError("")
    setStatus("Importing Word document")

    try {
      await importDocx(editor, file, { signal: controller.signal })

      if (abortRef.current !== controller) return
      fileRef.current = null
      setFile(null)
      setStatus("Word document imported")

      if (inputRef.current) inputRef.current.value = ""
    } catch (cause) {
      if (abortRef.current !== controller) return

      if (controller.signal.aborted) setStatus("Word import canceled")
      else {
        setStatus("")
        setError(cause instanceof Error ? cause.message : "DOCX import failed.")
      }
    } finally {
      abortRef.current = null
      setBusy(false)
    }
  })

  return useRender({
    render: <Box />,
    ref: [rootRef, ref ?? null],
    props: {
      ...props,
      "data-slot": "editor-docx-import",
      "aria-busy": busy,
      children: (
        <>
          <Field>
            <FieldLabel htmlFor={inputId}>Word document file</FieldLabel>
            <Input
              ref={inputRef}
              id={inputId}
              type="file"
              accept={`.docx,${docxMimeType}`}
              aria-describedby={error ? `${inputId}-error` : undefined}
              aria-invalid={Boolean(error)}
              disabled={!editable || busy}
              onChange={selectFile}
            />
          </Field>
          <Wrap>
            <Button
              disabled={!file || !editable || busy}
              onClick={importSelected}
            >
              Import Word document
            </Button>
            <Button disabled={!busy} onClick={cancel}>
              Cancel Word import
            </Button>
          </Wrap>
          <Box render={<output aria-live="polite" />}>{status}</Box>
          {error ? (
            <Text id={`${inputId}-error`} role="alert">
              {error}
            </Text>
          ) : null}
        </>
      ),
    },
  })
}

export type EditorDocxExportControlProps = Omit<BoxProps, "children">

export function EditorDocxExportControl(props: EditorDocxExportControlProps) {
  const editor = useEditor()
  const [error, setError] = useState("")

  const download = useStableCallback(function download(
    event: MouseEvent<HTMLElement>,
  ) {
    if (event.defaultPrevented) return

    const root = editor.getRootElement()
    const document = root?.ownerDocument
    const view = document?.defaultView

    if (!document || !view) {
      setError("Word download needs an editor view.")

      return
    }

    try {
      const bytes = exportDocx(editor)

      const url = view.URL.createObjectURL(
        new Blob([Uint8Array.from(bytes)], { type: docxMimeType }),
      )

      const link = document.createElement("a")
      link.href = url
      link.download = "document.docx"
      link.hidden = true
      document.body.append(link)

      try {
        link.click()
      } finally {
        link.remove()
        view.setTimeout(() => view.URL.revokeObjectURL(url), 0)
      }

      setError("")
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "DOCX export failed.")
    }
  })

  return (
    <Box {...props} data-slot="editor-docx-export">
      <Button onClick={download}>Download Word document</Button>
      {error ? <Text role="alert">{error}</Text> : null}
    </Box>
  )
}

export type EditorDocxControlsProps = Omit<BoxProps, "children">

export function EditorDocxControls(props: EditorDocxControlsProps) {
  return (
    <Box {...props} data-slot="editor-docx-controls">
      <EditorDocxImportControl />
      <EditorDocxExportControl />
    </Box>
  )
}
