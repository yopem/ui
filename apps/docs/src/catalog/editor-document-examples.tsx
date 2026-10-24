"use client"

import { Box } from "@registry/components/ui/box"
import { Button } from "@registry/components/ui/button"
import { Label } from "@registry/components/ui/label"
import { Stack } from "@registry/components/ui/stack"
import { Text } from "@registry/components/ui/text"
import { Textarea } from "@registry/components/ui/textarea"
import {
  EditorContent,
  EditorRoot,
  EditorBlockPresentationExtension,
  EditorTablePresentationExtension,
  useEditor,
} from "@yopem-ui/editor"
import { EditorBlocksExtension } from "@yopem-ui/editor/blocks"
import {
  EditorDocumentClipboardExtension,
  documentNodes,
  downloadDocument,
  exportDocument,
  importDocument,
  registerDocumentPaste,
  streamMarkdown,
} from "@yopem-ui/editor/document"
import { DocumentStatic } from "@yopem-ui/editor/document/static"
import { MediaExtension } from "@yopem-ui/editor/media"
import { UNDO_COMMAND, defineExtension } from "lexical"
import { useRef, useState } from "react"

const documentModelExtension = defineExtension({
  name: "example/document-models",
  nodes: documentNodes.filter((node) =>
    ["editor-math", "mention"].includes(node.getType()),
  ),
})

const extensions = [
  documentModelExtension,
  MediaExtension,
  EditorDocumentClipboardExtension,
  EditorBlocksExtension,
  EditorBlockPresentationExtension,
  EditorTablePresentationExtension,
]

function DocumentControls({
  readonly,
  setReadonly,
}: {
  readonly: boolean
  setReadonly: (value: boolean) => void
}) {
  const editor = useEditor()

  const [markdown, setMarkdown] = useState(
    "# Document\n\n**Hello** from Markdown.",
  )

  const [htmlSource, setHTMLSource] = useState(
    "<p><strong>Hello</strong> from HTML.</p>",
  )

  const [html, setHTML] = useState("")
  const [output, setOutput] = useState("")
  const [error, setError] = useState("")
  const [streaming, setStreaming] = useState("")
  const [controller, setController] = useState<AbortController | null>(null)
  const stream = useRef<AbortController | null>(null)

  const [connect] = useState(
    () =>
      function connect() {
        const unregister = registerDocumentPaste(editor, (failure) => {
          setError(failure.message)
        })

        return () => {
          unregister()
          stream.current?.abort()
        }
      },
  )

  function run(action: () => void) {
    try {
      action()
      setError("")
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : "Conversion failed.",
      )
    }
  }

  function exportOutputs() {
    try {
      const nextHTML = exportDocument(editor, "html")
      setHTML(nextHTML)
      setOutput(exportDocument(editor, "markdown"))
      setError("")
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Export failed.")
    }
  }

  async function startStream() {
    const abort = new AbortController()
    stream.current = abort
    setController(abort)
    setStreaming("")

    async function* chunks() {
      for (let offset = 0; offset < markdown.length; offset += 4) {
        await new Promise((resolve) => {
          setTimeout(resolve, 100)
        })

        if (abort.signal.aborted) return
        yield markdown.slice(offset, offset + 4)
      }
    }

    try {
      await streamMarkdown(editor, chunks(), {
        signal: abort.signal,
        onProgress: setStreaming,
      })
      setError("")
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Stream failed.")
    } finally {
      stream.current = null
      setController(null)
    }
  }

  return (
    <Stack ref={connect}>
      <Label htmlFor="document-markdown-source">Markdown source</Label>
      <Textarea
        id="document-markdown-source"
        value={markdown}
        onChange={(event) => {
          setMarkdown(event.target.value)
        }}
      />
      <Button
        disabled={readonly || controller !== null}
        onClick={() => {
          run(() => {
            importDocument(editor, markdown, "markdown")
          })
        }}
      >
        Import Markdown
      </Button>
      <Label htmlFor="document-html-source">HTML source</Label>
      <Textarea
        id="document-html-source"
        value={htmlSource}
        onChange={(event) => {
          setHTMLSource(event.target.value)
        }}
      />
      <Button
        disabled={readonly || controller !== null}
        onClick={() => {
          run(() => {
            importDocument(editor, htmlSource, "html")
          })
        }}
      >
        Import HTML
      </Button>
      <Button onClick={exportOutputs}>Export document</Button>
      <Button
        onClick={(event) => {
          run(() => {
            downloadDocument(
              editor,
              "markdown",
              event.currentTarget.ownerDocument,
            )
          })
        }}
      >
        Download Markdown
      </Button>
      <Button
        onClick={(event) => {
          run(() => {
            downloadDocument(editor, "html", event.currentTarget.ownerDocument)
          })
        }}
      >
        Download HTML
      </Button>
      <Button
        disabled={readonly || controller !== null}
        onClick={() => {
          void startStream()
        }}
      >
        Stream Markdown
      </Button>
      <Button
        disabled={controller === null}
        onClick={() => {
          controller?.abort()
        }}
      >
        Cancel stream
      </Button>
      <Label htmlFor="document-stream-output">Streaming output</Label>
      <Textarea
        id="document-stream-output"
        readOnly
        value={streaming}
        aria-live="polite"
      />
      <Button
        disabled={readonly || controller !== null}
        onClick={() => {
          editor.dispatchCommand(UNDO_COMMAND, undefined)
        }}
      >
        Undo import
      </Button>
      <Button
        disabled={controller !== null}
        onClick={() => {
          setReadonly(!readonly)
        }}
      >
        Toggle readonly
      </Button>
      <Label htmlFor="document-markdown-output">Markdown output</Label>
      <Textarea id="document-markdown-output" readOnly value={output} />
      <Label htmlFor="document-html-output">HTML output</Label>
      <Textarea id="document-html-output" readOnly value={html} />
      {error ? <Text role="alert">{error}</Text> : null}
      <DocumentStatic html={html} />
    </Stack>
  )
}

export function EditorDocumentExamples() {
  const [readonly, setReadonly] = useState(false)

  return (
    <Box render={<section aria-label="Document I/O example" />}>
      <EditorRoot
        ariaLabel="Document editor"
        editable={!readonly}
        extensions={extensions}
      >
        <EditorContent />
        <DocumentControls readonly={readonly} setReadonly={setReadonly} />
      </EditorRoot>
    </Box>
  )
}
