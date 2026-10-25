"use client"

import type { EditorDiagramRenderers } from "@yopem-ui/editor/diagram"
import type { EditorState } from "lexical"
import type { ChangeEvent } from "react"

import { Box } from "@registry/components/ui/box"
import { Button } from "@registry/components/ui/button"
import { Field, FieldLabel } from "@registry/components/ui/field"
import { Input } from "@registry/components/ui/input"
import { Stack } from "@registry/components/ui/stack"
import { Text } from "@registry/components/ui/text"
import * as stylex from "@stylexjs/stylex"
import {
  EditorContent,
  EditorHistoryButton,
  EditorRoot,
} from "@yopem-ui/editor"
import {
  EditorCodeCopyButton,
  EditorCodeExtension,
  EditorCodeLanguage,
  EditorCodeStatus,
  EditorCodeToolbar,
} from "@yopem-ui/editor/code"
import {
  createEditorDiagramHttpRenderer,
  EditorDiagramDeleteButton,
  EditorDiagramDownloadButton,
  EditorDiagramExtension,
  EditorDiagramInsertButton,
  EditorDiagramKindSelect,
  EditorDiagramRenderButton,
  EditorDiagramRoot,
  EditorDiagramStatus,
  EditorDiagramToolbar,
  EditorDiagramViewModeSelect,
} from "@yopem-ui/editor/diagram"
import { useId, useState } from "react"

const styles = stylex.create({
  state: { whiteSpace: "pre-wrap", overflowWrap: "anywhere" },
})

const extensions = [EditorCodeExtension, EditorDiagramExtension]

const initialState = JSON.stringify({
  root: {
    type: "root",
    version: 1,
    format: "",
    indent: 0,
    direction: null,
    children: [
      {
        type: "code",
        version: 1,
        language: "mermaid",
        format: "",
        indent: 0,
        direction: null,
        $: {
          editorDiagram: {
            version: 1,
            kind: "mermaid",
            viewMode: "both",
          },
        },
        children: [
          {
            type: "text",
            version: 1,
            text: "flowchart LR\n  Source --> Renderer --> SVG",
            format: 0,
            style: "",
            mode: "normal",
            detail: 0,
          },
        ],
      },
      {
        type: "paragraph",
        version: 1,
        format: "",
        indent: 0,
        direction: null,
        children: [
          {
            type: "text",
            version: 1,
            text: "Diagram code stays in native Lexical code blocks.",
            format: 0,
            style: "",
            mode: "normal",
            detail: 0,
          },
        ],
      },
    ],
  },
})

export function PublicCodeDrawingExample() {
  const fieldId = useId()
  const [endpoint, setEndpoint] = useState("")
  const [documentId, setDocumentId] = useState("")
  const [csrf, setCsrf] = useState("")
  const [error, setError] = useState("")
  const [renderers, setRenderers] = useState<EditorDiagramRenderers>()
  const [editable, setEditable] = useState(true)
  const [serialized, setSerialized] = useState(initialState)

  function updateEndpoint(event: ChangeEvent<HTMLInputElement>) {
    setEndpoint(event.target.value)
  }

  function updateDocumentId(event: ChangeEvent<HTMLInputElement>) {
    setDocumentId(event.target.value)
  }

  function updateCsrf(event: ChangeEvent<HTMLInputElement>) {
    setCsrf(event.target.value)
  }

  function toggleEditable() {
    setEditable((value) => !value)
  }

  function updateSerialized(state: EditorState) {
    setSerialized(JSON.stringify(state, null, 2))
  }

  function configure() {
    try {
      if (
        !documentId.trim() ||
        documentId.length > 256 ||
        !csrf ||
        csrf.length > 4096
      )
        throw new Error("Supply a bounded document ID and CSRF token.")

      const headers = new Headers({
        "x-editor-document-id": documentId,
        "x-csrf-token": csrf,
      })

      const renderer = createEditorDiagramHttpRenderer(
        endpoint,
        (input, init) => {
          const requestHeaders = new Headers(init?.headers)

          headers.forEach((value, name) => requestHeaders.set(name, value))

          return fetch(input, { ...init, headers: requestHeaders })
        },
      )

      setRenderers({
        mermaid: renderer,
        plantuml: renderer,
        graphviz: renderer,
        flowchart: renderer,
      })
      setError("")
    } catch {
      setError(
        "Supply a valid same-origin endpoint, document ID, and CSRF token.",
      )
    }
  }

  return (
    <Stack>
      <Text>
        Supply an authorized same-origin SVG renderer. No endpoint or engine is
        configured by default. After configuration, selected diagram code
        renders automatically after 300 ms when no current preview exists.
        Editing source or changing diagram type can trigger another render.
        Requests send source to your host and may use its resources or service
        quota. The host must check document access, CSRF, quotas, and rendering
        budgets. Source and errors remain visible if rendering fails.
      </Text>
      <Field>
        <FieldLabel htmlFor={`${fieldId}-endpoint`}>
          Diagram host endpoint
        </FieldLabel>
        <Input
          id={`${fieldId}-endpoint`}
          value={endpoint}
          disabled={!!renderers}
          onChange={updateEndpoint}
          placeholder="/api/your-diagram-renderer"
        />
      </Field>
      <Field>
        <FieldLabel htmlFor={`${fieldId}-document`}>
          Diagram document ID
        </FieldLabel>
        <Input
          id={`${fieldId}-document`}
          value={documentId}
          disabled={!!renderers}
          onChange={updateDocumentId}
        />
      </Field>
      <Field>
        <FieldLabel htmlFor={`${fieldId}-csrf`}>Diagram CSRF token</FieldLabel>
        <Input
          id={`${fieldId}-csrf`}
          type="password"
          autoComplete="off"
          value={csrf}
          disabled={!!renderers}
          onChange={updateCsrf}
        />
      </Field>
      <Button
        disabled={!!renderers || !endpoint || !documentId || !csrf}
        onClick={configure}
      >
        Configure diagram renderer
      </Button>
      {error ? <Box role="alert">{error}</Box> : null}
      {renderers ? (
        <Stack>
          <Button variant="outline" onClick={toggleEditable}>
            {editable ? "Read-only diagram" : "Enable diagram editing"}
          </Button>
          <EditorRoot
            ariaLabel="Public code drawing editor"
            editable={editable}
            extensions={extensions}
            initialState={initialState}
            onChange={updateSerialized}
          >
            <EditorDiagramRoot renderers={renderers} autoRender>
              <EditorCodeToolbar aria-label="Diagram code tools">
                <EditorCodeLanguage />
                <EditorCodeCopyButton />
                <EditorHistoryButton action="undo" />
                <EditorHistoryButton action="redo" />
                <EditorCodeStatus />
              </EditorCodeToolbar>
              <EditorDiagramToolbar aria-label="Diagram tools">
                <EditorDiagramInsertButton />
                <EditorDiagramKindSelect />
                <EditorDiagramViewModeSelect />
                <EditorDiagramRenderButton />
                <EditorDiagramDownloadButton />
                <EditorDiagramDeleteButton />
                <EditorDiagramStatus />
              </EditorDiagramToolbar>
              <EditorContent placeholder="Select a diagram code block to edit…" />
            </EditorDiagramRoot>
          </EditorRoot>
          <Box render={<section />} aria-label="Serialized diagram state">
            <Box render={<pre />} xstyle={styles.state}>
              {serialized}
            </Box>
          </Box>
        </Stack>
      ) : null}
    </Stack>
  )
}
