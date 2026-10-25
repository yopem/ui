"use client"

import { Box } from "@registry/components/ui/box"
import { Button } from "@registry/components/ui/button"
import { Heading } from "@registry/components/ui/heading"
import { Label } from "@registry/components/ui/label"
import { NativeSelect } from "@registry/components/ui/native-select"
import { Slider } from "@registry/components/ui/slider"
import { Stack } from "@registry/components/ui/stack"
import { Text } from "@registry/components/ui/text"
import { Textarea } from "@registry/components/ui/textarea"
import { EditorContent, EditorRoot, useEditor } from "@yopem-ui/editor"
import { EditorCode } from "@yopem-ui/editor/code"
import {
  EditorDocumentClipboardExtension,
  exportDocument,
  importDocument,
  registerDocumentPaste,
  streamMarkdown,
} from "@yopem-ui/editor/document"
import { DocumentStatic } from "@yopem-ui/editor/document/static"
import { useRef, useState } from "react"
import { z } from "zod"

const documentExtensions = [EditorDocumentClipboardExtension]

const producerPositionSchema = z.union([
  z.number().finite(),
  z.tuple([z.number().finite()]).transform(([position]) => position),
])

const richHTMLSample = `<p><strong>Rich HTML</strong> with <a href="https://example.com/reference">Reference</a>.</p><blockquote><p>Quoted text</p><blockquote><p>Nested quote</p></blockquote></blockquote><ul><li>Parent<ul><li>Child</li></ul></li></ul><table><tr><th>Item</th><th>Status</th></tr><tr><td>Report</td><td>Ready</td></tr></table>`

const markdownSample = `# Field report

A **bold** statement with [a link](https://example.com/report).

> First quote
>
> > Nested quote

- Parent
  - Child

| Item | Status |
| --- | --- |
| Report | Ready |`

const localStreamingScenarios = [
  {
    id: "field-report",
    label: "Field report",
    markdown: `# Local stream

This fixed local fixture yields Markdown chunks. It does not call a provider.

- First item
- Second item`,
  },
  {
    id: "release-notes",
    label: "Release notes",
    markdown: `# Release notes

A **local** release stream has no provider or network request.

- New producer controls
- One validated document commit at EOF`,
  },
] as const

const initialStreamDocument = createTextDocument("Existing stream document")

const initialLexicalDocument = createTextDocument("Initial rich value")

function createTextDocument(text: string) {
  return JSON.stringify({
    root: {
      type: "root",
      version: 1,
      direction: null,
      format: "",
      indent: 0,
      children: [
        {
          type: "paragraph",
          version: 1,
          direction: null,
          format: "",
          indent: 0,
          children: [
            {
              type: "text",
              version: 1,
              detail: 0,
              format: 0,
              mode: "normal",
              style: "",
              text,
            },
          ],
        },
      ],
    },
  })
}

function createMarkdownCodeDocument(markdown: string) {
  return JSON.stringify({
    root: {
      type: "root",
      version: 1,
      direction: null,
      format: "",
      indent: 0,
      children: [
        {
          type: "code",
          version: 1,
          direction: null,
          format: "",
          indent: 0,
          language: "markdown",
          children: [
            {
              type: "text",
              version: 1,
              detail: 0,
              format: 0,
              mode: "normal",
              style: "",
              text: markdown,
            },
          ],
        },
      ],
    },
  })
}

function MarkdownSyntaxPreview({
  markdown,
  revision,
  ariaLabel,
}: {
  markdown: string
  revision: number
  ariaLabel: string
}) {
  return (
    <EditorCode
      key={revision}
      ariaLabel={ariaLabel}
      editable={false}
      initialState={createMarkdownCodeDocument(markdown)}
    />
  )
}

function createMarkdownChunks(markdown: string) {
  const chunkSize = 12
  const chunks: string[] = []

  for (let offset = 0; offset < markdown.length; offset += chunkSize)
    chunks.push(markdown.slice(offset, offset + chunkSize))

  return chunks
}

