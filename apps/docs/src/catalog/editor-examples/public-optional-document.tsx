"use client"

import { Box } from "@registry/components/ui/box"
import { Button } from "@registry/components/ui/button"
import { Heading } from "@registry/components/ui/heading"
import { Label } from "@registry/components/ui/label"
import { Stack } from "@registry/components/ui/stack"
import { Text } from "@registry/components/ui/text"
import { Textarea } from "@registry/components/ui/textarea"
import {
  EditorContent,
  EditorHistoryButton,
  EditorRoot,
  EditorToolbar,
  useEditor,
  useEditorState,
} from "@yopem-ui/editor"
import {
  EditorColumnsControls,
  EditorColumnsExtension,
} from "@yopem-ui/editor/columns"
import { EditorDateControls, EditorDateExtension } from "@yopem-ui/editor/date"
import { EditorDiagramExtension } from "@yopem-ui/editor/diagram"
import {
  EditorDocumentClipboardExtension,
  exportDocument,
  importDocument,
  registerDocumentPaste,
  type DocumentFormat,
} from "@yopem-ui/editor/document"
import { DocumentStatic } from "@yopem-ui/editor/document/static"
import {
  $createEditorDrawingNode,
  EditorDrawingExtension,
  type EditorDrawingScene,
} from "@yopem-ui/editor/drawing"
import {
  EditorEditableCardExtension,
  EditorEditableCardInsertButton,
} from "@yopem-ui/editor/editable-card"
import {
  EditorFootnoteControls,
  EditorFootnoteExtension,
} from "@yopem-ui/editor/footnote"
import { createEditorLabelsExtension } from "@yopem-ui/editor/labels"
import { EditorTocControls, EditorTocExtension } from "@yopem-ui/editor/toc"
import { $getRoot, HISTORY_PUSH_TAG } from "lexical"
import { Redo2Icon, Undo2Icon } from "lucide-react"
import { useId, useState } from "react"

const labelOptions = ["Approved", "Needs review"]

const extensions = [
  EditorDocumentClipboardExtension,
  EditorFootnoteExtension,
  EditorTocExtension,
  EditorColumnsExtension,
  EditorDateExtension,
  createEditorLabelsExtension(labelOptions),
  EditorDrawingExtension,
  EditorEditableCardExtension,
  EditorDiagramExtension,
]

const drawingScene: EditorDrawingScene = {
  elements: [
    {
      id: "source-rectangle",
      type: "rectangle",
      x: 24,
      y: 24,
      width: 120,
      height: 64,
    },
  ],
}

function textNode(text: string) {
  return {
    type: "text",
    version: 1,
    detail: 0,
    format: 0,
    mode: "normal",
    style: "",
    text,
  }
}

function element(
  type: string,
  children: unknown[],
  properties: {
    tag?: "h1" | "h2"
    layout?: number[]
    language?: string
    identifier?: string
    $?: {
      editorDiagram: { version: 1; kind: "mermaid"; viewMode: "code" }
    }
  } = {},
) {
  return {
    type,
    version: 1,
    direction: null,
    format: "",
    indent: 0,
    ...properties,
    children,
  }
}

function paragraph(children: unknown[]) {
  return element("paragraph", children)
}

function heading(tag: "h1" | "h2", text: string) {
  return element("heading", [textNode(text)], { tag })
}

const initialState = JSON.stringify({
  root: element("root", [
    heading("h1", "Optional document formats"),
    { type: "editor-toc", version: 1 },
    paragraph([
      textNode("Canonical document codecs retain native saved data"),
      {
        type: "editor-footnote-reference",
        version: 1,
        identifier: "source-note",
      },
      textNode("."),
    ]),
    heading("h2", "Saved feature data"),
    paragraph([
      textNode("Review date: "),
      { type: "editor-date", version: 1, date: "2024-02-29" },
      textNode(" Status: "),
      {
        type: "editor-label",
        version: 1,
        detail: 0,
        format: 0,
        mode: "token",
        style: "",
        text: "Approved",
        label: "Approved",
      },
      textNode("."),
    ]),
    element(
      "editor-columns-group",
      [
        element("editor-column", [paragraph([textNode("Left column data")])]),
        element("editor-column", [paragraph([textNode("Right column data")])]),
      ],
      { layout: [50, 50] },
    ),
    {
      type: "editor-drawing",
      version: 1,
      elements: drawingScene.elements,
    },
    { type: "editor-editable-card", version: 1 },
    element(
      "code",
      [textNode("flowchart LR\n  Source --> Canonical formats")],
      {
        language: "mermaid",
        $: {
          editorDiagram: { version: 1, kind: "mermaid", viewMode: "code" },
        },
      },
    ),
    element(
      "editor-footnote-definition",
      [
        paragraph([
          textNode("Footnote body retained by JSON, HTML, and Markdown."),
        ]),
      ],
      { identifier: "source-note" },
    ),
  ]),
})

