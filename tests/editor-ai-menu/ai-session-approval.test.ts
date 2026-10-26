import type { MouseEventHandler } from "react"

import { createEditorAiSession } from "@editor/ai-session"
import { documentNodes, importDocument } from "@yopem-ui/editor/document"
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

const nestedTargets = [
  {
    name: "quote",
    html: "<blockquote><p>Nested source</p><p>Nested following</p></blockquote><p>Root following</p>",
    parentType: "quote",
  },
  {
    name: "table cell",
    html: "<table><tr><td><p>Nested source</p><p>Nested following</p></td></tr></table><p>Root following</p>",
    parentType: "tablecell",
  },
  {
    name: "toggle body",
    html: '<section data-editor-toggle><div data-editor-toggle-summary>Toggle title</div><details data-editor-toggle-body open><summary data-editor-toggle-control contenteditable="false" aria-label="Toggle title"></summary><div data-editor-toggle-content><p>Nested source</p><p>Nested following</p></div></details></section><p>Root following</p>',
    parentType: "editor-toggle-body",
  },
] as const

for (const target of nestedTargets) {
  test(`approved below stays inside nested ${target.name}`, async () => {
    const editor = createEditor({
      namespace: `ai-menu-nested-${target.parentType}`,
      nodes: documentNodes,
      onError(error) {
        throw error
      },
    })

    importDocument(editor, target.html, "html")
    editor.update(
      () => {
        const text = $getRoot()
          .getAllTextNodes()
          .find((node) => node.getTextContent() === "Nested source")

        if (!text) throw new Error("Nested source is missing.")
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
          'event: text\ndata: {"text":"Proposal"}\n\nevent: complete\ndata: {"version":1}\n\n',
          { headers: { "content-type": "text/event-stream" } },
        )
      },
    })

    try {
      session.open("generate")
      expect(session.getSnapshot().status).toBe("idle")
      await session.request(
        {
          endpoint: "/ai",
          documentId: "ai-menu-nested-fixture",
          headers() {
            return {}
          },
        },
        "fixture proposal",
        server.url.origin,
      )
      expect(session.getSnapshot().status).toBe("ready")
      expect(session.approveBelow()).toBe(true)
      editor.getEditorState().read(() => {
        const proposal = $getRoot()
          .getAllTextNodes()
          .find((node) => node.getTextContent() === "Proposal")

        let block = proposal?.getParent()

        while (block && block.getType() !== "paragraph")
          block = block.getParent()
        const container = block?.getParent()

        expect(container?.getType()).toBe(target.parentType)
        expect(
          container?.getChildren().map((node) => node.getTextContent()),
        ).toEqual(["Nested source", "Proposal", "Nested following"])
        expect($getRoot().getTextContent()).toContain("Root following")
      })
    } finally {
      unsubscribe()
      await server.stop(true)
    }
  })
}