function createMarkdownProducer(
  chunks: readonly string[],
  signal: AbortSignal,
  startAt: number,
  initialSpeed: number,
  onChunk: (position: number) => void,
) {
  let paused = false
  let speed = initialSpeed
  let timer: ReturnType<typeof setTimeout> | null = null
  let resolvePending: (() => void) | null = null
  let rejectPending: ((reason: DOMException) => void) | null = null
  let remaining = 0
  let dueAt = 0

  function clearPending() {
    signal.removeEventListener("abort", cancelPending)
    resolvePending = null
    rejectPending = null
  }

  function cancelPending() {
    if (timer !== null) clearTimeout(timer)
    timer = null
    const reject = rejectPending
    clearPending()
    reject?.(new DOMException("Stream cancelled.", "AbortError"))
  }

  function schedule() {
    if (paused || !resolvePending || timer !== null) return
    dueAt = Date.now() + remaining
    timer = setTimeout(() => {
      timer = null
      const resolve = resolvePending
      clearPending()
      resolve?.()
    }, remaining)
  }

  function waitForNextChunk() {
    remaining = speed

    return new Promise<void>((resolve, reject) => {
      resolvePending = resolve
      rejectPending = reject
      signal.addEventListener("abort", cancelPending, { once: true })

      if (signal.aborted) cancelPending()
      else schedule()
    })
  }

  async function* produce() {
    for (const [index, chunk] of chunks.entries()) {
      if (index >= startAt) await waitForNextChunk()

      if (signal.aborted) return
      onChunk(index + 1)
      yield chunk
    }
  }

  return {
    chunks: produce(),
    totalChunks: chunks.length,
    pause() {
      if (paused) return
      paused = true

      if (timer !== null) {
        clearTimeout(timer)
        timer = null
        remaining = Math.max(0, dueAt - Date.now())
      }
    },
    resume() {
      if (!paused) return
      paused = false
      schedule()
    },
    setSpeed(nextSpeed: number) {
      speed = nextSpeed
    },
  }
}

function failureMessage(cause: unknown, fallback: string) {
  return cause instanceof Error ? cause.message : fallback
}

function useDocumentPasteRegistration(
  onError: (message: string) => void,
  onDisconnect?: () => void,
) {
  const editor = useEditor()

  const [connect] = useState(
    () =>
      function connect() {
        const unregister = registerDocumentPaste(editor, (failure) => {
          onError(failure.message)
        })

        return () => {
          unregister()
          onDisconnect?.()
        }
      },
  )

  return connect
}

function HTMLControls() {
  const editor = useEditor()
  const [htmlSource, setHTMLSource] = useState(richHTMLSample)
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)
  const connect = useDocumentPasteRegistration(setError)

  function run(action: () => void) {
    try {
      action()
      setError("")
    } catch (failure) {
      setError(failureMessage(failure, "HTML import failed."))
    }
  }

  async function copyRichHTML() {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([richHTMLSample], { type: "text/html" }),
          "text/plain": new Blob(
            ["Rich HTML with a link, nested blocks, and a table."],
            { type: "text/plain" },
          ),
        }),
      ])
      setCopied(true)
      setError("")
    } catch (failure) {
      setCopied(false)
      setError(failureMessage(failure, "HTML clipboard write failed."))
    }
  }

  return (
    <Stack ref={connect}>
      <Label htmlFor="public-document-html-source">HTML source</Label>
      <Textarea
        id="public-document-html-source"
        value={htmlSource}
        onChange={(event) => {
          setHTMLSource(event.target.value)
          setCopied(false)
        }}
      />
      <Button
        onClick={() => {
          run(() => importDocument(editor, htmlSource, "html"))
        }}
      >
        Import HTML source
      </Button>
      <Button
        onClick={() => {
          void copyRichHTML()
        }}
      >
        Copy rich HTML sample
      </Button>
      {copied ? <Box render={<output />}>Rich HTML sample copied.</Box> : null}
      {error ? <Text role="alert">{error}</Text> : null}
    </Stack>
  )
}

export function PublicDocumentHTMLExample() {
  return (
    <Box
      render={<section aria-labelledby="public-document-html-title" />}
      data-testid="public-document-html"
    >
      <Stack>
        <Heading id="public-document-html-title">Rich HTML clipboard</Heading>
        <Text>
          Paste rendered HTML from the clipboard. HTML source import accepts
          only supported, validated document markup.
        </Text>
        <EditorRoot ariaLabel="HTML editor" extensions={documentExtensions}>
          <EditorContent placeholder="Paste rich HTML here…" />
          <HTMLControls />
        </EditorRoot>
      </Stack>
    </Box>
  )
}

