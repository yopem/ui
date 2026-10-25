import type { MouseEventHandler } from "react"

import { createEditorAiSession } from "@editor/ai-session"
import { expect, test } from "bun:test"
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  createEditor,
} from "lexical"

for (const mode of ["replace", "below"] as const) {
  test(`approved ${mode} keeps its native boolean and event-handler contracts`, async () => {
    const editor = createEditor({
      namespace: "ai-menu-approval",
      onError(error) {
        throw error
      },
    })

    editor.update(
      () => {
        const original = $createTextNode("Original")
        $getRoot().append(
          $createParagraphNode().append(original),
          $createParagraphNode().append($createTextNode("Following")),
        )
        original.select(0, original.getTextContentSize())
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
          'event: text\ndata: {"text":"Proposal"}\n\nevent: complete\ndata: {"version":1}\n\n',
          { headers: { "content-type": "text/event-stream" } },
        )
      },
    })

    try {
      session.open("rewrite")
      await session.request(
        {
          endpoint: "/ai",
          documentId: "ai-menu-fixture",
          headers() {
            return {}
          },
        },
        "fixture proposal",
        server.url.origin,
      )
      expect(session.getSnapshot().status).toBe("ready")
      const onClick: MouseEventHandler<HTMLButtonElement> = session.approve
      expect(onClick).toBe(session.approve)

      const applied =
        mode === "below" ? session.approveBelow() : session.approve()

      expect(applied).toBe(true)
      expect(
        editor.getEditorState().read(() =>
          $getRoot()
            .getChildren()
            .map((node) => node.getTextContent()),
        ),
      ).toEqual(
        mode === "below"
          ? ["Original", "Proposal", "Following"]
          : ["Proposal", "Following"],
      )
      expect(session.getSnapshot().open).toBe(false)
    } finally {
      unsubscribe()
      await server.stop(true)
    }
  })
}
