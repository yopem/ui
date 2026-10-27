"use client"

import type { ChangeEvent, Dispatch, MouseEvent, SetStateAction } from "react"

import { useStableCallback } from "@base-ui/utils/useStableCallback"
import { HorizontalRuleExtension } from "@lexical/extension"
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
import { EditorListPresentationExtension } from "@yopem-ui/editor/list-presentation/extension"
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
  HorizontalRuleExtension,
  documentModelExtension,
  MediaExtension,
  EditorDocumentClipboardExtension,
  EditorBlocksExtension,
  EditorBlockPresentationExtension,
  EditorTablePresentationExtension,
  EditorListPresentationExtension,
]

function DocumentControls({
  readonly,
  setReadonly,
}: {
  readonly: boolean
  setReadonly: Dispatch<SetStateAction<boolean>>
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
  const markdownRef = useRef(markdown)
  const htmlSourceRef = useRef(htmlSource)

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

  const exportOutputs = useStableCallback(function exportOutputs() {
    try {
      const nextHTML = exportDocument(editor, "html")
      setHTML(nextHTML)
      setOutput(exportDocument(editor, "markdown"))
      setError("")
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Export failed.")
    }
  })

  const startStream = useStableCallback(async function startStream() {
    const abort = new AbortController()
    stream.current = abort
    setController(abort)
    setStreaming("")

    async function* chunks() {
      for (let offset = 0; offset < markdownRef.current.length; offset += 4) {
        await new Promise((resolve) => {
          setTimeout(resolve, 100)
        })

        if (abort.signal.aborted) return
        yield markdownRef.current.slice(offset, offset + 4)
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
  })

  const handleMarkdownChange = useStableCallback(function handleMarkdownChange(
    event: ChangeEvent<HTMLTextAreaElement>,
  ) {
    markdownRef.current = event.target.value
    setMarkdown(event.target.value)
  })

  const importMarkdown = useStableCallback(function importMarkdown() {
    run(() => importDocument(editor, markdownRef.current, "markdown"))
  })

  const handleHTMLSourceChange = useStableCallback(
    function handleHTMLSourceChange(event: ChangeEvent<HTMLTextAreaElement>) {
      htmlSourceRef.current = event.target.value
      setHTMLSource(event.target.value)
    },
  )

  const importHTML = useStableCallback(function importHTML() {
    run(() => importDocument(editor, htmlSourceRef.current, "html"))
  })

  const downloadMarkdown = useStableCallback(function downloadMarkdown(
    event: MouseEvent<HTMLElement>,
  ) {
    run(() =>
      downloadDocument(editor, "markdown", event.currentTarget.ownerDocument),
    )
  })

  const downloadHTML = useStableCallback(function downloadHTML(
    event: MouseEvent<HTMLElement>,
  ) {
    run(() =>
      downloadDocument(editor, "html", event.currentTarget.ownerDocument),
    )
  })

  const cancelStream = useStableCallback(function cancelStream() {
    stream.current?.abort()
  })

  const undoImport = useStableCallback(function undoImport() {
    editor.dispatchCommand(UNDO_COMMAND, undefined)
  })

  const toggleReadonly = useStableCallback(function toggleReadonly() {
    setReadonly((current) => !current)
  })

  return (
    <Stack ref={connect}>
      <Label htmlFor="document-markdown-source">Markdown source</Label>
      <Textarea
        id="document-markdown-source"
        value={markdown}
        onChange={handleMarkdownChange}
      />
      <Button
        disabled={readonly || controller !== null}
        onClick={importMarkdown}
      >
        Import Markdown
      </Button>
      <Label htmlFor="document-html-source">HTML source</Label>
      <Textarea
        id="document-html-source"
        value={htmlSource}
        onChange={handleHTMLSourceChange}
      />
      <Button disabled={readonly || controller !== null} onClick={importHTML}>
        Import HTML
      </Button>
      <Button onClick={exportOutputs}>Export document</Button>
      <Button onClick={downloadMarkdown}>Download Markdown</Button>
      <Button onClick={downloadHTML}>Download HTML</Button>
      <Button disabled={readonly || controller !== null} onClick={startStream}>
        Stream Markdown
      </Button>
      <Button disabled={controller === null} onClick={cancelStream}>
        Cancel stream
      </Button>
      <Label htmlFor="document-stream-output">Streaming output</Label>
      <Textarea
        id="document-stream-output"
        readOnly
        value={streaming}
        aria-live="polite"
      />
      <Button disabled={readonly || controller !== null} onClick={undoImport}>
        Undo import
      </Button>
      <Button disabled={controller !== null} onClick={toggleReadonly}>
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