function MarkdownControls() {
  const editor = useEditor()
  const [markdown, setMarkdown] = useState(markdownSample)
  const [sourceRevision, setSourceRevision] = useState(0)
  const [html, setHTML] = useState("")
  const [markdownOutput, setMarkdownOutput] = useState("")
  const [error, setError] = useState("")
  const connect = useDocumentPasteRegistration(setError)

  function run(action: () => void) {
    try {
      action()
      setError("")
    } catch (failure) {
      setError(failureMessage(failure, "Markdown conversion failed."))
    }
  }

  function exportOutputs() {
    try {
      const nextHTML = exportDocument(editor, "html")
      const nextMarkdown = exportDocument(editor, "markdown")
      setHTML(nextHTML)
      setMarkdownOutput(nextMarkdown)
      setError("")
    } catch (cause) {
      setError(failureMessage(cause, "Markdown export failed."))
    }
  }

  return (
    <Stack ref={connect}>
      <Label htmlFor="public-document-markdown-source">Markdown source</Label>
      <Textarea
        id="public-document-markdown-source"
        value={markdown}
        onChange={(event) => {
          setMarkdown(event.target.value)
          setSourceRevision((revision) => revision + 1)
        }}
      />
      <Box data-testid="public-document-markdown-source-preview">
        <MarkdownSyntaxPreview
          markdown={markdown}
          revision={sourceRevision}
          ariaLabel="Markdown raw syntax preview"
        />
      </Box>
      <Button
        onClick={() => {
          run(() => importDocument(editor, markdown, "markdown"))
        }}
      >
        Import Markdown
      </Button>
      <Button onClick={exportOutputs}>Export document</Button>
      <Label htmlFor="public-document-markdown-output">Markdown output</Label>
      <Textarea
        id="public-document-markdown-output"
        readOnly
        value={markdownOutput}
      />
      <Label htmlFor="public-document-html-output">HTML output</Label>
      <Textarea id="public-document-html-output" readOnly value={html} />
      {html ? (
        <DocumentStatic html={html} aria-label="Markdown converted preview" />
      ) : null}
      {error ? <Text role="alert">{error}</Text> : null}
    </Stack>
  )
}

export function PublicDocumentMarkdownExample() {
  return (
    <Box
      render={<section aria-labelledby="public-document-markdown-title" />}
      data-testid="public-document-markdown"
    >
      <Stack>
        <Heading id="public-document-markdown-title">
          Markdown document import
        </Heading>
        <Text>
          Import supported Markdown into Lexical. Export it as Markdown or HTML,
          then read the HTML with the standalone static renderer.
        </Text>
        <EditorRoot ariaLabel="Markdown editor" extensions={documentExtensions}>
          <EditorContent placeholder="Imported Markdown appears here…" />
          <MarkdownControls />
        </EditorRoot>
      </Stack>
    </Box>
  )
}

type LocalMarkdownProducer = ReturnType<typeof createMarkdownProducer>

type LocalStreamingScenarioId = (typeof localStreamingScenarios)[number]["id"]

interface ActiveMarkdownStream {
  abort: AbortController
  producer: LocalMarkdownProducer
}

