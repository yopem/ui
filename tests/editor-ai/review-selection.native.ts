import { createEditorAiSession } from "@editor/ai-session"
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  $setSelection,
  createEditor,
} from "lexical"
import assert from "node:assert/strict"

for (const change of ["format", "style", "null"] as const) {
  const editor = createEditor({
    namespace: "review",
    onError(error) {
      throw error
    },
  })

  editor.update(
    () => {
      const text = $createTextNode("Original")
      $getRoot().append($createParagraphNode().append(text))
      text.selectEnd()
    },
    { discrete: true },
  )
  const session = createEditorAiSession(editor)
  const unsubscribe = session.subscribe(() => undefined)

  const server = Bun.serve({
    hostname: "127.0.0.1",
    port: 0,
    fetch() {
      return new Response(
        'event: text\ndata: {"text":" proposal"}\n\nevent: complete\ndata: {"version":1}\n\n',
        { headers: { "content-type": "text/event-stream" } },
      )
    },
  })

  try {
    session.open("generate")
    await session.request(
      {
        endpoint: "/ai",
        documentId: "doc-1",
        headers() {
          return {}
        },
      },
      "fixture",
      server.url.origin,
    )
    assert.equal(session.getSnapshot().status, "ready")
    editor.update(
      () => {
        const selection = $getSelection()
        assert.ok($isRangeSelection(selection))

        if (change === "format") selection.toggleFormat("bold")
        else if (change === "style") selection.setStyle("color: red")
        else $setSelection(null)
      },
      { discrete: true },
    )
    const statusAfterFormatChange = session.getSnapshot().status
    const applied = session.approve()
    const text = editor.getEditorState().read(() => $getRoot().getTextContent())
    console.info(JSON.stringify({ statusAfterFormatChange, applied, text }))
    assert.equal(statusAfterFormatChange, change === "null" ? "ready" : "stale")
    assert.equal(applied, change === "null")
    assert.equal(text, change === "null" ? "Original proposal" : "Original")
  } finally {
    unsubscribe()
    await server.stop(true)
  }
}
