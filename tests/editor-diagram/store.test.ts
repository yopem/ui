import { createEditorDiagramMetadata } from "@editor/diagram-model"
import { editorDiagramState } from "@editor/diagram-state"
import {
  createEditorDiagramStore,
  type EditorDiagramRenderers,
} from "@editor/diagram-store"
import {
  $createCodeNode,
  $isCodeNode,
  CodeHighlightNode,
  CodeNode,
} from "@lexical/code"
import { withDOM } from "@workspace/tests/fixtures/lexical-dom"
import { describe, expect, test } from "bun:test"
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $getSelection,
  $getState,
  $setState,
  createEditor,
} from "lexical"

const DOMParser = withDOM((window) => window.DOMParser)

const safeSvg =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2 2"><path d="M0 0h2v2H0z"/></svg>'

Reflect.set(globalThis, "DOMParser", DOMParser)

function setup(renderers?: EditorDiagramRenderers) {
  const editor = createEditor({
    namespace: "editor-diagram",
    nodes: [CodeNode, CodeHighlightNode],
    onError(error) {
      throw error
    },
  })

  editor.update(
    () => {
      const code = $createCodeNode("mermaid")
      $setState(
        code,
        editorDiagramState,
        createEditorDiagramMetadata("mermaid"),
      )
      code.append($createTextNode("graph TD; A-->B"))
      $getRoot().append(
        code,
        $createParagraphNode().append($createTextNode("keep")),
      )
      code.selectStart()
    },
    { discrete: true },
  )

  const store = createEditorDiagramStore(editor, { renderers })
  const unsubscribe = store.subscribe(() => undefined)

  return { editor, store, unsubscribe }
}

describe("editor diagram store", () => {
  for (const action of ["kind", "view", "delete", "insert"] as const) {
    test(`rejects ${action} during pending host content changes`, () => {
      const { editor, store, unsubscribe } = setup()

      try {
        editor.update(
          () => {
            $getRoot().append(
              $createParagraphNode().append($createTextNode("host change")),
            )

            if (action === "kind") store.setKind("graphviz")
            else if (action === "view") store.setViewMode("image")
            else if (action === "delete") store.delete()
            else store.insert("mermaid", "graph TD; X-->Y")
          },
          { discrete: true },
        )
        editor.getEditorState().read(() => {
          const codes = $getRoot().getChildren().filter($isCodeNode)
          expect(codes).toHaveLength(1)
          expect(codes[0]?.getTextContent()).toBe("graph TD; A-->B")
          expect(codes[0] && $getState(codes[0], editorDiagramState)).toEqual(
            createEditorDiagramMetadata("mermaid"),
          )
          expect($getRoot().getTextContent()).toContain("host change")
        })
      } finally {
        unsubscribe()
      }
    })
  }

  test("downloads only a current rendered target and rejects pending host changes", async () => {
    const { editor, store, unsubscribe } = setup({ mermaid: () => safeSvg })

    try {
      expect(await store.render()).toBe(true)
      const download = store.getDownload()
      expect(download?.svg).toContain("<svg")
      expect(download?.kind).toBe("mermaid")
      const revision = store.getRevision()
      editor.update(
        () => {
          $getRoot().append(
            $createParagraphNode().append($createTextNode("host change")),
          )
          expect(store.getDownload(revision)).toBeNull()
        },
        { discrete: true },
      )
      expect(store.getDownload(revision)).toBeNull()
    } finally {
      unsubscribe()
    }
  })

  test("persists diagram metadata on native code JSON and keeps code text", () => {
    const { editor, unsubscribe } = setup()
    const serialized = JSON.stringify(editor.getEditorState())
    const restored = editor.parseEditorState(serialized)

    restored.read(() => {
      const code = $getRoot().getFirstChildOrThrow()
      expect($isCodeNode(code)).toBe(true)
      expect(code.getTextContent()).toBe("graph TD; A-->B")
      expect($getState(code, editorDiagramState)).toEqual(
        createEditorDiagramMetadata("mermaid"),
      )
    })

    unsubscribe()
  })

  test("uses native code languages for each diagram kind", () => {
    const { editor, store, unsubscribe } = setup()

    try {
      for (const [kind, language] of [
        ["plantuml", "plant-uml"],
        ["graphviz", "dot"],
        ["flowchart", "text"],
        ["mermaid", "mermaid"],
      ] as const) {
        expect(store.setKind(kind)).toBe(true)
        editor.getEditorState().read(() => {
          const code = $getRoot().getFirstChildOrThrow<CodeNode>()
          expect(code.getLanguage()).toBe(language)
          expect($getState(code, editorDiagramState)?.kind).toBe(kind)
          expect(code.getTextContent()).toBe("graph TD; A-->B")
        })
      }
    } finally {
      unsubscribe()
    }
  })

  test("changes kind and view without changing native code or selection", () => {
    const { editor, store, unsubscribe } = setup()

    const selection = editor
      .getEditorState()
      .read(() => $getSelection()?.clone())

    const revision = store.getRevision()

    expect(store.setKind("plantuml", revision)).toBe(true)
    expect(store.setViewMode("image")).toBe(true)

    editor.getEditorState().read(() => {
      const code = $getRoot().getFirstChildOrThrow<CodeNode>()
      expect(code.getLanguage()).toBe("plant-uml")
      expect(code.getTextContent()).toBe("graph TD; A-->B")
      expect($getState(code, editorDiagramState)).toEqual({
        version: 1,
        kind: "plantuml",
        viewMode: "image",
      })
      expect($getSelection()?.is(selection ?? null)).toBe(true)
    })

    unsubscribe()
  })

  test("blocks metadata changes and deletion in read-only mode", () => {
    const { editor, store, unsubscribe } = setup()
    const revision = store.getRevision()

    editor.setEditable(false)
    expect(store.setKind("graphviz", revision)).toBe(false)
    expect(store.delete()).toBe(false)
    editor.getEditorState().read(() => {
      expect($getRoot().getChildrenSize()).toBe(2)
    })

    unsubscribe()
  })

  test("deletes only selected diagram and preserves adjacent host content", () => {
    const { editor, store, unsubscribe } = setup()

    expect(store.delete()).toBe(true)
    editor.getEditorState().read(() => {
      expect($getRoot().getChildrenSize()).toBe(1)
      expect($getRoot().getFirstChildOrThrow().getTextContent()).toBe("keep")
    })

    unsubscribe()
  })

  test("discards a stale renderer response after native source changes", async () => {
    let finish: ((value: string) => void) | undefined

    const { editor, store, unsubscribe } = setup({
      mermaid: () =>
        new Promise((resolve) => {
          finish = resolve
        }),
    })

    const pending = store.render()
    editor.update(
      () => {
        $getRoot()
          .getFirstChildOrThrow<CodeNode>()
          .append($createTextNode("\ngraph TD; B-->C"))
      },
      { discrete: true },
    )
    finish?.(safeSvg)

    expect(await pending).toBe(false)
    expect(store.getRenderSnapshot().status).not.toBe("ready")

    unsubscribe()
  })

  test("rejects a captured target after the live selection moves", () => {
    const { editor, store, unsubscribe } = setup()
    const revision = store.getRevision()

    editor.update(
      () => {
        $getRoot().getLastChildOrThrow().selectEnd()
      },
      { discrete: true },
    )

    expect(store.setKind("flowchart", revision)).toBe(false)
    expect(store.getSnapshot()).toBeNull()
    unsubscribe()
  })
})