function StreamingControls() {
  const editor = useEditor()

  const [scenarioId, setScenarioId] = useState<LocalStreamingScenarioId>(
    localStreamingScenarios[0].id,
  )

  const [sourceRevision, setSourceRevision] = useState(0)
  const [speed, setSpeed] = useState("180")
  const [selectedPosition, setSelectedPosition] = useState(0)
  const [progressPosition, setProgressPosition] = useState(0)
  const [previewMode, setPreviewMode] = useState<"raw" | "progress">("raw")

  const [streamState, setStreamState] = useState<"idle" | "playing" | "paused">(
    "idle",
  )

  const [streaming, setStreaming] = useState("")
  const [convertedHTML, setConvertedHTML] = useState("")
  const [error, setError] = useState("")
  const stream = useRef<ActiveMarkdownStream | null>(null)

  const connect = useDocumentPasteRegistration(setError, () => {
    const active = stream.current
    stream.current = null
    active?.abort.abort()
  })

  const scenario =
    localStreamingScenarios.find((item) => item.id === scenarioId) ??
    localStreamingScenarios[0]

  const chunks = createMarkdownChunks(scenario.markdown)

  function launchStream(startAt: number) {
    stream.current?.abort.abort()
    const abort = new AbortController()
    let session: ActiveMarkdownStream | null = null

    const producer = createMarkdownProducer(
      chunks,
      abort.signal,
      startAt,
      Number(speed),
      (position) => {
        if (stream.current === session) setProgressPosition(position)
      },
    )

    session = { abort, producer }
    stream.current = session
    setStreamState("playing")
    setStreaming("")
    setProgressPosition(0)
    setConvertedHTML("")
    setError("")

    void streamMarkdown(editor, producer.chunks, {
      signal: abort.signal,
      onProgress(source) {
        if (stream.current === session) setStreaming(source)
      },
    })
      .then(() => {
        if (stream.current === session)
          setConvertedHTML(exportDocument(editor, "html"))
      })
      .catch((cause: unknown) => {
        if (stream.current === session)
          setError(failureMessage(cause, "Markdown stream failed."))
      })
      .finally(() => {
        if (stream.current !== session) return
        stream.current = null
        setStreamState("idle")
      })
  }

  function cancelStream() {
    const active = stream.current

    if (!active) return
    stream.current = null
    active.abort.abort()
    setStreamState("idle")
    setError("Stream cancelled.")
  }

  function changePosition(value: number | readonly number[]) {
    const result = producerPositionSchema.safeParse(value)

    if (!result.success) {
      setError("Invalid producer position.")

      return
    }

    setSelectedPosition(
      Math.max(0, Math.min(chunks.length, Math.round(result.data))),
    )
  }

  return (
    <Stack ref={connect}>
      <Text>
        Use fixed local scenarios. The producer makes no provider or network
        request. Seeking cancels the current run and replays from the start; it
        does not resume an aborted run.
      </Text>
      <Label htmlFor="public-document-stream-scenario">Stream scenario</Label>
      <NativeSelect
        id="public-document-stream-scenario"
        value={scenarioId}
        disabled={streamState !== "idle"}
        onChange={(event) => {
          const nextScenario = localStreamingScenarios.find(
            (item) => item.id === event.currentTarget.value,
          )

          if (!nextScenario) return
          setScenarioId(nextScenario.id)
          setSourceRevision((revision) => revision + 1)
          setSelectedPosition(0)
          setProgressPosition(0)
          setStreaming("")
          setConvertedHTML("")
          setError("")
        }}
      >
        {localStreamingScenarios.map((item) => (
          <option key={item.id} value={item.id}>
            {item.label}
          </option>
        ))}
      </NativeSelect>
      <Box data-testid="public-document-markdown-stream-source">
        <MarkdownSyntaxPreview
          markdown={scenario.markdown}
          revision={sourceRevision}
          ariaLabel="Raw Markdown source syntax preview"
        />
      </Box>
      <Label htmlFor="public-document-stream-speed">Producer speed</Label>
      <NativeSelect
        id="public-document-stream-speed"
        value={speed}
        onChange={(event) => {
          const nextSpeed = event.currentTarget.value
          setSpeed(nextSpeed)
          stream.current?.producer.setSpeed(Number(nextSpeed))
        }}
      >
        <option value="80">Fast</option>
        <option value="180">Steady</option>
        <option value="360">Slow</option>
      </NativeSelect>
      <Box render={<output />} aria-label="Selected producer position">
        Selected producer position: {selectedPosition} of {chunks.length} chunks
      </Box>
      <Slider
        aria-label="Producer position"
        min={0}
        max={chunks.length}
        step={1}
        value={selectedPosition}
        onValueChange={changePosition}
      />
      <Box render={<output />} aria-label="Producer progress">
        Producer progress: {progressPosition} of {chunks.length} chunks
      </Box>
      <Box render={<output />} aria-label="Producer state">
        {streamState === "paused"
          ? "Producer paused"
          : streamState === "playing"
            ? "Producer playing"
            : "Producer ready"}
      </Box>
      <Button
        disabled={selectedPosition === 0}
        onClick={() => {
          setSelectedPosition((position) => Math.max(0, position - 1))
        }}
      >
        Previous chunk
      </Button>
      <Button
        disabled={selectedPosition >= chunks.length}
        onClick={() => {
          setSelectedPosition((position) =>
            Math.min(chunks.length, position + 1),
          )
        }}
      >
        Next chunk
      </Button>
      <Button
        disabled={streamState !== "idle"}
        onClick={() => {
          launchStream(selectedPosition)
        }}
      >
        Stream local Markdown
      </Button>
      <Button
        disabled={streamState === "idle"}
        onClick={() => {
          launchStream(selectedPosition)
        }}
      >
        Restart at selected chunk
      </Button>
      <Button
        disabled={streamState !== "playing"}
        onClick={() => {
          stream.current?.producer.pause()
          setStreamState("paused")
        }}
      >
        Pause producer
      </Button>
      <Button
        disabled={streamState !== "paused"}
        onClick={() => {
          stream.current?.producer.resume()
          setStreamState("playing")
        }}
      >
        Resume producer
      </Button>
      <Button disabled={streamState === "idle"} onClick={cancelStream}>
        Cancel stream
      </Button>
      <Button
        aria-pressed={previewMode === "raw"}
        onClick={() => {
          setPreviewMode("raw")
        }}
      >
        Show raw source
      </Button>
      <Button
        aria-pressed={previewMode === "progress"}
        onClick={() => {
          setPreviewMode("progress")
        }}
      >
        Show stream progress
      </Button>
      {previewMode === "progress" ? (
        <>
          <Label htmlFor="public-document-streaming-output">
            Streaming output
          </Label>
          <Textarea
            id="public-document-streaming-output"
            readOnly
            aria-live="polite"
            value={streaming}
          />
        </>
      ) : null}
      {convertedHTML ? (
        <DocumentStatic
          html={convertedHTML}
          aria-label="Streamed Markdown converted preview"
        />
      ) : null}
      {error ? <Text role="alert">{error}</Text> : null}
    </Stack>
  )
}