function DocumentControls({
  editable,
  onToggleEditable,
}: {
  editable: boolean
  onToggleEditable: () => void
}) {
  const editor = useEditor()
  const sourceId = useId()
  const [jsonSource, setJSONSource] = useState(initialState)
  const [htmlSource, setHTMLSource] = useState("")
  const [markdownSource, setMarkdownSource] = useState("")
  const [staticHTML, setStaticHTML] = useState("")
  const [error, setError] = useState("")

  const [connect] = useState(
    () =>
      function connect() {
        return registerDocumentPaste(editor, (failure) => {
          setError(failure.message)
        })
      },
  )

  function exportAll() {
    try {
      const json = exportDocument(editor, "json")
      const html = exportDocument(editor, "html")
      const markdown = exportDocument(editor, "markdown")
      setJSONSource(json)
      setHTMLSource(html)
      setMarkdownSource(markdown)
      setStaticHTML(html)
      setError("")
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Document operation failed.",
      )
    }
  }

  function importSource(format: DocumentFormat) {
    const source =
      format === "json"
        ? jsonSource
        : format === "html"
          ? htmlSource
          : markdownSource

    try {
      importDocument(editor, source, format)
      setError("")
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Document operation failed.",
      )
    }
  }

  return (
    <Stack ref={connect}>
      <Stack>
        <Button
          aria-pressed={!editable}
          onClick={onToggleEditable}
          variant="outline"
        >
          {editable ? "Make editor read-only" : "Enable editor"}
        </Button>
        <Button onClick={exportAll}>Export all formats</Button>
      </Stack>
      <Stack>
        <Label htmlFor={`${sourceId}-json`}>JSON source</Label>
        <Textarea
          id={`${sourceId}-json`}
          value={jsonSource}
          onChange={(event) => setJSONSource(event.currentTarget.value)}
        />
        <Button onClick={() => importSource("json")}>Import JSON</Button>
        <Label htmlFor={`${sourceId}-html`}>HTML source</Label>
        <Textarea
          id={`${sourceId}-html`}
          value={htmlSource}
          onChange={(event) => setHTMLSource(event.currentTarget.value)}
        />
        <Button onClick={() => importSource("html")}>Import HTML</Button>
        <Label htmlFor={`${sourceId}-markdown`}>Markdown source</Label>
        <Textarea
          id={`${sourceId}-markdown`}
          value={markdownSource}
          onChange={(event) => setMarkdownSource(event.currentTarget.value)}
        />
        <Button onClick={() => importSource("markdown")}>
          Import Markdown
        </Button>
      </Stack>
      {error ? <Text role="alert">{error}</Text> : null}
      {staticHTML ? (
        <DocumentStatic
          aria-label="Optional codec static preview"
          html={staticHTML}
        />
      ) : null}
    </Stack>
  )
}

function DrawingInsertControl() {
  const editor = useEditor()
  const { editable } = useEditorState()

  return (
    <Button
      disabled={!editable}
      onMouseDown={(event) => event.preventDefault()}
      onClick={(event) => {
        if (event.defaultPrevented || !editor.isEditable()) return
        editor.update(
          () => {
            $getRoot().append($createEditorDrawingNode(drawingScene))
          },
          { tag: HISTORY_PUSH_TAG },
        )
      }}
    >
      Insert safe drawing scene
    </Button>
  )
}

export function PublicOptionalDocumentExample() {
  const titleId = useId()
  const [editable, setEditable] = useState(true)

  return (
    <Box
      data-testid="public-optional-document"
      render={<section aria-labelledby={titleId} />}
    >
      <Stack>
        <Heading id={titleId}>Optional document codec reader</Heading>
        <Text>
          Edit the native document, export each bounded format, and import the
          result. Drawings show safe scene metadata. Diagrams stay as source
          until a host supplies a renderer. Editable-card fields and nested
          notes stay local and are not saved in the document.
        </Text>
        <EditorRoot
          ariaLabel="Optional codecs editor"
          editable={editable}
          extensions={extensions}
          initialState={initialState}
        >
          <EditorToolbar aria-label="Optional document feature controls">
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
            <EditorFootnoteControls />
            <EditorTocControls />
            <EditorColumnsControls />
            <EditorDateControls initialDate="2024-02-29" />
            <EditorEditableCardInsertButton />
            <DrawingInsertControl />
          </EditorToolbar>
          <EditorContent placeholder="Edit the source document…" />
          <DocumentControls
            editable={editable}
            onToggleEditable={() => setEditable((value) => !value)}
          />
        </EditorRoot>
      </Stack>
    </Box>
  )
}
