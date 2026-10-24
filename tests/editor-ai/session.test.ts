import { createEditorAiSession } from "@editor/ai-session"
import { expect, test } from "bun:test"
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $isTextNode,
  createEditor,
} from "lexical"

test("session fixture: stale content, changed selection and read-only invalidate without writes", () => {
  for (const mode of ["content", "selection", "readonly"] as const) {
    const editor = createEditor({
      namespace: "ai-fixture",
      onError(error) {
        throw error
      },
    })

    editor.update(
      () => {
        const node = $createTextNode("Original")
        $getRoot().append($createParagraphNode().append(node))
        node.select(0, 4)
      },
      { discrete: true },
    )
    const session = createEditorAiSession(editor)
    const unsubscribe = session.subscribe(() => undefined)
    session.open("rewrite")
    expect(session.getSnapshot().status).toBe("idle")

    if (mode === "readonly") editor.setEditable(false)
    else
      editor.update(
        () => {
          const node = $getRoot().getFirstDescendant()

          if (mode === "content" && $isTextNode(node))
            node.setTextContent("Changed")
          else node?.selectEnd()
        },
        { discrete: true },
      )
    expect(session.getSnapshot().status).toBe("stale")
    expect(session.approve()).toBe(false)
    unsubscribe()
  }
})