export function PublicDocumentMarkdownStreamingExample() {
  return (
    <Box
      render={<section aria-labelledby="public-document-streaming-title" />}
      data-testid="public-document-markdown-streaming"
    >
      <Stack>
        <Heading id="public-document-streaming-title">
          Markdown streaming
        </Heading>
        <EditorRoot
          ariaLabel="Streaming editor"
          extensions={documentExtensions}
          initialState={initialStreamDocument}
        >
          <EditorContent placeholder="Streamed Markdown appears after EOF…" />
          <StreamingControls />
        </EditorRoot>
      </Stack>
    </Box>
  )
}

function MarkdownToLexicalControls() {
  const editor = useEditor()
  const [markdown, setMarkdown] = useState("")
  const [error, setError] = useState("")
  const pendingConversion = useRef<ReturnType<typeof setTimeout> | null>(null)

  const connect = useDocumentPasteRegistration(setError, () => {
    if (pendingConversion.current !== null)
      clearTimeout(pendingConversion.current)
  })

  function scheduleConversion(value: string) {
    setMarkdown(value)

    if (pendingConversion.current !== null)
      clearTimeout(pendingConversion.current)
    const original = editor.getEditorState()

    pendingConversion.current = setTimeout(() => {
      pendingConversion.current = null

      if (editor.getEditorState() !== original) {
        setError("Document changed before Markdown conversion.")

        return
      }

      try {
        importDocument(editor, value, "markdown")
        setError("")
      } catch (failure) {
        setError(failureMessage(failure, "Markdown conversion failed."))
      }
    }, 250)
  }

  return (
    <Stack ref={connect}>
      <Label htmlFor="public-document-markdown-to-lexical-source">
        Markdown to Lexical source
      </Label>
      <Textarea
        id="public-document-markdown-to-lexical-source"
        value={markdown}
        onChange={(event) => {
          scheduleConversion(event.target.value)
        }}
      />
      {error ? <Text role="alert">{error}</Text> : null}
    </Stack>
  )
}

export function PublicDocumentMarkdownToLexicalExample() {
  return (
    <Box
      render={
        <section aria-labelledby="public-document-markdown-to-lexical-title" />
      }
      data-testid="public-document-markdown-to-lexical"
    >
      <Stack>
        <Heading id="public-document-markdown-to-lexical-title">
          Markdown to Lexical
        </Heading>
        <Text>
          Keep Markdown in the source field. Convert supported input into a rich
          Lexical document after a short delay.
        </Text>
        <EditorRoot
          ariaLabel="Markdown to Lexical editor"
          extensions={documentExtensions}
          initialState={initialLexicalDocument}
        >
          <EditorContent placeholder="Converted Lexical document…" />
          <MarkdownToLexicalControls />
        </EditorRoot>
      </Stack>
    </Box>
  )
}

export function PublicDocumentExamples() {
  return (
    <Stack data-testid="public-document-example">
      <Heading>Public document examples</Heading>
      <Text>
        Use validated HTML and Markdown document APIs. Streaming imports commit
        only after they reach end of input.
      </Text>
      <PublicDocumentHTMLExample />
      <PublicDocumentMarkdownExample />
      <PublicDocumentMarkdownStreamingExample />
      <PublicDocumentMarkdownToLexicalExample />
    </Stack>
  )
}
